import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
  type GraphNode,
  type ConditionalEdgeRouter,
} from '@langchain/langgraph';
import { AIMessage, SystemMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';
import { thauraModel } from './thaura.client.js';
import { createFatwaRetrieverTool } from './retriever.js';
import { SCREENING_SYSTEM_PROMPT } from './prompts.js';
import { config } from '../config.js';
import type { ScreenProposalResult } from './ai.service.js';

const State = new StateSchema({ messages: MessagesValue });

async function buildScreeningGraph() {
  const tavilyTool = new TavilySearch({
    tavilyApiKey: config.tavily.apiKey,
    maxResults: config.tavily.maxResults,
  });

  const retrieverTool = await createFatwaRetrieverTool();
  const tools = [tavilyTool, retrieverTool];
  const modelWithTools = thauraModel.bindTools(tools);

  const llmCall: GraphNode<typeof State> = async (state) => {
    const response = await modelWithTools.invoke([
      new SystemMessage(SCREENING_SYSTEM_PROMPT),
      ...state.messages,
    ]);
    return { messages: [response] };
  };

  const toolNode = new ToolNode(tools);

  const shouldContinue = (state: any) => {
    const last = state.messages.at(-1);
    if (AIMessage.isInstance(last) && last.tool_calls?.length) return 'tools';
    return END;
  };

  return new StateGraph(State)
    .addNode('llmCall', llmCall)
    .addNode('tools', toolNode)
    .addEdge(START, 'llmCall')
    .addConditionalEdges('llmCall', shouldContinue, ['tools', END])
    .addEdge('tools', 'llmCall')
    .compile();
}

let _screeningGraph: Awaited<ReturnType<typeof buildScreeningGraph>> | null = null;

export async function getScreeningGraph() {
  if (!_screeningGraph) _screeningGraph = await buildScreeningGraph();
  return _screeningGraph;
}

export function parseScreeningOutput(content: string): ScreenProposalResult {
  try {
    // Strip markdown code fences if present
    const json = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(json) as ScreenProposalResult;
  } catch {
    return {
      summary: content,
      recommendation: 'NEEDS_REVIEW',
      confidence: 0.5,
      concerns: [],
      suggestions: [],
      citations: [],
    };
  }
}

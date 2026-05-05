import {
  StateGraph,
  StateSchema,
  MessagesValue,
  START,
  END,
  type GraphNode,
  type ConditionalEdgeRouter,
} from '@langchain/langgraph';
import { AIMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { TavilySearch } from '@langchain/tavily';
import { thauraModel } from './thaura.client.js';
import { createFatwaRetrieverTool } from './retriever.js';
import { CHAT_SYSTEM_PROMPT } from './prompts.js';
import { config } from '../config.js';

const State = new StateSchema({ messages: MessagesValue });

async function buildChatGraph() {
  const tavilyTool = new TavilySearch({
    tavilyApiKey: config.tavily.apiKey,
    maxResults: config.tavily.maxResults,
  });

  const retrieverTool = await createFatwaRetrieverTool();
  const tools = [tavilyTool, retrieverTool];
  const modelWithTools = thauraModel.bindTools(tools);

  const llmCall: GraphNode<typeof State> = async (state) => {
    const response = await modelWithTools.invoke([
      new SystemMessage(CHAT_SYSTEM_PROMPT),
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

// Lazy singleton — initialized on first use
let _chatGraph: Awaited<ReturnType<typeof buildChatGraph>> | null = null;

export async function getChatGraph() {
  if (!_chatGraph) _chatGraph = await buildChatGraph();
  return _chatGraph;
}

export type ChatGraphState = { messages: BaseMessage[] };

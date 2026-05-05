import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { paperService } from '../services/paper.service.js';
import { generateEmbedding } from '../embeddings/service.js';
import type { FastifyInstance } from 'fastify';

export function createMcpServer() {
  const server = new McpServer({
    name: 'tawf-ai',
    version: '1.0.0',
  });

  server.tool(
    'search_fatwa',
    'Semantic search over indexed Islamic scholarly papers and fatwas using vector similarity',
    {
      query: z.string().describe('The search query in any language'),
      limit: z.number().int().min(1).max(20).default(5).describe('Number of results to return'),
    },
    async ({ query, limit }) => {
      const embedding = await generateEmbedding(query);
      const results = await paperService.searchPapers(embedding, limit, 0.5);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    'get_paper',
    'Get full details of a specific scholarly paper or fatwa by ID',
    {
      id: z.string().describe('The paper ID'),
    },
    async ({ id }) => {
      const paper = await paperService.getPaper(id);
      if (!paper) {
        return { content: [{ type: 'text', text: 'Paper not found' }], isError: true };
      }
      return { content: [{ type: 'text', text: JSON.stringify(paper, null, 2) }] };
    }
  );

  server.tool(
    'list_papers',
    'List indexed Islamic scholarly papers with optional filtering',
    {
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(10),
      source: z.string().optional().describe('Filter by source (e.g. islamqa, darulifta)'),
      search: z.string().optional().describe('Text search in title and content'),
    },
    async ({ page, limit, source, search }) => {
      const result = await paperService.listPapers({ page, limit, source, search });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  return server;
}

export async function registerMcpRoutes(app: FastifyInstance) {
  const transports = new Map<string, SSEServerTransport>();

  // SSE endpoint — client connects here to receive messages
  app.get('/mcp', async (req, reply) => {
    const server = createMcpServer();
    const transport = new SSEServerTransport('/mcp/message', reply.raw);
    transports.set(transport.sessionId, transport);

    reply.raw.on('close', () => transports.delete(transport.sessionId));

    await server.connect(transport);
    await transport.start();
  });

  // POST endpoint — client sends messages here
  app.post('/mcp/message', async (req, reply) => {
    const sessionId = req.query as any;
    const transport = transports.get(sessionId?.sessionId);
    if (!transport) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    await transport.handlePostMessage(req.raw, reply.raw, req.body);
  });
}

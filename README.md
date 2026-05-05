# Tawf-AI

AI-based pre-screening system for Sharia/Fatwa decisions. Tawf-AI scrapes the internet for Islamic scholarly papers, stores them in a vector database, and provides both a conversational API and a proposal pre-screening API with accurate citations.

## Project Overview

Tawf-AI helps researchers and institutions pre-screen Islamic fatwa proposals by:
- **Automated Scraping**: Collects scholarly papers from trusted Islamic sources
- **Semantic Search**: Uses vector embeddings to find relevant content
- **RAG-Powered AI**: Retrieves and cites relevant sources in responses
- **Pre-Screening API**: Evaluates proposals against existing scholarly consensus

## Features

- 🔄 **Web Scraper**: Automated scraping of Islamic scholarly sources
- 🔍 **Semantic Search**: Vector-based search using pgvector
- 💬 **Conversational API**: Chat interface with source citations
- 📋 **Proposal Pre-Screening**: Evaluate proposals against scholarly consensus
- 🤖 **MCP Server**: Connect any MCP-compatible AI agent directly to the fatwa database
- 🐳 **Docker Support**: Easy local development setup
- 📊 **PostgreSQL + pgvector**: Efficient vector similarity search

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Tawf-AI System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────────────────────────────┐   │
│  │  Web Scraper │───▶│             Supabase                 │   │
│  │  (Playwright)│    │  ┌─────────────┐  ┌───────────────┐ │   │
│  └──────┬───────┘    │  │  PostgreSQL  │  │   pgvector    │ │   │
│         │            │  │  (Papers,   │  │  (Embeddings) │ │   │
│         ▼            │  │  Chats,     │  └───────────────┘ │   │
│  ┌──────────────┐    │  │  Screening) │                    │   │
│  │  Auto-Embed  │───▶│  └─────────────┘                    │   │
│  │  (OpenAI)    │    └──────────────────────────────────────┘   │
│  └──────────────┘                      │                         │
│                                        ▼                         │
│                              ┌───────────────────┐              │
│                              │    AI Service     │              │
│                              │  Thaura (LLM)     │              │
│                              │  LangGraph (RAG)  │              │
│                              │  Tavily (Search)  │              │
│                              └─────────┬─────────┘              │
│                                        │                         │
│         ┌──────────────────────────────┼──────────────┐         │
│         ▼                              ▼              ▼         │
│ ┌──────────────┐             ┌──────────────┐ ┌──────────────┐ │
│ │  MCP Server  │             │ Screening    │ │  Papers API  │ │
│ │  /mcp (SSE)  │             │    API       │ │ (Search/List)│ │
│ └──────┬───────┘             └──────────────┘ └──────────────┘ │
│        │                                                         │
│        ▼                              ▼                          │
│ ┌──────────────┐             ┌──────────────┐                   │
│ │  AI Agents   │             │   Chat API   │                   │
│ │ Claude/Cursor│             │              │                   │
│ └──────────────┘             └──────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Scraping & Indexing Flow

When a scrape job runs, each paper is automatically:
1. **Scraped** from the source URL via Playwright + Cheerio
2. **Saved** to the `Paper` table in Supabase (upserted by URL)
3. **Chunked & embedded** immediately via OpenAI embeddings into `PaperChunk` with pgvector

This means papers are fully searchable as soon as they are scraped — no separate `npm run embed` step required.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Language** | TypeScript (Node.js) |
| **Framework** | Fastify |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **AI Model** | Thaura (via API) |
| **Embeddings** | OpenAI-compatible |
| **RAG** | LangChain + LangGraph |
| **Web Search** | Tavily |
| **Web Scraping** | Playwright + Cheerio |
| **Container** | Docker + Docker Compose |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local PostgreSQL)
- Supabase project (or self-hosted)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/tawf-ai.git
cd tawf-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials and API keys
```

4. **Run database migrations**

Create the tables and the `match_paper_chunks` vector search function in your Supabase SQL editor. See [Database Schema](#database-schema) below.

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tawfai"

# AI Service
THAURA_API_KEY=your_thaura_api_key
THAURA_BASE_URL=https://backend.thaura.ai/v1

# Embeddings (OpenAI-compatible)
EMBEDDINGS_API_KEY=your_openai_api_key
EMBEDDINGS_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Web Search
TAVILY_API_KEY=your_tavily_api_key

# Scraper
SCRAPER_USER_AGENT=Tawf-AI/1.0
SCRAPER_CONCURRENCY=3
SCRAPER_DELAY_MS=1000

# API Keys (optional)
API_KEY_ENABLED=false
API_KEY=your_api_key_here
```

## API Documentation

### Health & Status

#### `GET /health`
Health check endpoint.

**Response**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### `GET /api/v1/status`
System status with indexed papers count.

**Response**
```json
{
  "papersIndexed": 1234,
  "conversationsCount": 56,
  "version": "1.0.0"
}
```

### Paper Management

#### `GET /api/v1/papers`
List papers with pagination and filters.

**Query Parameters**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `source` (string): Filter by source
- `search` (string): Text search

**Response**
```json
{
  "data": [
    {
      "id": "clx1234567890",
      "title": "On the Permissibility of Digital Contracts",
      "source": "darulifta",
      "url": "https://example.com/fatwa/123",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1234,
    "totalPages": 62
  }
}
```

#### `GET /api/v1/papers/:id`
Get detailed paper information.

#### `POST /api/v1/papers/search`
Semantic search using vector embeddings.

**Request**
```json
{
  "query": "Is cryptocurrency halal?",
  "limit": 10
}
```

**Response**
```json
{
  "results": [
    {
      "paper": {
        "id": "clx123",
        "title": "Ruling on Cryptocurrency",
        "source": "islamqa"
      },
      "similarity": 0.95,
      "excerpt": "Based on the principles of Islamic finance..."
    }
  ]
}
```

### Chat / Conversation

#### `POST /api/v1/chat`
Send a message and get AI response with citations.

**Request**
```json
{
  "message": "What is the Islamic ruling on cryptocurrency?",
  "conversationId": "optional-conversation-id"
}
```

**Response**
```json
{
  "conversationId": "clx123",
  "messageId": "clx456",
  "response": "Based on scholarly consensus...",
  "citations": [
    {
      "paperId": "clx789",
      "title": "Ruling on Digital Currencies",
      "source": "islamqa",
      "url": "https://islamqa.info/123456",
      "relevance": 0.95
    }
  ],
  "sources": ["https://islamqa.info/123456"]
}
```

#### `GET /api/v1/chat/conversations`
List all conversations.

#### `GET /api/v1/chat/conversations/:id`
Get conversation history with messages.

### Pre-Screening

#### `POST /api/v1/screening/proposal`
Submit a proposal for pre-screening.

**Request**
```json
{
  "title": "Proposal for Sharia-Compliant DeFi Protocol",
  "abstract": "This proposal outlines...",
  "keywords": ["defi", "smart-contracts", "halal"],
  "category": "finance"
}
```

**Response**
```json
{
  "id": "scr_123",
  "status": "processing",
  "estimatedTime": 30
}
```

#### `GET /api/v1/screening/:id`
Get screening result.

**Response**
```json
{
  "id": "scr_123",
  "status": "completed",
  "summary": "The proposal aligns with existing scholarly consensus...",
  "recommendation": "approved",
  "confidence": 0.87,
  "citations": [
    {
      "paperId": "clx123",
      "title": "Smart Contracts in Islamic Finance",
      "excerpt": "Smart contracts that avoid riba are permissible...",
      "relevance": 0.92
    }
  ],
  "concerns": [],
  "suggestions": [
    "Consider implementing profit-sharing mechanism (Mudarabah)"
  ]
}
```

#### `POST /api/v1/screening/:id/feedback`
Provide feedback on screening results (for improvement).

### MCP Server

Tawf-AI exposes an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server at `/mcp`, allowing any MCP-compatible AI agent (Claude Desktop, Cursor, Copilot, etc.) to query the fatwa database directly as a tool.

#### Connect via MCP

```bash
# Claude Desktop — add to claude_desktop_config.json
{
  "mcpServers": {
    "tawf-ai": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

#### Available MCP Tools

| Tool | Description |
|------|-------------|
| `search_fatwa` | Semantic vector search over all indexed papers. Takes `query` (string) and optional `limit` (1–20). |
| `get_paper` | Fetch full paper details by `id`. |
| `list_papers` | Paginated list with optional `source` and `search` filters. |

#### Example (via REST for testing)

```bash
# Semantic search
curl -X POST https://your-deployment.com/api/v1/papers/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Is cryptocurrency halal?", "limit": 5}'
```

### Scraper

#### `POST /api/v1/scrape/trigger`
Trigger a scraping job.

**Request**
```json
{
  "sources": ["islamqa", "darulifta"],
  "force": false
}
```

**Response**
```json
{
  "jobId": "job_123",
  "status": "started",
  "sourcesCount": 2
}
```

#### `GET /api/v1/scrape/status`
Get scraping status.

**Response**
```json
{
  "status": "running",
  "activeJobs": 1,
  "completedJobs": 45,
  "failedJobs": 2,
  "totalPapers": 1234
}
```

## Database Schema

### Core Tables

```sql
-- Papers and chunks
create table "Paper" (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  content text not null,
  source text not null,
  url text unique not null,
  author text,
  "fatwaNumber" text,
  "publishedAt" timestamptz,
  language text default 'en',
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table "PaperChunk" (
  id text primary key default gen_random_uuid()::text,
  "paperId" text references "Paper"(id) on delete cascade,
  content text not null,
  "chunkIndex" int,
  embedding vector(1536),
  metadata jsonb,
  "createdAt" timestamptz default now()
);

-- Conversations
create table "Conversation" (
  id text primary key default gen_random_uuid()::text,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table "Message" (
  id text primary key default gen_random_uuid()::text,
  "conversationId" text references "Conversation"(id) on delete cascade,
  role text not null, -- 'USER' | 'ASSISTANT'
  content text not null,
  citations jsonb,
  "createdAt" timestamptz default now()
);

-- Screening
create table "ScreeningRequest" (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  abstract text not null,
  keywords text[],
  category text,
  status text default 'PENDING',
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create table "ScreeningResult" (
  id text primary key default gen_random_uuid()::text,
  "requestId" text unique references "ScreeningRequest"(id) on delete cascade,
  summary text not null,
  recommendation text not null,
  confidence float not null,
  concerns text[],
  suggestions text[],
  "completedAt" timestamptz,
  "createdAt" timestamptz default now()
);

create table "ScreeningCitation" (
  id text primary key default gen_random_uuid()::text,
  "resultId" text references "ScreeningResult"(id) on delete cascade,
  "paperId" text references "Paper"(id) on delete cascade,
  excerpt text not null,
  relevance float not null,
  "createdAt" timestamptz default now()
);

-- Scrape jobs
create table "ScrapeJob" (
  id text primary key default gen_random_uuid()::text,
  source text not null,
  status text default 'RUNNING',
  "papersFound" int default 0,
  "papersStored" int default 0,
  error text,
  "startedAt" timestamptz default now(),
  "completedAt" timestamptz
);
```

### Vector Search Function

```sql
create or replace function match_paper_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id text, paper_id text, title text, source text, url text, content text, similarity float
)
language sql stable as $$
  select
    pc.id, pc."paperId" as paper_id, p.title, p.source, p.url, pc.content,
    1 - (pc.embedding <=> query_embedding) as similarity
  from "PaperChunk" pc
  join "Paper" p on p.id = pc."paperId"
  where pc.embedding is not null
    and 1 - (pc.embedding <=> query_embedding) > match_threshold
  order by pc.embedding <=> query_embedding
  limit match_count;
$$;
```

## Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:seed      # Seed database

# Scraping
npm run scrape       # Run scraper
npm run embed        # Generate embeddings

# Testing
npm run test         # Run all tests
npm run test:unit    # Run unit tests
npm run test:e2e     # Run e2e tests
```

## Docker Deployment

### Local Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Apache License 2.0 - see LICENSE file for details.

Copyright 2026 Tawf Labs

## Disclaimer

Tawf-AI is an AI-powered pre-screening tool and should not be considered as a substitute for qualified scholarly consultation. Always verify rulings with qualified Islamic scholars.

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
- 🐳 **Docker Support**: Easy local development setup
- 📊 **PostgreSQL + pgvector**: Efficient vector similarity search

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Tawf-AI System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Web Scraper │───▶│  Paper Store │◀───│   Chat API   │      │
│  │              │    │  (PostgreSQL)│    │              │      │
│  └──────────────┘    └──────┬───────┘    └──────────────┘      │
│                              │                                   │
│                              ▼                                   │
│                      ┌───────────────┐                          │
│                      │ Vector Search │                          │
│                      │   (pgvector)  │                          │
│                      └───────┬───────┘                          │
│                              │                                   │
│                              ▼                                   │
│                      ┌───────────────┐                          │
│                      │ AI Service    │                          │
│                      │ (QWEN/OLLAMA) │                          │
│                      └───────┬───────┘                          │
│                              │                                   │
│              ┌───────────────┼───────────────┐                  │
│              ▼               ▼               ▼                  │
│      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│      │  Chat API    │ │ Screening    │ │  Search API  │        │
│      │              │ │    API       │ │              │        │
│      └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Language** | TypeScript (Node.js) |
| **Framework** | Fastify |
| **Database** | PostgreSQL + pgvector |
| **ORM** | Prisma |
| **AI Model** | QWEN (via Ollama/API) |
| **Embeddings** | OpenAI / HuggingFace |
| **Web Scraping** | Playwright + Cheerio |
| **Container** | Docker + Docker Compose |

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Ollama (for local AI) or OpenAI API key

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
# Edit .env with your configuration
```

4. **Start PostgreSQL**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npx prisma migrate dev
```

6. **Generate Prisma client**
```bash
npx prisma generate
```

7. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tawfai?schema=public"

# AI Service
AI_PROVIDER=ollama  # ollama | openai | qwen
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b
OPENAI_API_KEY=your_openai_api_key

# Embeddings
EMBEDDING_PROVIDER=ollama  # ollama | openai | huggingface
EMBEDDING_MODEL=nomic-embed-text
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Scraper
SCRAPER_USER_AGENT=Tawf-AI/1.0
SCRAPER_CONCURRENCY=3
SCRAPER_DELAY_MS=1000

# API Keys (optional)
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

### Core Models

```prisma
model Paper {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  source      String
  url         String   @unique
  author      String?
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  chunks      PaperChunk[]
}

model PaperChunk {
  id         String   @id @default(cuid())
  paperId    String
  paper      Paper    @relation(fields: [paperId], references: [id], onDelete: Cascade)
  content    String   @db.Text
  embedding  Unsupported("vector(1536)")?
  createdAt  DateTime @default(now())

  @@index([paperId])
}

model Conversation {
  id        String    @id @default(cuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String       // 'user' | 'assistant'
  content        String       @db.Text
  citations      Json?
  createdAt      DateTime     @default(now())

  @@index([conversationId])
}

model ScreeningRequest {
  id         String            @id @default(cuid())
  title      String
  abstract   String            @db.Text
  keywords   String[]
  category   String?
  status     String            @default("processing")
  result     ScreeningResult?
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
}

model ScreeningResult {
  id             String           @id @default(cuid())
  requestId      String           @unique
  request        ScreeningRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  summary        String           @db.Text
  recommendation String
  confidence     Float
  citations      Json
  concerns       String[]
  suggestions    String[]
  completedAt    DateTime?
}
```

## Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:migrate   # Run migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database
npm run db:reset     # Reset database

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

MIT License - see LICENSE file for details.

## Disclaimer

Tawf-AI is an AI-powered pre-screening tool and should not be considered as a substitute for qualified scholarly consultation. Always verify rulings with qualified Islamic scholars.

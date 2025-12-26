# Nexus Command Dashboard

## Overview

A full-stack TypeScript application featuring a Telegram bot with AI integration and a cyberpunk-themed monitoring dashboard. The system manages users through Telegram interactions, stores data in PostgreSQL, and provides real-time status monitoring through a React frontend with a terminal/hacker aesthetic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom cyberpunk/terminal theme (cyan on dark background with glitch effects)
- **Animations**: Framer Motion for sophisticated UI animations
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Bot Integration**: Telegram Bot API using `node-telegram-bot-api` with polling mode
- **Build Process**: esbuild for server bundling, Vite for client bundling

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push` command
- **Tables**: 
  - `users` - Telegram user accounts with roles (operator/admin/user)
  - `config` - Key-value configuration storage
  - `conversations` and `messages` - AI chat history

### AI Integrations
Located in `server/replit_integrations/`:
- **Chat**: OpenAI-powered conversation endpoints with persistent storage
- **Image**: Image generation using OpenAI's gpt-image-1 model
- **Batch**: Utility for rate-limited batch processing of LLM requests

### API Structure
Routes defined in `shared/routes.ts` using Zod schemas:
- `GET /api/status` - System health and uptime
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get specific user
- `POST /api/conversations` - Create chat conversation
- `POST /api/generate-image` - Generate AI images

## External Dependencies

### Database
- **PostgreSQL**: Required, connection via `DATABASE_URL` environment variable
- **Session Storage**: `connect-pg-simple` for Express sessions

### AI Services
- **OpenAI API**: Used for chat and image generation
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Bot Platform
- **Telegram Bot API**: Requires `TELEGRAM_BOT_TOKEN` environment variable
- First user to interact becomes the "operator" role automatically

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `node-telegram-bot-api` - Telegram bot client
- `openai` - OpenAI API client
- `p-limit` / `p-retry` - Rate limiting for batch operations
- Full Radix UI component suite for accessible UI primitives
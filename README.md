# AI Chat Assistant - Production-Grade Full-Stack Web App

A modern, responsive, real-time AI Chat Assistant built with **Node.js/Express**, **React (Vite)**, **Tailwind CSS**, and **MongoDB (Mongoose)**. Features real-time Server-Sent Events (SSE) streaming, dynamic server-driven Tone Toggles, syntax-highlighted code rendering with one-click copy, robust stream controls (stop and regenerate), automatic thread titling, and complete session persistence.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
   - [The Vibe Check: Tone Toggle](#the-vibe-check-tone-toggle)
   - [Two Extra Features](#two-extra-features)
   - [Core UI & UX Features](#core-ui--ux-features)
3. [Architecture & Design](#architecture--design)
   - [System Architecture](#system-architecture)
   - [Monorepo Directory Structure](#monorepo-directory-structure)
   - [Tone Toggle Flow](#tone-toggle-flow)
4. [Tech Stack](#tech-stack)
5. [Prerequisites](#prerequisites)
6. [Environment Variables](#environment-variables)
7. [Step-by-Step Run Instructions](#step-by-step-run-instructions)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
   - [Running Tests](#running-tests)
8. [API Reference](#api-reference)
9. [Design Decisions & Trade-offs](#design-decisions--trade-offs)
10. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## 1. Project Overview

The **AI Chat Assistant** is an intelligent conversational platform engineered with enterprise-level standards:
- **Clean Layered Architecture**: Clear separation of concerns between presentation, controllers, services, database models, and LLM provider adapters.
- **Offline & Demo Capable**: Ships with an offline **Mock LLM Provider** (`LLM_PROVIDER=mock`) requiring zero API keys, which generates realistic, streaming, tone-sensitive responses with Markdown and code blocks.
- **Provider Agnostic**: Seamlessly toggle between **Anthropic Claude**, **OpenAI GPT**, or **Mock** via environment variables without altering application code.
- **Fault Tolerant**: Graceful degradation if MongoDB or LLM API keys are unavailable, providing user-friendly UI error notifications.

---

## 2. Key Features

### The Vibe Check: Tone Toggle
- Three selectable tones:
  1. **Professional**: Formal, structured, authoritative, devoid of slang, emojis, or casual contractions. Clear headings and bullet points.
  2. **Casual**: Friendly, warm, conversational, natural contractions, and light relevant emojis (😊, 🎉).
  3. **Concise**: Ultra-brief responses, maximum 2–3 sentences or a tight bullet list, zero filler.
- **Server-Side Enforcement**: The frontend sends only the tone key (`professional`, `casual`, `concise`). The backend maintains the canonical mapping to system instructions (`src/config/tones.js`) and attaches the system prompt to each LLM request.
- **Mid-Conversation Tone Switching**: Changing the tone takes effect on the very next response while preserving the full conversational context.
- **Tone Auditability**: Each assistant message stores the tone in MongoDB and displays a visual tone badge on its message bubble.

### Two Extra Features

1. **Rich Markdown & Code Rendering with One-Click Copy**:
   - Renders GitHub-Flavored Markdown (GFM tables, blockquotes, lists, bold/italics).
   - Formats syntax-highlighted code blocks with language indicators.
   - Includes an accessible one-click **"Copy"** button with visual feedback (`Copied!`).
   - Engineered to render cleanly **during streaming** as tokens arrive chunk-by-chunk.
   - *Why chosen*: Technical and knowledge-based conversations frequently require formatted code and structured text; real-time copy functionality provides high productivity.

2. **Stream Controls (Stop Generating & Regenerate)**:
   - **Stop Generating**: Allows the user to abort an in-flight SSE stream at any point. The client sends an abort signal which immediately cancels the upstream LLM call and persists whatever partial text was generated.
   - **Regenerate Response**: A dedicated button on the latest AI reply that removes the previous assistant message and re-queries the model using the currently selected tone.
   - *Why chosen*: Gives users complete agency over token consumption, latency, and tone experimentation without having to re-type prompts.

### Automatic Conversation Titles
- After the first question-and-answer exchange, the backend generates a descriptive 4–6 word title for the thread. If the model call fails or mock mode is active, it seamlessly falls back to the first 6 words of the user prompt.

### Core UI & UX Features
- **Smart Auto-Scroll**: Automatically scrolls to newly arrived streaming tokens, but detects if the user has scrolled up to read history and prevents disruptive force-scrolling. Displays a floating "Scroll to bottom" button when scrolled up.
- **Collapsible History Sidebar**: New chat button, thread selection, inline thread renaming, and safe deletion with confirmation. Collapses into a mobile-friendly overlay drawer.
- **Light & Dark Theme**: Full theme support toggled via header or sidebar with persistence in LocalStorage.
- **Accessibility & Keyboard Navigation**: `Enter` to send, `Shift+Enter` for newlines, labeled focus states, and aria attributes.

---

## 3. Architecture & Design

### System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite UI                      │
│   (AppStore / useChat / useConversations / Components)  │
└───────────────────────────┬────────────────────────────┘
                            │ REST (CRUD) / SSE (Streaming)
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Express.js Backend                     │
│  ├── Helmet / CORS / Rate Limiting                     │
│  ├── Zod Request Validation                            │
│  ├── Controllers (Thin: Conversation & Chat)           │
│  ├── Services (Conversation, Title Generation)         │
│  └── LLM Provider Factory                              │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
    ┌──────────────────────┐    ┌───────────────────────────┐
    │   MongoDB Database   │    │    LLM Provider Adapter   │
    │  - Conversation      │    │  ├── Anthropic (Claude)   │
    │  - Indexed messages  │    │  ├── OpenAI (GPT-4o)      │
    │  - Tone & Timestamps │    │  └── Mock Stream Engine   │
    └──────────────────────┘    └───────────────────────────┘
```

### Monorepo Directory Structure

```
chat-assistant/
├── README.md                     # Comprehensive documentation
├── .gitignore                    # Git exclusions
├── backend/
│   ├── package.json              # Backend dependencies and scripts
│   ├── .env.example              # Environment variables template
│   ├── __tests__/                # Automated test suites
│   │   ├── tones.test.js         # Tone mapping and configuration tests
│   │   ├── validation.test.js    # Zod validation schema tests
│   │   ├── llm.test.js           # Mock LLM provider streaming tests
│   │   ├── conversation.service.test.js # Service logic tests
│   │   └── routes.unit.test.js   # Controller and route unit tests
│   └── src/
│       ├── server.js             # Bootstrap, MongoDB connection & graceful shutdown
│       ├── app.js                # Express app, middleware, routes
│       ├── config/
│       │   ├── env.js            # Validated environment configuration (Zod)
│       │   └── tones.js          # Canonical Tone -> System prompt definitions
│       ├── controllers/
│       │   ├── chat.controller.js         # SSE streaming and regeneration logic
│       │   └── conversation.controller.js # Conversation CRUD handlers
│       ├── middleware/
│       │   ├── errorHandler.js   # Centralized error handler
│       │   ├── rateLimiter.js    # Express rate limiters
│       │   └── validate.js       # Zod validation middleware
│       ├── models/
│       │   └── Conversation.js   # Mongoose schema with messages & tones
│       ├── routes/
│       │   ├── chat.routes.js    # /api/chat endpoints
│       │   └── conversation.routes.js # /api/conversations endpoints
│       ├── services/
│       │   ├── conversation.service.js # Database operations
│       │   ├── title.service.js  # Async smart thread titling
│       │   └── llm/
│       │       ├── index.js      # Provider factory
│       │       ├── mock.js       # Offline mock streaming provider
│       │       ├── anthropic.js  # Official @anthropic-ai/sdk adapter
│       │       └── openai.js     # Official openai SDK adapter
│       └── utils/
│           ├── logger.js         # Timestamped logger
│           └── sse.js            # Server-Sent Events helper
└── frontend/
    ├── package.json              # Frontend dependencies and scripts
    ├── .env.example              # Frontend environment template
    ├── vite.config.js            # Vite configuration with /api proxy
    ├── tailwind.config.js        # Tailwind CSS theme and animations
    ├── postcss.config.js         # PostCSS configuration
    ├── index.html                # Single-page HTML root
    └── src/
        ├── main.jsx              # React DOM entrypoint
        ├── App.jsx               # Main application layout and state coordination
        ├── api/
        │   ├── client.js         # REST API client
        │   └── streaming.js      # Fetch + ReadableStream + AbortController SSE reader
        ├── context/
        │   └── appStore.js       # Zustand store (theme, tone, sidebar)
        ├── hooks/
        │   ├── useChat.js        # Active conversation, streaming, abort & regenerate
        │   └── useConversations.js # Thread list, rename, delete, touch
        ├── styles/
        │   └── index.css         # Tailwind directives and custom prose styling
        └── components/
            ├── ChatWindow.jsx    # Scroll container, auto-scroll, empty states
            ├── MessageBubble.jsx # Visual bubbles, tone badges, timestamps
            ├── MessageInput.jsx  # Textarea, Send, and Stop Generating controls
            ├── ToneToggle.jsx    # Professional / Casual / Concise switch
            ├── ThemeToggle.jsx   # Light / Dark mode switcher
            ├── Sidebar.jsx       # History list, thread search, rename, delete
            ├── MarkdownRenderer.jsx # GFM markdown with streaming cursor
            └── CodeBlock.jsx     # Syntax highlighter with Copy-to-Clipboard
```

---

## 4. Tech Stack

- **Backend**:
  - Runtime: Node.js (v18+)
  - Framework: Express.js
  - Validation: Zod
  - Security: Helmet, CORS, Express-Rate-Limit
  - Database: MongoDB via Mongoose ORM
  - AI SDKs: `@anthropic-ai/sdk`, `openai`
  - Testing: Jest, Supertest

- **Frontend**:
  - Framework: React 18 + Vite
  - Styling: Tailwind CSS, PostCSS, Lucide Icons
  - Markdown & Syntax: `react-markdown`, `remark-gfm`, `react-syntax-highlighter`
  - State Management: Zustand with localStorage persistence
  - Streaming: Native `fetch` + `ReadableStream` + `AbortController`

---

## 5. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (default: `mongodb://localhost:27017/chat-assistant`) OR a free MongoDB Atlas URI. *(Note: If MongoDB is offline, the backend still boots gracefully and supports health checks and mock streaming demo mode).*

---

## 6. Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default | Allowed Values |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP Server port | `5000` | Any valid port |
| `NODE_ENV` | Environment mode | `development` | `development`, `production`, `test` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/chat-assistant` | Valid Mongo connection string |
| `LLM_PROVIDER` | Selected LLM backend | `mock` | `mock`, `anthropic`, `openai` |
| `LLM_MODEL` | Model identifier | `claude-3-5-sonnet-20241022` or `gpt-4o` | Model string compatible with provider |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | *Optional* | String (required if `LLM_PROVIDER=anthropic`) |
| `OPENAI_API_KEY` | OpenAI API key | *Optional* | String (required if `LLM_PROVIDER=openai`) |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` | Frontend origin URL |
| `HISTORY_LIMIT` | Message history window | `20` | Positive integer |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API URL | `http://localhost:5000` |

---

## 7. Step-by-Step Run Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create .env from template
cp .env.example .env

# Install dependencies
npm install

# Run automated tests
npm test

# Start the server (development mode with nodemon or production)
npm start
```
The backend will launch on `http://localhost:5000`.

### 2. Frontend Setup

In a separate terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Create .env from template
cp .env.example .env

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Running Tests

```bash
# Inside backend directory
cd backend
npm test
```
All 33 unit and integration tests across 5 test suites will run and pass.

---

## 8. API Reference

### Health Check
- **`GET /api/health`**
  - Response: `{ status: 'ok', timestamp: ISO, provider: 'mock', model: '...', mongoConnected: true/false }`

### Conversations CRUD
- **`GET /api/conversations`**
  - Returns list of conversations sorted by `updatedAt` descending.
  - Response: `{ conversations: [{ _id, title, updatedAt }] }`
- **`POST /api/conversations`**
  - Creates a new empty conversation.
  - Body: `{ title?: string }`
  - Response: `201 { conversation }`
- **`GET /api/conversations/:id`**
  - Retrieves a full conversation by ID with all messages.
  - Response: `200 { conversation }` | `404 { error: { code: 'NOT_FOUND' } }`
- **`PATCH /api/conversations/:id`**
  - Renames an existing conversation.
  - Body: `{ title: "New Name" }`
  - Response: `200 { conversation }`
- **`DELETE /api/conversations/:id`**
  - Deletes a conversation by ID.
  - Response: `200 { message: "Conversation deleted successfully." }`

### Real-Time Chat & Streaming (SSE)
- **`POST /api/chat/stream`**
  - Body:
    ```json
    {
      "message": "Explain quantum computing",
      "tone": "professional",
      "conversationId": "optional-mongo-id"
    }
    ```
  - Headers: `Content-Type: text/event-stream`
  - SSE Events:
    - `event: meta` -> `data: { conversationId: "..." }`
    - `event: token` -> `data: { text: "chunk" }`
    - `event: done` -> `data: { conversationId: "...", messageLength: 120 }`
    - `event: error` -> `data: { message: "Error details" }`

- **`POST /api/chat/regenerate`**
  - Removes the last assistant message and re-streams a fresh response using the specified tone.
  - Body:
    ```json
    {
      "conversationId": "651a2b...",
      "tone": "casual"
    }
    ```
  - SSE Events: Same as `/api/chat/stream`.

---

## 9. Design Decisions & Trade-offs

1. **Server-Owned Tone Logic**:
   - *Decision*: The frontend never sends or constructs prompts. It transmits only a verified tone key (`professional`, `casual`, `concise`).
   - *Rationale*: Centralizes business logic, prevents prompt tampering or injection attacks, and allows modifying AI guidelines server-side without releasing frontend updates.

2. **Server-Sent Events (SSE) vs WebSockets**:
   - *Decision*: Implemented SSE over HTTP POST for text generation streaming.
   - *Rationale*: SSE is simple, firewall-friendly, works natively over standard HTTP/2, and requires no connection state synchronization or complex reconnect protocols typical of WebSockets for unidirectional token streaming.

3. **Optimistic UI Updates with Server Reconciliation**:
   - *Decision*: User messages render immediately upon submission. On completion of streaming, the conversation is reloaded or reconciled with MongoDB-assigned ObjectIds and timestamps.
   - *Rationale*: Delivers instant feedback while ensuring guaranteed persistence and consistency across sessions.

4. **Zero-Setup Mock Provider**:
   - *Decision*: Default `LLM_PROVIDER=mock` streams contextual responses tailored to each tone, complete with markdown and code snippets.
   - *Rationale*: Facilitates immediate evaluation, developer onboarding, and offline testing without requiring active cloud provider subscriptions.

---

## 10. Known Limitations & Future Improvements

- **Authentication**: Currently designed as a single-tenant or anonymous session app. Future iterations can integrate JWT-based auth or NextAuth/Auth0 for user-specific conversation isolation.
- **Vector Search / RAG**: Can be extended with LangChain or LlamaIndex to query uploaded PDF documents and external data sources.
- **Voice Input & Output**: Future enhancement to support speech-to-text input and neural voice playback matching the selected tone.

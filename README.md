# Figma-Like Studio Design Application

Production-oriented, browser-based collaborative design editor inspired by Figma, built with React, TypeScript, Tailwind CSS, Vite, Konva.js, Node.js API, and a clean command-based document state architecture.

## Monorepo Architecture

`
figma-like-app/
├── apps/
│   ├── web/                     # React 18 + Vite + Tailwind CSS + Konva Studio Frontend
│   │   ├── src/
│   │   │   ├── editor/          # Canvas, TopNavigation, ToolBar, LeftSidebar, RightSidebar
│   │   │   ├── store/           # Zustand Editor State with reversible commands
│   │   │   ├── hooks/           # Keyboard shortcuts & responsive canvas bindings
│   │   │   └── tests/           # Vitest unit test suites
│   └── api/                     # Node.js + Express + WebSocket Real-Time Server
├── packages/
│   ├── shared-types/            # Canonical scene nodes, transforms, fills, effects, presence
│   ├── validation/              # Zod runtime schemas for document models & geometry
│   ├── document-model/          # Factory functions, deep node cloning, default scenes
│   └── editor-commands/         # Command pattern (AddNode, UpdateNode, DeleteNode)
├── infrastructure/              # Deployment & Docker configurations
└── prisma/                      # Schema definition for PostgreSQL database
`

## Setup & Running Locally

### 1. Install Dependencies
`ash
npm install
`

### 2. Run Applications
* **Web Editor**:
  `ash
  npm run dev:web
  `
  Runs at [http://localhost:5173](http://localhost:5173).
* **API & Collaboration Server**:
  `ash
  npm run dev:api
  `
  Runs at [http://localhost:4000](http://localhost:4000).

### 3. Run Typecheck & Tests
* **Typecheck all packages**:
  `ash
  npm run typecheck
  `
* **Run Vitest Tests**:
  `ash
  npm run test --workspace=@figma-app/web
  `
* **Build Web Production Bundle**:
  `ash
  npm run build --workspace=@figma-app/web
  `

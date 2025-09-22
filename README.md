# Opag - Agent Actions Platform

Opag is a comprehensive platform for managing AI agent actions, providing developers with a unified dashboard to browse, configure, and execute tools for intelligent agents. Built with modern web technologies, it offers secure credential management, action simplification, and real-time execution capabilities.

## Architecture Overview

Opag follows a modern full-stack architecture built on Next.js with Firebase backend services and AI integration through Google's Genkit framework.

### Core Technologies

- **Frontend**: Next.js 15.3.3 with React 18
- **UI Framework**: Tailwind CSS with Radix UI components
- **Backend**: Firebase (Authentication, Firestore, App Hosting)
- **AI Integration**: Google AI with Genkit framework
- **Development**: TypeScript, ESLint, PostCSS
- **Deployment**: Firebase App Hosting

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │────│  Firebase Auth   │────│   Firestore     │
│   (Frontend)    │    │  (Authentication)│    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │              ┌──────────────────┐              │
         └──────────────│   Genkit AI      │──────────────┘
                        │   (AI Engine)    │
                        └──────────────────┘
                                 │
                    ┌─────────────────────────────┐
                    │    External Services        │
                    │  - GitHub API               │
                    │  - Slack API                │
                    │  - Airtable API             │
                    └─────────────────────────────┘
```

## Core Features

### 1. Tool Marketplace
Developer dashboard to browse, search, and enable tools for agents with comprehensive filtering and categorization.

### 2. Authentication Vault
Secure vault for managing user credentials and OAuth 2.0 flows with support for:
- Google OAuth
- GitHub OAuth
- Anonymous authentication

### 3. Action Simplification Engine
Translates complex API calls into simple actions (e.g., `github.create_issue`) through intuitive interfaces.

### 4. Agentic Framework SDK
SDK for agents to discover and execute actions with built-in error handling and validation.

### 5. Execution Runtime
Engine to execute validated actions, retrieve tokens, and manage errors with real-time feedback.

### 6. Action Description Generation
Generative AI-powered description generator that suggests relevant action descriptions based on parameters.

### 7. Action Feedback
Real-time feedback system for actions using success and error messaging with suggested resolution paths.

## Project Structure

```
opag/
├── docs/
│   └── blueprint.md              # Project blueprint and specifications
├── src/
│   ├── ai/
│   │   ├── flows/               # AI workflow implementations
│   │   │   ├── agent.ts
│   │   │   ├── get-ai-help.ts
│   │   │   ├── suggest-action-description.ts
│   │   │   └── workflow-orchestrator.ts
│   │   ├── dev.ts               # AI development server
│   │   └── genkit.ts            # Genkit configuration
│   ├── app/
│   │   ├── dashboard/           # Main dashboard pages
│   │   │   ├── _components/     # Dashboard-specific components
│   │   │   ├── activity/        # Activity tracking
│   │   │   ├── auth-configs/    # Authentication configuration
│   │   │   ├── components/      # Component management
│   │   │   ├── connections/     # External service connections
│   │   │   ├── playground/      # Testing environment
│   │   │   ├── settings/        # Application settings
│   │   │   ├── toolkits/        # Tool management
│   │   │   └── workflows/       # Workflow management
│   │   ├── editor/              # Visual workflow editor
│   │   │   └── [id]/            # Dynamic editor pages
│   │   ├── flows/               # Pre-built flow templates
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   └── actions.ts           # Server actions
│   ├── components/
│   │   ├── assistant/           # AI assistant components
│   │   └── ui/                  # Reusable UI components (Radix UI)
│   ├── hooks/                   # Custom React hooks
│   ├── lib/
│   │   ├── api.ts               # API utilities
│   │   ├── auth.ts              # Authentication logic
│   │   ├── connections.ts       # Connection management
│   │   ├── firebase.ts          # Firebase configuration
│   │   ├── toolkits.ts          # Toolkit utilities
│   │   └── utils.ts             # General utilities
│   ├── services/                # External service integrations
│   │   ├── airtable.ts          # Airtable API integration
│   │   ├── github.ts            # GitHub API integration
│   │   └── slack.ts             # Slack API integration
│   └── sdk/
│       └── index.ts             # SDK exports
├── .firebaserc                  # Firebase project configuration
├── apphosting.yaml             # Firebase App Hosting configuration
├── components.json             # shadcn/ui configuration
├── firestore.rules             # Firestore security rules
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Key Components

### AI Integration (`src/ai/`)
- **Genkit Configuration**: Central AI model configuration using Google's Gemini 2.0 Flash
- **Workflow Orchestrator**: Manages complex multi-step AI workflows
- **Agent System**: Handles intelligent agent interactions and responses
- **Action Description Generation**: Auto-generates descriptions for actions using AI

### Dashboard (`src/app/dashboard/`)
- **Activity Tracking**: Monitor system activity and user actions
- **Connection Management**: Configure and manage external service integrations
- **Component Library**: Browse and manage reusable components
- **Playground**: Test environment for experimenting with actions and workflows
- **Settings**: Application configuration and user preferences

### Authentication System (`src/lib/auth.ts`)
- Multi-provider authentication (Google, GitHub, Anonymous)
- Secure token management
- Session handling and user state management

### External Integrations (`src/services/`)
- **GitHub**: Repository management, issue creation, PR handling
- **Slack**: Message posting, channel management, bot interactions
- **Airtable**: Database operations, record management, schema handling

## Environment Setup

### Required Environment Variables

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id

# Google AI
GOOGLE_API_KEY=your-google-ai-api-key

# External Services
GITHUB_TOKEN=your-github-token
SLACK_BOT_TOKEN=your-slack-bot-token
AIRTABLE_API_KEY=your-airtable-api-key
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- Google AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/manojmaheshwarjg/opag.git
cd opag
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Start the AI development server (optional):
```bash
npm run genkit:dev
```

### Available Scripts

- `npm run dev`: Start development server on port 9002 with Turbopack
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint
- `npm run typecheck`: Type-check the codebase
- `npm run genkit:dev`: Start Genkit development server
- `npm run genkit:watch`: Start Genkit server with file watching

## Deployment

The application is configured for deployment on Firebase App Hosting:

1. Configure Firebase project:
```bash
firebase init
```

2. Deploy to Firebase:
```bash
firebase deploy
```

The `apphosting.yaml` file contains the deployment configuration with auto-scaling settings.

## UI Design System

Opag follows a modern design system with:

- **Color Scheme**: Purple and white gradients with dark backgrounds
- **Typography**: Modern sans-serif fonts for readability
- **Layout**: Clean, spacious design highlighting key information
- **Components**: Minimalist icons and clear call-to-action buttons
- **Animations**: Subtle animations for enhanced user experience
- **Accessibility**: High contrast ratios and semantic HTML

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Technology Stack Details

### Frontend
- **Next.js 15**: React framework with App Router
- **React 18**: UI library with concurrent features
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives

### Backend & Services
- **Firebase Auth**: Authentication service
- **Firestore**: NoSQL database
- **Firebase App Hosting**: Deployment platform
- **Google AI (Genkit)**: AI integration framework

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Turbopack**: Fast bundler for development

## License

This project is private and proprietary.

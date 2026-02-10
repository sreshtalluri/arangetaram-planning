# Arangetram Event Planning Platform

A full-stack SaaS web application that helps families plan their child's Arangetram — a classical Indian dance debut performance. The platform connects families with vendors, provides AI-powered recommendations, and streamlines the entire event planning process.

## Features

**For Families (Users)**
- Search and browse vendors by category, location, and price range
- Create and manage events with guest counts, budgets, and timelines
- Send booking inquiries to vendors and track responses
- AI-powered chat assistant for event planning guidance
- AI vendor recommendations based on event requirements

**For Vendors**
- Register services with portfolios and availability
- Manage incoming inquiries and booking requests
- Update business profiles and pricing

## Tech Stack

**Frontend**
- React 19 with TypeScript
- React Router for navigation
- TanStack React Query for data fetching
- Tailwind CSS + Shadcn/UI components
- React Hook Form + Zod for form validation

**Backend**
- Supabase (PostgreSQL with Row Level Security)
- Supabase Auth for authentication
- Supabase Edge Functions for AI integration
- Real-time subscriptions for inquiries/events

**AI Integration**
- Groq API for chat and recommendations
- Context-aware vendor recommendations
- Event planning assistant

## Project Structure

```
├── frontend/           # React application
│   ├── src/
│   │   ├── components/ # UI components (Shadcn/UI + custom)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utilities, Supabase client, types
│   │   └── pages/      # Page components
│   └── package.json
├── supabase/
│   ├── functions/      # Edge Functions (AI chat, recommendations)
│   └── migrations/     # Database migrations
└── .planning/          # Development documentation
```

## Getting Started

### Prerequisites
- Node.js 16+
- Yarn package manager
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd arangetaram-planning
   ```

2. Install frontend dependencies
   ```bash
   cd frontend
   yarn install
   ```

3. Configure environment variables
   ```bash
   cp frontend/.env.example frontend/.env
   # Add your Supabase URL and anon key
   ```

4. Start the development server
   ```bash
   yarn start
   ```

### Environment Variables

**Frontend** (`frontend/.env`)
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key

**Supabase Edge Functions**
- `GROQ_API_KEY` - Groq API key for AI features

## Development

```bash
# Start frontend dev server
cd frontend && yarn start

# Generate TypeScript types from Supabase
yarn gen:types

# Run linting
yarn lint
```

## Database

The database schema includes:
- **profiles** - User and vendor profiles
- **vendors** - Vendor business information, portfolios, availability
- **events** - User event planning data
- **inquiries** - Vendor-user communication and booking requests

Row Level Security (RLS) policies ensure data privacy and multi-tenant security.

# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **UPSC Mentorship Platform** built with **Next.js 14** (App Router), **TypeScript**, **Prisma ORM**, **NextAuth.js**, and **TailwindCSS**. The platform connects UPSC exam aspirants (students) with experienced mentors, providing features like session booking, forum discussions, private queries, and administrative controls.

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Management
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema changes to database
npm run prisma:push

# Deploy migrations in production
prisma migrate deploy

# Seed database with initial data
npm run prisma:seed
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Background Jobs
```bash
# Build job scripts
npm run build:jobs
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: TailwindCSS, Radix UI components, Lucide React icons
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Jest with React Testing Library
- **State Management**: Built-in React state, NextAuth sessions

### User Roles & Permissions
The application supports three user roles with role-based access control:

1. **STUDENT**: Can book sessions, participate in forum, ask private queries
2. **MENTOR**: Can create sessions, respond to queries, access mentor dashboard
3. **ADMIN**: Full access to user management, analytics, and system administration

### Key Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── sessions/      # Session management
│   │   ├── discussions/   # Forum functionality
│   │   └── admin/         # Admin operations
│   ├── dashboard/         # Role-based dashboards
│   ├── auth/              # Authentication pages
│   ├── forum/             # Discussion forum
│   └── sessions/          # Session booking
├── components/            # Reusable React components
├── lib/                   # Utility libraries (Prisma, auth config)
└── types/                 # TypeScript type definitions
```

### Database Schema (Prisma)
Core models:
- **User**: Handles all user types with role-based differentiation
- **MentorSlot**: Available time slots created by mentors
- **Booking**: Student bookings for mentor sessions
- **Discussion**: Forum posts and private queries
- **Comment/Reply**: Discussion responses and interactions

### Authentication Flow
- Uses NextAuth.js with JWT strategy
- Credentials-based authentication with bcrypt password hashing
- Role-based middleware protection for dashboard routes
- Password reset functionality with time-limited tokens

### Key Features
- **Session Management**: Mentors create slots, students book sessions
- **Forum System**: Public discussions with upvoting and resolution tracking
- **Private Queries**: Direct student-to-mentor communication
- **Admin Dashboard**: User management, analytics, and system oversight
- **Responsive Design**: Mobile-first design with TailwindCSS

## Development Guidelines

### Environment Variables Required
```bash
POSTGRES_PRISMA_URL=        # PostgreSQL connection string
NEXTAUTH_SECRET=            # NextAuth.js secret for JWT signing
NEXTAUTH_URL=               # Application URL for NextAuth callbacks
```

### API Route Patterns
- `/api/auth/*` - Authentication endpoints
- `/api/sessions/*` - Session management (CRUD operations)
- `/api/discussions/*` - Forum and query management
- `/api/admin/*` - Administrative operations (role-protected)

### Component Architecture
- Uses a mix of custom components and Radix UI primitives
- Global navbar with role-based navigation visibility
- Reusable UI components in `components/ui/`
- Business logic components in feature-specific directories

### Testing Setup
- Jest configured with Next.js support
- React Testing Library for component testing
- Mocked dependencies include NextAuth, Prisma, and Next.js routing
- Coverage threshold set to 80% for all metrics

### Database Considerations
- Uses PostgreSQL in production
- Prisma handles migrations and type generation
- Soft deletes implemented for users via `deleted` boolean field
- Cascading deletes configured for related entities
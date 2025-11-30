# Quotd

A professional quoting tool for trade jobs built with Next.js 14, TypeScript, and Supabase.

## Project Structure

```
/trade-job-quoter
├── public/              # Static assets (logo, etc)
├── src/
│   ├── app/             # App Router pages
│   │   ├── (auth)/      # Login/Signup routes
│   │   ├── (dashboard)/ # Protected routes
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Landing page
│   ├── components/
│   │   ├── ui/          # Reusable UI components
│   │   ├── quotes/      # Quote specific components
│   │   └── layout/      # Navbar, Sidebar
│   ├── lib/
│   │   ├── supabase/    # Client & Server clients
│   │   ├── utils.ts     # Helper functions
│   │   └── types.ts     # Database types
│   └── hooks/           # Custom React hooks
├── .env.local          # Environment variables
└── package.json
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your Supabase environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Authentication**: Login and signup routes
- **Dashboard**: Protected routes for authenticated users
- **Quote Management**: Build and manage quotes
- **Customer Management**: Track and manage customers
- **User Profile**: User settings and preferences

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)


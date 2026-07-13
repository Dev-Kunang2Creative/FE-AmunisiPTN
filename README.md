# FE Amunisi

Frontend application for the Amunisi platform, built with [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/), and styled using [Tailwind CSS](https://tailwindcss.com/) and [shadcn/ui](https://ui.shadcn.com/).

## Features & Modules

Based on our architectural graph, the platform comprises the following core modules:
- **Tryout & Exams**: Extensive tryout execution, subtest management, question answering, and leaderboard tracking.
- **Kelas & Packages**: Management of classes, package purchasing, and order history.
- **Ticketing & Reports**: Issue tracking, report submissions, and admin ticket logging.
- **Admin Dashboard**: Comprehensive admin tools including user management, audit logs, question banks, sales reports, transactions, and ticket injections.
- **User Management**: Authentication, profile management, and VIP access.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, PostCSS
- **Components**: shadcn/ui, Radix UI
- **Forms**: React Hook Form, Zod
- **Data Fetching**: TanStack React Query, Axios
- **Icons**: Lucide React
- **Payments**: Midtrans Snap

## Core Abstractions & Utilities
- **`cn()`**: The universal utility for merging Tailwind classes across components.
- **`api`**: A configured Axios instance used globally for all HTTP requests in `src/http`.
- **`getErrorMessage()`**: A centralized utility for formatting and handling errors.
- **UI Foundation**: The app heavily utilizes `Button`, `Input`, `DialogContent`, and `Card` atoms from shadcn/ui to compose complex layouts.

## System Dependencies
- Node.js (Recommended: v18+)
- npm, yarn, or pnpm

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture Knowledge Graph

This project uses [Graphify](https://github.com/safishamsi/graphify) to maintain an architectural knowledge graph of the codebase.
The latest generated graph data, reports, and interactive HTML visualization can be found in the `graphify-out/` directory.

To update the graph after making structural changes, run:
```bash
/graphify .
```

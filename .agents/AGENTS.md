# Agent Instructions for FE-Amunisi

You are working on the FE-Amunisi codebase. Please follow these guidelines:

## Codebase Architecture
This is a Next.js (App Router) project using `shadcn/ui` and Tailwind CSS.
The architecture is structured around Atomic Design principles:
- **Atoms**: Basic UI components (buttons, inputs, alerts, datacolumns).
- **Molecules**: Compound components (forms, cards, dialogs, datatables, exam components).
- **Organisms**: Complex business components (dashboard wrappers, modules).
- **App**: Next.js file-based routing found in `src/app`.

## Core Abstractions (God Nodes)
- **`cn()`**: Reused extensively for class merging across atoms, molecules, and organisms. Do not recreate this utility.
- **`api`**: The central Axios instance used for all HTTP requests in `src/http/`. Do not bypass it by using native fetch unless absolutely necessary.
- **`getErrorMessage()`**: Utility used to format errors.
- **UI Components**: `Button`, `Input`, `DialogContent`, `Card` are the core foundational elements. Prefer reusing these generic atoms over creating new custom UI components.

## State & API Management
- Use **TanStack React Query** for data fetching and caching state.
- Form management should use **React Hook Form** along with **Zod** validation schemas.
- API calls use Axios and are organized inside `src/http/`. Ensure endpoints are mapped accurately to the central `api` instance.

## Styling
- Use the `cn()` utility (`clsx` + `tailwind-merge`) for conditional class merging.
- Prefer `shadcn/ui` components for consistency. They are located in `src/components/ui/`.

## Graphify Knowledge Graph
- This project utilizes Graphify. The generated graph is in `graphify-out/`.
- For codebase or architecture questions, refer to `graphify-out/graph.json` or `graphify-out/GRAPH_REPORT.md` first.
- If you encounter isolated nodes or missing documentation, use `graphify query` to explore weakly connected modules.
- When making codebase-wide or structural changes, keep the knowledge graph in sync by running `graphify update .` or `/graphify .`.

# Architecture Overview

The **Revenium AI FinOps Dashboard** consists of two main parts:

1. **Frontend (React + Vite)**
   - Built with React 18, TypeScript, Tailwind CSS, ShadCN UI components, and Recharts for visualizations.
   - State is managed by **Zustand**, which stores raw metric updates, aggregated totals, time‑series data, and anomaly information.
   - Data is fetched via a custom hook `useDataFetcher` that supports **polling** (default) and **Server‑Sent Events (SSE)**. The hook handles exponential back‑off, connection status, and tab‑visibility pausing.
   - UI components (`MetricCard`, `TokenUsageChart`, `TopCustomersTable`, `AnomalyAlerts`, `Controls`) subscribe to the store and update in real‑time.

2. **Backend (Mock Server – Node/Express)**
   - Generates synthetic metric updates for multiple customers, tenants, and models.
   - Exposes three endpoints:
     - `GET /api/metrics` – returns recent metrics for polling.
     - `GET /api/stream` – SSE endpoint for streaming updates.
     - `GET /api/metrics/history` – returns a static history buffer.
   - Simulates network latency and occasional errors to test resilience.

**Communication Flow**
- The Vite dev server proxies `/api` requests to the mock server (port 3001) via `vite.config.ts`.
- The frontend fetches data, updates the Zustand store, and the UI re‑renders automatically.

**Deployment**
- Multi‑stage Docker builds produce a lightweight Nginx image for the frontend and a Node image for the backend.
- `docker-compose.yml` orchestrates both services, exposing ports 5173 (frontend) and 3001 (backend).

---

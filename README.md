# Revenium AI FinOps Dashboard

## Overview

A real‑time dashboard for monitoring AI usage and costs. Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **ShadCN UI**, **Zustand** for state management, and **Recharts** for visualizations. A mock backend server (Node/Express) streams metric updates via polling or Server‑Sent Events (SSE).

## Quick Start

```bash
# Clone the repo (if not already)
git clone https://github.com/Litchstarken/revenium-project.git
cd revenium-project

# Install dependencies
npm install

# Start the mock backend (already running in your setup)
npm run server   # runs on http://localhost:3001

# Start the frontend dev server
npm run dev      # runs on http://localhost:5173
```

The dashboard will automatically connect to the backend and display live metrics.

## Scripts

- `dev` – Starts Vite dev server.
- `build` – Builds the production bundle.
- `test` – Runs Vitest unit and component tests.
- `test:watch` – Runs tests in watch mode.
- `test:coverage` – Generates coverage report.
- `server` – Starts the mock Express server.

## Features

- Real‑time metric updates (polling & SSE).
- Anomaly detection with visual alerts.
- Interactive controls to toggle fetching mode, pause/resume, and clear data.
- Responsive UI built with ShadCN components and Tailwind.

---

// Vercel serverless entry point (catch-all).
//
// The same Express app that runs locally (src/api/server.ts) is exported here.
// Vercel maps this [[...slug]] file to `/api` AND every `/api/*` path, so all
// routes (auth, products, calculator, orders, chat, jobs, …) are handled by
// the single Express app. The built Vite app (dist/) is served as static files
// from the same project — one deployment, one origin, no separate backend host.
import app from "../src/api/server";

export default app;
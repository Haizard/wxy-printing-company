// Vercel serverless entry point.
//
// The same Express app that runs locally (src/api/server.ts) is exported here.
// Vercel routes every /api/* request to this function, and the built Vite app
// (dist/) is served as static files from the same project — one deployment,
// one origin, no separate backend host.
import app from "../src/api/server";

export default app;

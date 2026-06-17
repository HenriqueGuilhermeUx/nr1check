import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./context";
import { registerStripeWebhook } from "./webhooks/stripe";
import { registerClerkWebhook } from "./webhooks/clerk";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // CORS para o frontend (Netlify)
  app.use(
    cors({
      origin: process.env.APP_BASE_URL?.split(",") ?? ["http://localhost:5173"],
      credentials: true,
    }),
  );

  // Webhooks ANTES do express.json() (precisam do body raw)
  registerStripeWebhook(app);
  registerClerkWebhook(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  server.listen(port, () => {
    console.log(`🚀 NR1Check API rodando em http://localhost:${port}`);
    console.log(`📡 tRPC endpoint: http://localhost:${port}/api/trpc`);
  });
}

startServer().catch((err) => {
  console.error("❌ Erro ao iniciar API:", err);
  process.exit(1);
});

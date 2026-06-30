import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { verifyToken } from "@clerk/backend";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./context";
import { registerStripeWebhook } from "./webhooks/stripe";
import { registerWooviWebhook } from "./webhooks/woovi";
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

function getAllowedOrigins() {
  const configured = process.env.APP_BASE_URL?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];

  return [
    ...configured,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://nr1check.netlify.app",
  ];
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        const allowed = getAllowedOrigins();

        if (allowed.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, true);
      },
      credentials: true,
      allowedHeaders: ["content-type", "authorization", "x-trpc-source"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  // Webhooks ANTES do express.json() global.
  registerStripeWebhook(app);
  registerWooviWebhook(app);
  registerClerkWebhook(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/auth-debug", async (req, res) => {
    const authHeader = req.headers.authorization;
    const hasAuthHeader = Boolean(authHeader);
    const startsWithBearer = Boolean(authHeader?.startsWith("Bearer "));
    const token = startsWithBearer ? authHeader!.slice(7) : "";
    const secretKey = process.env.CLERK_SECRET_KEY;

    const result: Record<string, unknown> = {
      status: "auth-debug",
      receivedOrigin: req.headers.origin ?? null,
      hasAuthorizationHeader: hasAuthHeader,
      startsWithBearer,
      tokenLength: token.length,
      tokenPreview: token ? `${token.slice(0, 12)}...${token.slice(-8)}` : null,
      hasClerkSecretKey: Boolean(secretKey),
      clerkSecretKeyPrefix: secretKey ? `${secretKey.slice(0, 8)}...` : null,
      appBaseUrlConfigured: process.env.APP_BASE_URL ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
      timestamp: new Date().toISOString(),
    };

    if (!token) {
      res.json({
        ...result,
        tokenVerified: false,
        reason: "NO_TOKEN_RECEIVED",
      });
      return;
    }

    if (!secretKey) {
      res.json({
        ...result,
        tokenVerified: false,
        reason: "MISSING_CLERK_SECRET_KEY",
      });
      return;
    }

    try {
      const payload = await verifyToken(token, { secretKey });
      res.json({
        ...result,
        tokenVerified: true,
        clerkUserId: payload.sub,
        issuer: payload.iss,
        authorizedParty: payload.azp ?? null,
      });
    } catch (error) {
      res.json({
        ...result,
        tokenVerified: false,
        reason: "VERIFY_TOKEN_FAILED",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

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
    console.log(`🔐 Auth debug: http://localhost:${port}/api/auth-debug`);
    console.log(`💠 Woovi webhook: http://localhost:${port}/webhooks/woovi`);
  });
}

startServer().catch((err) => {
  console.error("❌ Erro ao iniciar API:", err);
  process.exit(1);
});

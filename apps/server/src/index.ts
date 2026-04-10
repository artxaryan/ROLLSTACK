import { trpcServer } from "@hono/trpc-server";
import { createContext } from "@sams-t-app/api/context";
import { appRouter } from "@sams-t-app/api/routers/index";
import { auth } from "@sams-t-app/auth";
import { env } from "@sams-t-app/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

env;

const app = new Hono();

app.use(logger());

app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.all(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  })
);

app.get("/", (c) => {
  return c.text("OK");
});

app.get("/api/debug/env", (c) => {
  return c.json({
    nodeEnv: process.env.NODE_ENV,
    corsOrigin: process.env.CORS_ORIGIN ? "set" : "not-set",
    betterAuthUrl: process.env.BETTER_AUTH_URL ? "set" : "not-set",
    hasBetterAuthSecret: !!process.env.BETTER_AUTH_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasBrevoApiKey: !!process.env.BREVO_API_KEY,
    hasBrevoSenderEmail: !!process.env.BREVO_SENDER_EMAIL,
  });
});

app.onError((err, c) => {
  console.error("[Server Error]", err.message);
  return c.json({ error: err.message }, 500);
});

export default app;

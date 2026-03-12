import { auth } from "@sams-t-app/auth";
import { db } from "@sams-t-app/db";
import type { Context as HonoContext } from "hono";

export interface CreateContextOptions {
  context: HonoContext;
}

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    session,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

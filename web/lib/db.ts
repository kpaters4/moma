import postgres from "postgres";

declare global {
  var __sql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  // The Supabase Vercel integration provisions its own connection secret as
  // `POSTGRES_URL` (rather than `DATABASE_URL`) and, by default, only for
  // the Production environment — fall back to it so a fresh integration
  // install works without also hand-adding `DATABASE_URL`.
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL (or POSTGRES_URL) is not set. This app reads the MoMA collection from " +
        "Supabase Postgres (the same database the Streamlit/Modal deployment uses) — set " +
        "DATABASE_URL in web/.env.local for local dev and as a Vercel project environment " +
        "variable for deployment, or connect the Supabase integration in the Vercel dashboard."
    );
  }
  // `max: 1` because each serverless invocation gets its own short-lived
  // client; Supabase's connection pooler (whichever DATABASE_URL points at)
  // handles fan-out across concurrent invocations.
  //
  // `prepare: false` because that pooler is Supavisor/PgBouncer running in
  // transaction mode, which hands out a different backend connection per
  // statement — incompatible with postgres.js's server-side prepared
  // statements. Without this, concurrent queries on the same client (e.g.
  // the Promise.all in getFacets/getStats) hang or die with "canceling
  // statement due to statement timeout".
  return postgres(url, { ssl: "require", max: 1, idle_timeout: 20, prepare: false });
}

function getClient() {
  if (!globalThis.__sql) globalThis.__sql = createClient();
  return globalThis.__sql;
}

// A lazy proxy: connecting (and validating DATABASE_URL) only happens on the
// first real query, not at module import time. Next.js imports route
// handler modules during the build's "collect page data" step even for
// fully dynamic routes, so throwing eagerly here would break `next build`
// whenever DATABASE_URL isn't set at build time (it's only needed at
// runtime, since every page fetches from these routes client-side).
export const sql = new Proxy(function () {} as unknown as ReturnType<typeof postgres>, {
  apply(_target, _thisArg, args) {
    const client = getClient();
    return Reflect.apply(client, client, args);
  },
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

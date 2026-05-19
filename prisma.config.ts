// Prisma 7 moved the datasource URL out of schema.prisma (it's now a CLI-side
// concern). This file is read by `prisma generate / migrate / db push / studio`
// to know where to connect.
//
// At RUNTIME, the generated Prisma client reads DATABASE_URL directly from
// process.env — this file isn't bundled into the Vercel Lambda.
import { defineConfig } from "prisma/config";
// Prisma 7 does not auto-load .env when using a TS config file, so we load
// it explicitly here for CLI commands (generate, migrate, db push, studio).
import "dotenv/config";

export default defineConfig({
  datasource: {
    // Non-null assertion: if DATABASE_URL is unset, Prisma will throw a clearer
    // error than letting the CLI try to connect to "undefined".
    url: process.env.DATABASE_URL!,
  },
});

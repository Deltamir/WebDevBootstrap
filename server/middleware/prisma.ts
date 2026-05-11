import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

let prisma: PrismaClient;

declare module "h3" {
  interface H3EventContext {
    prisma: PrismaClient;
  }
}

export default eventHandler(async (event) => {
  if (!prisma) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  event.context.prisma = prisma;
});

import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare module "h3" {
  interface H3EventContext {
    prisma: PrismaClient;
  }
}

export default eventHandler(async (event) => {
  if (!prisma) {
    prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
  }
  event.context.prisma = prisma;
  // return event
});

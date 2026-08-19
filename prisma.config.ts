import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Neon pooled connection — used by the app at runtime.
    url: env("DATABASE_URL"),
    // Neon direct (non-pooled) connection. Migrations cannot run through a
    // connection pooler, so the schema engine needs this separately.
    directUrl: env("DIRECT_URL"),
  },
});

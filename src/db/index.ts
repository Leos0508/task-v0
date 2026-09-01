import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { getDatabaseUrl } from "#/lib/env.server";

import * as schema from "./schema.ts";

export const db = drizzle(neon(getDatabaseUrl()), { schema });

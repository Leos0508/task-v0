import { apiKey } from "@better-auth/api-key";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
import * as schema from "#/db/schema";
import { bootstrapUser } from "#/lib/data/bootstrap-user";
import { getAuthEnv } from "#/lib/env.server";

const authEnv = getAuthEnv();

export const auth = betterAuth({
	secret: authEnv.secret,
	...(authEnv.baseURL
		? {
				baseURL: authEnv.baseURL,
				trustedOrigins: [authEnv.baseURL],
			}
		: {}),
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
	},
	plugins: [
		tanstackStartCookies(),
		apiKey({
			defaultPrefix: "task_",
			requireName: true,
			// Cursor reconnects and lists tools on every session; the plugin
			// default is 10 verifications per day and is stored on each key.
			rateLimit: {
				enabled: false,
			},
		}),
	],
	databaseHooks: {
		user: {
			create: {
				after: async (createdUser) => {
					await bootstrapUser(createdUser.id);
				},
			},
		},
	},
});

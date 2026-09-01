import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
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
	}),
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
	},
	plugins: [tanstackStartCookies()],
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

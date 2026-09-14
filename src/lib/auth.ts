import { apiKey } from "@better-auth/api-key";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "#/db";
import * as schema from "#/db/schema";
import { bootstrapUser } from "#/lib/data/bootstrap-user";
import { authEmailHtml, sendAppEmail } from "#/lib/email";
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
		minPasswordLength: 8,
		requireEmailVerification: false,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, url, token }) => {
			const href = appAuthUrl("/reset-password", token, url);
			await sendAppEmail({
				to: user.email,
				subject: "Reset your Task password",
				text: `Reset your password: ${href}`,
				html: authEmailHtml({
					title: "Reset your password",
					body: "We received a request to reset the password for your Task account.",
					href,
					action: "Reset password",
				}),
				idempotencyKey: `reset-password/${user.id}/${token}`,
			});
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url, token }) => {
			const href = appAuthUrl("/verify-email", token, url);
			await sendAppEmail({
				to: user.email,
				subject: "Verify your Task email",
				text: `Verify your email: ${href}`,
				html: authEmailHtml({
					title: "Verify your email",
					body: "Confirm this address to finish setting up your Task account.",
					href,
					action: "Verify email",
				}),
				idempotencyKey: `verify-email/${user.id}/${token}`,
			});
		},
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

function appAuthUrl(
	path: "/verify-email" | "/reset-password",
	token: string,
	fallback: string,
) {
	const origin = authEnv.baseURL;
	if (!origin) return fallback;
	return `${origin}${path}?token=${encodeURIComponent(token)}`;
}

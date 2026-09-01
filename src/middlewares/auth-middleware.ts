import { createMiddleware } from "@tanstack/react-start";
import { getSession } from "#/lib/auth.functions";

export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const session = await getSession();
		if (!session) {
			throw new Error("Unauthorized");
		}
		return next({
			context: {
				user: session.user,
				session: session.session,
			},
		});
	},
);

import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import type { Session, User } from "better-auth";
import { auth } from "./auth";

export const getSession = createServerOnlyFn(
	async (): Promise<{ user: User; session: Session } | null> => {
		const headers = getRequestHeaders();
		return await auth.api.getSession({ headers });
	},
);

// TODO: delegate to redirect if use as before load main function
export const getAuthSession = createServerFn({ method: "GET" }).handler(() =>
	getSession(),
);

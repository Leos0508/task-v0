import { queryOptions } from "@tanstack/react-query";
import { getAuthSession } from "#/lib/auth.functions";

export const authKeys = {
	session: ["auth", "session"] as const,
};

export const authSessionQueryOptions = queryOptions({
	queryKey: authKeys.session,
	queryFn: () => getAuthSession(),
	staleTime: 60_000,
	retry: false,
});

import { queryOptions } from "@tanstack/react-query";
import { authClient } from "#/lib/auth-client";

export const apiKeyKeys = {
	all: ["api-keys"] as const,
};

export const apiKeysQueryOptions = queryOptions({
	queryKey: apiKeyKeys.all,
	queryFn: async () => {
		const { data, error } = await authClient.apiKey.list({
			query: {
				limit: 50,
				sortBy: "createdAt",
				sortDirection: "desc",
			},
		});
		if (error) {
			throw new Error(error.message ?? "Failed to load API keys");
		}
		return data;
	},
});

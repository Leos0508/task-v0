import { createFileRoute } from "@tanstack/react-router";
import {
	ApiKeyRateLimitedError,
	getUserFromApiKey,
	rateLimitedResponse,
	unauthorizedResponse,
} from "#/mcp/auth";
import { createTaskMcpHandler } from "#/mcp/server";

async function handleMcp({ request }: { request: Request }) {
	try {
		const user = await getUserFromApiKey(request);
		if (!user) {
			return unauthorizedResponse();
		}

		const handler = createTaskMcpHandler(user);
		return handler.fetch(request);
	} catch (error) {
		if (error instanceof ApiKeyRateLimitedError) {
			return rateLimitedResponse(error.message);
		}
		throw error;
	}
}

export const Route = createFileRoute("/api/mcp")({
	server: {
		handlers: {
			GET: handleMcp,
			POST: handleMcp,
			DELETE: handleMcp,
		},
	},
});

import type { User } from "better-auth";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { user as userTable } from "#/db/schema";
import { auth } from "#/lib/auth";

export class ApiKeyRateLimitedError extends Error {
	constructor(message = "API key rate limit exceeded") {
		super(message);
		this.name = "ApiKeyRateLimitedError";
	}
}

function readApiKey(request: Request) {
	const authorization = request.headers.get("authorization");
	if (authorization?.toLowerCase().startsWith("bearer ")) {
		const token = authorization.slice(7).trim();
		if (token) return token;
	}

	const headerKey = request.headers.get("x-api-key")?.trim();
	return headerKey && headerKey.length > 0 ? headerKey : null;
}

export async function getUserFromApiKey(
	request: Request,
): Promise<User | null> {
	const key = readApiKey(request);
	if (!key) return null;

	const result = await auth.api.verifyApiKey({
		body: { key },
	});

	if (result.error?.code === "RATE_LIMITED") {
		throw new ApiKeyRateLimitedError(
			result.error.message ?? "API key rate limit exceeded",
		);
	}

	if (!result.valid || !result.key?.referenceId) {
		return null;
	}

	const [row] = await db
		.select({
			id: userTable.id,
			name: userTable.name,
			email: userTable.email,
			emailVerified: userTable.emailVerified,
			image: userTable.image,
			createdAt: userTable.createdAt,
			updatedAt: userTable.updatedAt,
		})
		.from(userTable)
		.where(eq(userTable.id, result.key.referenceId))
		.limit(1);

	return row ?? null;
}

export function unauthorizedResponse() {
	return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function rateLimitedResponse(message = "API key rate limit exceeded") {
	return Response.json({ error: message }, { status: 429 });
}

import { env } from "cloudflare:workers";

type ServerEnvName = {
	[K in keyof Cloudflare.Env]: Cloudflare.Env[K] extends string ? K : never;
}[keyof Cloudflare.Env];

function normalizeEnvValue(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}
	const trimmed = value.trim();
	if (
		trimmed.length >= 2 &&
		((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
			(trimmed.startsWith("'") && trimmed.endsWith("'")))
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}

function readEnv(name: ServerEnvName): string | undefined {
	try {
		const fromBinding = env[name];
		if (typeof fromBinding === "string" && fromBinding.length > 0) {
			return normalizeEnvValue(fromBinding);
		}
	} catch {
		// `cloudflare:workers` env is unavailable outside the Worker runtime.
	}

	return normalizeEnvValue(process.env[name]);
}

function requireEnv(
	name: Exclude<
		ServerEnvName,
		| "BETTER_AUTH_URL"
		| "QUOTA_EXEMPT_USER_IDS"
		| "RESEND_API_KEY"
		| "EMAIL_FROM"
	>,
): string {
	const value = readEnv(name);
	if (!value) {
		throw new Error(`${name} is not set`);
	}
	return value;
}

export function getDatabaseUrl() {
	return requireEnv("DATABASE_URL");
}

const DEFAULT_EMAIL_FROM = "Task <onboarding@resend.dev>";

export function getAuthEnv() {
	const baseURL = readEnv("BETTER_AUTH_URL");
	const trustedOrigins = new Set<string>();
	if (baseURL) {
		trustedOrigins.add(baseURL);
	}
	if (!baseURL || baseURL.startsWith("http://localhost:")) {
		trustedOrigins.add("http://localhost:3000");
		trustedOrigins.add("http://localhost:3001");
	}
	return {
		secret: requireEnv("BETTER_AUTH_SECRET"),
		baseURL,
		trustedOrigins: [...trustedOrigins],
	};
}

export function getEmailEnv() {
	const from = readEnv("EMAIL_FROM");
	return {
		apiKey: readEnv("RESEND_API_KEY"),
		from:
			!from || from.includes("yourdomain.com")
				? DEFAULT_EMAIL_FROM
				: from,
	};
}

export function getQuotaExemptUserIds() {
	const raw = readEnv("QUOTA_EXEMPT_USER_IDS") ?? "";
	return raw
		.split(",")
		.map((id) => id.trim())
		.filter((id) => id.length > 0);
}

export function getUploadsBucket() {
	try {
		const bucket = env.UPLOADS;
		if (bucket) {
			return bucket;
		}
	} catch {
		// `cloudflare:workers` env is unavailable outside the Worker runtime.
	}

	throw new Error("UPLOADS is not set");
}

import { env } from "cloudflare:workers";

type ServerEnvName = keyof Cloudflare.Env;

function readEnv(name: ServerEnvName): string | undefined {
	try {
		const fromBinding = env[name];
		if (typeof fromBinding === "string" && fromBinding.length > 0) {
			return fromBinding;
		}
	} catch {
		// `cloudflare:workers` env is unavailable outside the Worker runtime.
	}

	const fromProcess = process.env[name];
	return fromProcess && fromProcess.length > 0 ? fromProcess : undefined;
}

function requireEnv(name: Exclude<ServerEnvName, "BETTER_AUTH_URL">): string {
	const value = readEnv(name);
	if (!value) {
		throw new Error(`${name} is not set`);
	}
	return value;
}

export function getDatabaseUrl() {
	return requireEnv("DATABASE_URL");
}

export function getAuthEnv() {
	return {
		secret: requireEnv("BETTER_AUTH_SECRET"),
		baseURL: readEnv("BETTER_AUTH_URL"),
	};
}

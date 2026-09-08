declare namespace Cloudflare {
	interface Env {
		DATABASE_URL: string;
		BETTER_AUTH_SECRET: string;
		BETTER_AUTH_URL: string;
		UPLOADS: R2Bucket;
	}
}

declare module "cloudflare:workers" {
	export const env: Cloudflare.Env;
}

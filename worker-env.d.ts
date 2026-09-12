declare namespace Cloudflare {
	interface Env {
		DATABASE_URL: string;
		BETTER_AUTH_SECRET: string;
		BETTER_AUTH_URL: string;
		QUOTA_EXEMPT_USER_IDS: string;
		UPLOADS: R2Bucket;
	}
}

declare module "cloudflare:workers" {
	export const env: Cloudflare.Env;
}

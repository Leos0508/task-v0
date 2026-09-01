type ResultError = {
	code: "VALIDATE" | "UNKNOWN" | "NOT_FOUND" | "AUTHORIZATION" | "FORBIDDEN";
	message: string;
};

export type ActionResult<T> =
	| {
			success: true;
			data: T | undefined;
	  }
	| {
			success: false;
			error: ResultError;
	  };

export class AppError extends Error {
	constructor(
		public code: ResultError["code"],
		message: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

export function isUniqueConstraintError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		error.code === "23505"
	);
}

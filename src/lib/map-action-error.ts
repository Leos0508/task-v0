import type { ActionResult } from "#/types/result";
import { AppError, isUniqueConstraintError } from "#/types/result";

export function mapActionError(
	error: unknown,
	fallback: string,
	uniqueMessage = "This value is already in use",
): ActionResult<never> {
	if (error instanceof Error && error.message === "Unauthorized") {
		return {
			success: false,
			error: { code: "AUTHORIZATION", message: "You must be signed in" },
		};
	}

	if (error instanceof AppError) {
		return {
			success: false,
			error: { code: error.code, message: error.message },
		};
	}

	if (isUniqueConstraintError(error)) {
		return {
			success: false,
			error: {
				code: "VALIDATE",
				message: uniqueMessage,
			},
		};
	}

	return {
		success: false,
		error: { code: "UNKNOWN", message: fallback },
	};
}

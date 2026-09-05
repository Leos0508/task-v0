import { AppError } from "#/types/result";

export function formatMcpError(error: unknown) {
	if (error instanceof AppError) {
		return error.message;
	}
	if (error instanceof Error && error.message === "Unauthorized") {
		return "You must be signed in";
	}
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return "Something went wrong";
}

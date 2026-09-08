import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createWorkspaceFile } from "#/lib/data/create-workspace-file";
import { mapActionError } from "#/lib/map-action-error";
import { authMiddleware } from "#/middlewares/auth-middleware";

function parseUploadInput(input: unknown) {
	if (input instanceof FormData) {
		return {
			workspaceCode: input.get("workspaceCode"),
			file: input.get("file"),
		};
	}
	return input;
}

export const uploadDescriptionImageFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input: FormData) =>
		z
			.object({
				workspaceCode: z.string().min(1),
				file: z.instanceof(File),
			})
			.parse(parseUploadInput(input)),
	)
	.handler(async ({ data, context }) => {
		try {
			const uploaded = await createWorkspaceFile(
				context.user,
				data.workspaceCode,
				data.file,
			);
			return { success: true as const, data: uploaded };
		} catch (error) {
			return mapActionError(error, "Failed to upload image");
		}
	});

export async function uploadDescriptionImage(
	workspaceCode: string,
	file: File,
) {
	const formData = new FormData();
	formData.append("workspaceCode", workspaceCode);
	formData.append("file", file);
	const result = await uploadDescriptionImageFn({
		data: formData,
	});
	if (!result.success || !result.data) {
		throw new Error(
			result.success ? "Failed to upload image" : result.error.message,
		);
	}
	return result.data;
}

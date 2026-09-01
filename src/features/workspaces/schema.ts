import { z } from "zod";

export const createWorkspaceSchema = z.object({
	name: z.string().min(1, "Name is required").max(80),
	color: z
		.string()
		.regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #AABBCC"),
	code: z
		.string()
		.min(2, "Code must be at least 2 characters")
		.max(12, "Code must be at most 12 characters")
		.regex(/^[A-Za-z0-9]+$/, "Code must contain only letters and numbers"),
});

export const updateWorkspaceSchema = createWorkspaceSchema;

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

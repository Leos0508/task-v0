import { z } from "zod";

export const emptyDocumentDescription = {
	type: "doc",
	content: [{ type: "paragraph" }],
};

const documentFormFields = z.object({
	title: z.string().min(1, "Title is required").max(200),
	description: z.unknown(),
});

export const documentFormSchema = documentFormFields;

export const updateDocumentSchema = documentFormFields
	.partial()
	.refine(
		(value) => value.title !== undefined || value.description !== undefined,
		{ message: "No changes provided" },
	);

export type DocumentFormValues = z.infer<typeof documentFormFields>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

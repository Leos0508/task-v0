import { z } from "zod";

export const emptyDocumentDescription = {
	type: "doc",
	content: [{ type: "paragraph" }],
};

export const DOCUMENT_SORT_FIELDS = [
	"updatedAt",
	"createdAt",
	"title",
] as const;

export type DocumentSortField = (typeof DOCUMENT_SORT_FIELDS)[number];

export const documentSearchDefaults = {
	sort: "updatedAt" as const,
	dir: "desc" as const,
};

export const documentSearchSchema = z.object({
	sort: z.enum(DOCUMENT_SORT_FIELDS).default("updatedAt").catch("updatedAt"),
	dir: z.enum(["asc", "desc"]).default("desc").catch("desc"),
});

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

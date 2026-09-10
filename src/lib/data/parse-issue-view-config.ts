import {
	type IssueViewConfig,
	issueViewConfigSchema,
} from "#/features/issues/schema";

export function parseIssueViewConfig(value: unknown): IssueViewConfig | null {
	const parsed = issueViewConfigSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
}

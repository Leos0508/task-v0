export function workspacePath(code: string, ...segments: string[]) {
	return ["/app", code, ...segments].join("/");
}

export function issuePath(workspaceCode: string, issueNumber: number | string) {
	return workspacePath(workspaceCode, "issues", String(issueNumber));
}

export function documentPath(workspaceCode: string, documentId: string) {
	return workspacePath(workspaceCode, "documents", documentId);
}

export function issueCode(workspaceCode: string, issueNumber: number) {
	return `${workspaceCode}-${issueNumber}`;
}

export function parseIssueNumber(value: string) {
	if (!/^\d+$/.test(value)) return null;
	const number = Number(value);
	if (!Number.isInteger(number) || number < 1) return null;
	return number;
}

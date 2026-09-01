import { queryOptions } from "@tanstack/react-query";
import {
	getDocumentFn,
	listDocumentsFn,
} from "#/lib/functions/documents.functions";

export const documentKeys = {
	all: (workspaceCode: string) =>
		["workspaces", workspaceCode, "documents"] as const,
	detail: (workspaceCode: string, id: string) =>
		["workspaces", workspaceCode, "documents", id] as const,
};

export function documentsQueryOptions(workspaceCode: string) {
	return queryOptions({
		queryKey: documentKeys.all(workspaceCode),
		queryFn: () => listDocumentsFn({ data: { code: workspaceCode } }),
	});
}

export function documentQueryOptions(workspaceCode: string, id: string) {
	return queryOptions({
		queryKey: documentKeys.detail(workspaceCode, id),
		queryFn: () => getDocumentFn({ data: { code: workspaceCode, id } }),
	});
}

import type { WorkspaceRole } from "#/db/schema";

export type { WorkspaceRole };

export type WorkspaceListItem = {
	id: string;
	code: string;
	name: string;
	color: string;
	role: WorkspaceRole;
	createdAt: string;
};

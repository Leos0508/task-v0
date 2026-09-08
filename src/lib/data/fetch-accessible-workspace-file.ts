import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { workspaceFile, workspaceUser } from "#/db/schema";

export async function fetchAccessibleWorkspaceFile(
	userId: string,
	fileId: string,
) {
	const [row] = await db
		.select({
			id: workspaceFile.id,
			key: workspaceFile.key,
			mimeType: workspaceFile.mimeType,
			size: workspaceFile.size,
		})
		.from(workspaceFile)
		.innerJoin(
			workspaceUser,
			and(
				eq(workspaceUser.workspaceId, workspaceFile.workspaceId),
				eq(workspaceUser.userId, userId),
			),
		)
		.where(eq(workspaceFile.id, fileId))
		.limit(1);

	return row ?? null;
}

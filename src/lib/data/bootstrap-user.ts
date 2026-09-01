import { eq } from "drizzle-orm";
import { db } from "#/db";
import { user, workspace, workspaceUser } from "#/db/schema";
import { getRandomPastelHexColor } from "#/lib/utils";
import { allocateWorkspaceCode } from "#/lib/workspace-code.server";

export async function bootstrapUser(id: string) {
	const [existingUser] = await db
		.select()
		.from(user)
		.where(eq(user.id, id))
		.limit(1);

	if (!existingUser) {
		throw new Error("User not found");
	}

	const [existing] = await db
		.select({ id: workspaceUser.id })
		.from(workspaceUser)
		.where(eq(workspaceUser.userId, id))
		.limit(1);

	if (existing) return;

	const [created] = await db
		.insert(workspace)
		.values({
			name: `${existingUser.name}'s Workspace`,
			color: getRandomPastelHexColor(),
			code: await allocateWorkspaceCode(`${existingUser.name}'s Workspace`),
		})
		.returning({ id: workspace.id });

	await db.insert(workspaceUser).values({
		workspaceId: created.id,
		userId: id,
		role: "OWNER",
	});
}

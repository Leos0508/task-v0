import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import { getUserQuota, getWorkspaceQuota } from "#/lib/limits";
import { authMiddleware } from "#/middlewares/auth-middleware";

export const getUserQuotaFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => getUserQuota(context.user.id));

export const getWorkspaceQuotaFn = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.validator(z.object({ code: z.string() }))
	.handler(async ({ data, context }) => {
		const { workspace } = await getWorkspaceAccess(context.user, data.code);
		return getWorkspaceQuota(workspace.id, context.user.id);
	});

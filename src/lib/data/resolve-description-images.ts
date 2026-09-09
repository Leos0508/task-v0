import type { User } from "better-auth";
import { and, eq } from "drizzle-orm";
import { db } from "#/db";
import { workspaceFile } from "#/db/schema";
import {
	descriptionImageFileId,
	descriptionImageSrc,
	isDescriptionImageMimeType,
} from "#/lib/description-image";
import type { JsonValue } from "#/types/json";
import { AppError } from "#/types/result";
import { getWorkspaceAccess } from "./require-workspace-access";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function resolveImageNode(
	workspaceId: string,
	node: Record<string, unknown>,
) {
	const attrs = isRecord(node.attrs) ? { ...node.attrs } : {};
	const fileId = descriptionImageFileId(String(attrs.src ?? ""));
	if (!fileId) {
		throw new AppError(
			"VALIDATE",
			"Images must use /files/{fileId} for a workspace file",
		);
	}

	const [file] = await db
		.select({
			id: workspaceFile.id,
			mimeType: workspaceFile.mimeType,
		})
		.from(workspaceFile)
		.where(
			and(
				eq(workspaceFile.id, fileId),
				eq(workspaceFile.workspaceId, workspaceId),
			),
		)
		.limit(1);

	if (!file || !isDescriptionImageMimeType(file.mimeType)) {
		throw new AppError("VALIDATE", "Image file not found in this workspace");
	}

	attrs.src = descriptionImageSrc(file.id);
	return { ...node, attrs };
}

export async function resolveDescriptionImages(
	sessionUser: User,
	workspaceCode: string,
	value: JsonValue,
): Promise<JsonValue> {
	const { workspace } = await getWorkspaceAccess(sessionUser, workspaceCode);

	async function walk(node: unknown): Promise<unknown> {
		if (Array.isArray(node)) {
			return Promise.all(node.map((child) => walk(child)));
		}
		if (!isRecord(node)) return node;

		let next: Record<string, unknown> = node;
		if (node.type === "image") {
			next = await resolveImageNode(workspace.id, node);
		}
		if (Array.isArray(next.content)) {
			next = { ...next, content: await Promise.all(next.content.map(walk)) };
		}
		return next;
	}

	return (await walk(value)) as JsonValue;
}

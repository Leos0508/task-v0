import { createId } from "@paralleldrive/cuid2";
import type { User } from "better-auth";
import { db } from "#/db";
import { workspaceFile } from "#/db/schema";
import { getWorkspaceAccess } from "#/lib/data/require-workspace-access";
import {
	DESCRIPTION_IMAGE_MAX_BYTES,
	descriptionImageExtension,
	descriptionImageSrc,
	isDescriptionImageMimeType,
} from "#/lib/description-image";
import { getUploadsBucket } from "#/lib/env.server";
import { assertCanUploadBytes } from "#/lib/limits";
import { AppError } from "#/types/result";

export async function createWorkspaceFile(
	sessionUser: User,
	workspaceCode: string,
	file: File,
) {
	if (!isDescriptionImageMimeType(file.type)) {
		throw new AppError("VALIDATE", "Use a JPEG, PNG, GIF, or WebP image");
	}
	if (file.size === 0) {
		throw new AppError("VALIDATE", "Image is empty");
	}
	if (file.size > DESCRIPTION_IMAGE_MAX_BYTES) {
		throw new AppError("VALIDATE", "Images must be 5 MB or smaller");
	}

	const { user, workspace } = await getWorkspaceAccess(
		sessionUser,
		workspaceCode,
	);

	const fileId = createId();
	const key = `${workspace.id}/${fileId}.${descriptionImageExtension(file.type)}`;
	const bytes = await file.arrayBuffer();

	if (bytes.byteLength === 0) {
		throw new AppError("VALIDATE", "Image is empty");
	}
	if (bytes.byteLength > DESCRIPTION_IMAGE_MAX_BYTES) {
		throw new AppError("VALIDATE", "Images must be 5 MB or smaller");
	}

	await assertCanUploadBytes(workspace.id, user.id, bytes.byteLength);

	const bucket = getUploadsBucket();
	await bucket.put(key, bytes, {
		httpMetadata: { contentType: file.type },
	});

	await db.insert(workspaceFile).values({
		id: fileId,
		key,
		mimeType: file.type,
		size: bytes.byteLength,
		workspaceId: workspace.id,
		uploadedById: user.id,
	});

	return {
		fileId,
		src: descriptionImageSrc(fileId),
	};
}

export const DESCRIPTION_IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
] as const;

export type DescriptionImageMimeType =
	(typeof DESCRIPTION_IMAGE_MIME_TYPES)[number];

export const DESCRIPTION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const DESCRIPTION_IMAGE_ACCEPT = DESCRIPTION_IMAGE_MIME_TYPES.join(",");

const EXTENSION_BY_MIME: Record<DescriptionImageMimeType, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/gif": "gif",
	"image/webp": "webp",
};

export function isDescriptionImageMimeType(
	value: string,
): value is DescriptionImageMimeType {
	return (DESCRIPTION_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

export function descriptionImageExtension(mimeType: DescriptionImageMimeType) {
	return EXTENSION_BY_MIME[mimeType];
}

export function descriptionImageSrc(fileId: string) {
	return `/files/${fileId}`;
}

const FILES_PATH = /^\/files\/([^/?#]+)\/?$/;

export function descriptionImageFileId(src: string): string | null {
	const trimmed = src.trim();
	if (!trimmed) return null;

	const pathMatch = FILES_PATH.exec(trimmed);
	if (pathMatch?.[1]) return pathMatch[1];

	try {
		const url = new URL(trimmed);
		const fromPath = FILES_PATH.exec(url.pathname);
		if (fromPath?.[1]) return fromPath[1];
	} catch {
		// not an absolute URL
	}

	if (/^https?:\/\//i.test(trimmed)) return null;
	if (
		!trimmed.includes("/") &&
		!trimmed.includes(":") &&
		!trimmed.includes(" ")
	) {
		return trimmed;
	}

	return null;
}

export function assertDescriptionImage(file: File) {
	if (!isDescriptionImageMimeType(file.type)) {
		throw new Error("Use a JPEG, PNG, GIF, or WebP image");
	}
	if (file.size > DESCRIPTION_IMAGE_MAX_BYTES) {
		throw new Error("Images must be 5 MB or smaller");
	}
	if (file.size === 0) {
		throw new Error("Image is empty");
	}
}

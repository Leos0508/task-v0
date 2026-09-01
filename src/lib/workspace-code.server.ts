import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "#/db";
import { workspace } from "#/db/schema";
import { normalizeWorkspaceCode, slugifyWorkspaceCode } from "./workspace-code";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateWorkspaceCode(length = 8): string {
	const bytes = randomBytes(length);
	let code = "";

	for (const byte of bytes) {
		code += ALPHABET[byte % ALPHABET.length];
	}

	return code;
}

export async function allocateWorkspaceCode(name: string): Promise<string> {
	const base = slugifyWorkspaceCode(name) || generateWorkspaceCode(6);

	for (let index = 0; index < 30; index += 1) {
		const candidate = index === 0 ? base : `${base}${index + 1}`.slice(0, 12);
		const existing = await db.query.workspace.findFirst({
			where: eq(workspace.code, candidate),
			columns: { id: true },
		});

		if (!existing) {
			return candidate;
		}
	}

	return generateWorkspaceCode(8);
}

export async function isWorkspaceCodeAvailable(code: string) {
	const normalized = normalizeWorkspaceCode(code);
	if (!normalized) {
		return false;
	}

	const existing = await db.query.workspace.findFirst({
		where: eq(workspace.code, normalized),
		columns: { id: true },
	});

	return !existing;
}

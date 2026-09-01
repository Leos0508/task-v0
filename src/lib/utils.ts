import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getRandomPastelHexColor(): string {
	const r = Math.floor(Math.random() * 127 + 127);
	const g = Math.floor(Math.random() * 127 + 127);
	const b = Math.floor(Math.random() * 127 + 127);
	const toHex = (value: number): string => value.toString(16).padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function formatDateTime(value: string) {
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

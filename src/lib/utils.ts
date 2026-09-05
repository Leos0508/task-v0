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

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
	numeric: "auto",
});

const RELATIVE_TIME_DIVISIONS = [
	{ amount: 60, unit: "second" },
	{ amount: 60, unit: "minute" },
	{ amount: 24, unit: "hour" },
	{ amount: 7, unit: "day" },
	{ amount: 4.34524, unit: "week" },
	{ amount: 12, unit: "month" },
	{ amount: Number.POSITIVE_INFINITY, unit: "year" },
] as const;

export function formatRelativeTime(value: string) {
	let duration = (new Date(value).getTime() - Date.now()) / 1000;
	for (const division of RELATIVE_TIME_DIVISIONS) {
		if (Math.abs(duration) < division.amount) {
			return relativeTimeFormatter.format(Math.round(duration), division.unit);
		}
		duration /= division.amount;
	}
	return relativeTimeFormatter.format(Math.round(duration), "year");
}

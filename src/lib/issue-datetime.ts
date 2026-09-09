const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const MINUTE_PRECISION = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const SECOND_PRECISION = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function pad(value: number) {
	return String(value).padStart(2, "0");
}

function toMinuteIso(date: Date) {
	const copy = new Date(date.getTime());
	copy.setUTCSeconds(0, 0);
	return copy.toISOString();
}

function parseDateValue(value: string) {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const withT = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
	const withOffset = withT.replace(/([+-]\d{2})$/, "$1:00");
	const parsed = new Date(withOffset);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseIssueDateTime(
	value: string,
	bound: "start" | "end" = "start",
) {
	const trimmed = value.trim();
	if (!trimmed) return null;

	if (DATE_ONLY.test(trimmed)) {
		return bound === "end"
			? `${trimmed}T23:59:00.000Z`
			: `${trimmed}T00:00:00.000Z`;
	}

	if (MINUTE_PRECISION.test(trimmed)) {
		const parsed = new Date(`${trimmed}:00.000Z`);
		if (Number.isNaN(parsed.getTime())) return null;
		return parsed.toISOString();
	}

	if (SECOND_PRECISION.test(trimmed)) {
		const parsed = new Date(`${trimmed}.000Z`);
		if (Number.isNaN(parsed.getTime())) return null;
		return toMinuteIso(parsed);
	}

	const parsed = parseDateValue(trimmed);
	if (!parsed) return null;
	return toMinuteIso(parsed);
}

export function toIssueDateTimeIso(value: Date | string | null | undefined) {
	if (value == null) return null;
	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) return null;
		return value.toISOString();
	}
	return parseIssueDateTime(value);
}

export function toDatetimeLocalValue(iso: string | null | undefined) {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return toMinuteIso(date);
}

export function toGanttDateTime(iso: string) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export function fromGanttDateTime(value: Date) {
	if (Number.isNaN(value.getTime())) return null;
	return toMinuteIso(value);
}

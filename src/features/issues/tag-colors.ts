export const TAG_COLOR_IDS = [
	"slate",
	"red",
	"orange",
	"amber",
	"lime",
	"green",
	"teal",
	"sky",
	"blue",
	"violet",
	"fuchsia",
	"rose",
] as const;

export type TagColorId = (typeof TAG_COLOR_IDS)[number];

export const TAG_COLORS: ReadonlyArray<{
	id: TagColorId;
	hex: string;
	bg: string;
	fg: string;
}> = [
	{ id: "slate", hex: "#64748b", bg: "#e8e8ea", fg: "#3f3f46" },
	{ id: "red", hex: "#ef4444", bg: "#fde4e4", fg: "#9f2d2d" },
	{ id: "orange", hex: "#f97316", bg: "#fde8d4", fg: "#9a4d14" },
	{ id: "amber", hex: "#f59e0b", bg: "#f6ecc8", fg: "#6b5420" },
	{ id: "lime", hex: "#84cc16", bg: "#e8f3c8", fg: "#4a6420" },
	{ id: "green", hex: "#22c55e", bg: "#d8eee6", fg: "#1f5c4a" },
	{ id: "teal", hex: "#14b8a6", bg: "#d8eee6", fg: "#1f5c4a" },
	{ id: "sky", hex: "#0ea5e9", bg: "#dceaf6", fg: "#2a4a6b" },
	{ id: "blue", hex: "#3b82f6", bg: "#dbeafe", fg: "#1e3a5f" },
	{ id: "violet", hex: "#8b5cf6", bg: "#e8e0f4", fg: "#4a3a6b" },
	{ id: "fuchsia", hex: "#d946ef", bg: "#f5e0f4", fg: "#6b3a68" },
	{ id: "rose", hex: "#f43f5e", bg: "#fde4ec", fg: "#9f2d4a" },
];

const TAG_COLOR_BY_ID = new Map(TAG_COLORS.map((color) => [color.id, color]));
const TAG_COLOR_BY_HEX = new Map(
	TAG_COLORS.map((color) => [color.hex.toLowerCase(), color]),
);

export function resolveTagColor(value: string) {
	return (
		TAG_COLOR_BY_ID.get(value as TagColorId) ??
		TAG_COLOR_BY_HEX.get(value.toLowerCase()) ??
		TAG_COLORS[0]
	);
}

export function getRandomTagColorId(): TagColorId {
	return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)].id;
}

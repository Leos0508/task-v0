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

export const TAG_COLORS: ReadonlyArray<{ id: TagColorId; hex: string }> = [
	{ id: "slate", hex: "#64748b" },
	{ id: "red", hex: "#ef4444" },
	{ id: "orange", hex: "#f97316" },
	{ id: "amber", hex: "#f59e0b" },
	{ id: "lime", hex: "#84cc16" },
	{ id: "green", hex: "#22c55e" },
	{ id: "teal", hex: "#14b8a6" },
	{ id: "sky", hex: "#0ea5e9" },
	{ id: "blue", hex: "#3b82f6" },
	{ id: "violet", hex: "#8b5cf6" },
	{ id: "fuchsia", hex: "#d946ef" },
	{ id: "rose", hex: "#f43f5e" },
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

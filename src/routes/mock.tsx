import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/mock")({
	head: () => ({
		meta: [{ title: "Task mock" }],
		links: [
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400..700&display=swap",
			},
		],
	}),
	component: MockLayout,
});

function MockLayout() {
	return (
		<div className="mock-editorial flex h-full min-h-0 flex-col">
			<Outlet />
		</div>
	);
}

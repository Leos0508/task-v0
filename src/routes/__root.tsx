import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "sonner";
import PageError from "#/components/PageError";
import PageLoading from "#/components/PageLoading";
import PageNotFound from "#/components/PageNotFound";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

const detailFormCriticalCss = `[data-slot="sidebar-wrapper"]{display:flex;min-height:100svh;width:100%}[data-slot="sidebar"]{display:none}[data-slot="sidebar-gap"]{width:var(--sidebar-width,16rem);flex-shrink:0}[data-slot="sidebar-container"]{position:fixed;inset-block:0;left:0;z-index:10;display:none;height:100svh;width:var(--sidebar-width,16rem)}[data-slot="sidebar-inset"]{display:flex;flex:1 1 0%;min-width:0;min-height:0;height:100svh;flex-direction:column;overflow:hidden}@media (min-width:768px){[data-slot="sidebar"]{display:block}[data-slot="sidebar-container"]{display:flex}}.dashboard-page{display:flex;height:100%;min-height:0;min-width:0;width:100%;flex-direction:column;overflow:hidden}.detail-form-layout{display:grid;grid-template-columns:minmax(0,1fr) 15rem;align-items:start;width:100%;max-width:72rem;margin-inline:auto;gap:2rem;padding:2rem 1.5rem}.detail-form-main,.detail-form-aside{display:flex;min-width:0;flex-direction:column;gap:1rem}.detail-form-aside{gap:2rem}@media (max-width:767px){.detail-form-layout{grid-template-columns:minmax(0,1fr)!important}}.tiptap-editor{min-height:16rem}`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{ title: "Task" },
		],
		links: [
			{ rel: "icon", type: "image/svg+xml", href: "/logo-icon.svg" },
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400..700&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Space+Grotesk:wght@400..700&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
		styles: [{ children: detailFormCriticalCss }],
	}),
	shellComponent: RootDocument,
	pendingComponent: PageLoading,
	errorComponent: PageError,
	notFoundComponent: () => <PageNotFound />,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="h-full antialiased font-sans">
			<head>
				<HeadContent />
				<style>{detailFormCriticalCss}</style>
			</head>
			<body className="h-screen w-screen overflow-hidden">
				{children}
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Toaster />
				<Scripts />
			</body>
		</html>
	);
}

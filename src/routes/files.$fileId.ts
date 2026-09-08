import { createFileRoute } from "@tanstack/react-router";
import { getSession } from "#/lib/auth.functions";
import { fetchAccessibleWorkspaceFile } from "#/lib/data/fetch-accessible-workspace-file";
import { getUploadsBucket } from "#/lib/env.server";

const notFoundResponse = () =>
	new Response("Not found", {
		status: 404,
		headers: { "Cache-Control": "no-store" },
	});

export const Route = createFileRoute("/files/$fileId")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const session = await getSession();
				if (!session) {
					return notFoundResponse();
				}

				const file = await fetchAccessibleWorkspaceFile(
					session.user.id,
					params.fileId,
				);
				if (!file) {
					return notFoundResponse();
				}

				const object = await getUploadsBucket().get(file.key);
				if (!object) {
					return notFoundResponse();
				}

				return new Response(object.body, {
					headers: {
						"Content-Type": file.mimeType,
						"Content-Length": String(file.size),
						"Cache-Control": "private, max-age=3600",
						"X-Content-Type-Options": "nosniff",
					},
				});
			},
		},
	},
});

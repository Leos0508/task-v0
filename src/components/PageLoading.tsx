import { Loader2Icon } from "lucide-react";

export default function PageLoading() {
	return (
		<div className="flex h-full min-h-40 w-full items-center justify-center text-muted-foreground">
			<Loader2Icon className="mr-2 size-6 animate-spin" />
			<span>Loading ...</span>
		</div>
	);
}

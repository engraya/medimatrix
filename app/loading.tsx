import { LoaderCircle } from "lucide-react";
export default function Loading() {
  return (
    <main
      id="main-content"
      role="status"
      className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 text-muted-foreground"
    >
      <LoaderCircle
        className="size-8 animate-spin text-primary"
        aria-hidden="true"
      />
      <p>Loading your workspace...</p>
    </main>
  );
}

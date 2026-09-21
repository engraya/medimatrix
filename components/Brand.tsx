import Link from "next/link";
import { Activity } from "lucide-react";
export function Brand() {
  return (
    <Link
      href="/"
      aria-label="MediMatrix home"
      className="inline-flex shrink-0 items-center gap-3 rounded-lg"
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Activity size={24} aria-hidden="true" />
      </span>
      <span className="text-xl font-bold tracking-tight text-foreground">
        Medi<span className="text-primary">Matrix</span>
      </span>
    </Link>
  );
}

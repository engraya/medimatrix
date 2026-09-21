import Link from "next/link";
import { CareShell } from "@/components/CareShell";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <CareShell>
      <div className="space-y-6">
        <p className="eyebrow">PAGE NOT FOUND</p>
        <h1 className="header">Let’s get you back on track.</h1>
        <p className="text-muted-foreground">
          This page may have moved or is no longer available.
        </p>
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </CareShell>
  );
}

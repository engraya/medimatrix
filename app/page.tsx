import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PatientForm } from "@/components/forms/PatientForm";
import { CareShell } from "@/components/CareShell";
export default function Home() {
  return (
    <CareShell>
      <PatientForm />
      <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6 text-sm">
        <span className="text-muted-foreground">Part of the care team?</span>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
        >
          Staff sign in <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </CareShell>
  );
}

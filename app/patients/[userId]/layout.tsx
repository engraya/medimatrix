import { requirePatient } from "@/lib/api/server";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";
export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  await requirePatient(userId);
  return (
    <>
      <nav
        aria-label="Patient navigation"
        className="flex flex-wrap items-center justify-end gap-5 border-b border-border px-6 py-4 text-sm"
      >
        <Link
          className="mr-auto text-primary"
          href={`/patients/${userId}/new-appointment`}
        >
          Appointments
        </Link>
        <Link className="underline" href={`/patients/${userId}/documents`}>
          Documents
        </Link>
        <LogoutButton />
      </nav>
      {children}
    </>
  );
}

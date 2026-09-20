import { requirePatient } from "@/lib/api/server";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";
export default async function PatientLayout({ children, params }: { children: React.ReactNode; params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  await requirePatient(userId);
  return <><div className="flex items-center justify-end gap-6 px-6 pt-4"><Link className="underline" href={`/patients/${userId}/documents`}>Documents</Link><LogoutButton /></div>{children}</>;
}

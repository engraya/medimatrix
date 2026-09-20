import Image from "next/image";
import Link from "next/link";

import { StatCard } from "@/components/StatCard";
import { columns } from "@/components/table/columns";
import { DataTable } from "@/components/table/DataTable";
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";
import { requireStaff } from "@/lib/api/server";
import { getDoctors } from "@/lib/api/doctors";
import { DoctorsProvider } from "@/components/DoctorsProvider";
import { LogoutButton } from "@/components/LogoutButton";

const AdminPage = async ({ searchParams }: SearchParamProps) => {
  await requireStaff();
  const rawPage = Number((await searchParams).page ?? 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const [appointments, doctors] = await Promise.all([getRecentAppointmentList(page), getDoctors()]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <header className="admin-header">
        <Link href="/" className="cursor-pointer flex gap-x-4">
          <Image
            src="/assets/icons/logo-full.svg"
            height={32}
            width={162}
            alt="logo"
            className="h-8 w-fit"
          />
            <h1 className="text-xl font-extrabold text-center leading-none tracking-normal text-gray-900 md:text-3xl md:tracking-tight">
              <span className="block w-full underline text-transparent text-center bg-clip-text bg-gradient-to-r from-green-400 to-purple-500 lg:inline">
              Medimatrix
              </span>
            </h1>
        </Link>

        <p className="text-16-semibold">Admin Dashboard</p>
        <LogoutButton />
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
        <h1 className="text-xl font-extrabold text-center leading-none tracking-normal text-gray-900 md:text-5xl md:tracking-tight">
              <span className="block w-full underline text-transparent text-center bg-clip-text bg-gradient-to-r from-green-400 to-purple-500 lg:inline">
              Welcome to Admin Dashboard
              </span>
            </h1>
          <h1 className="header"> 👋</h1>
          <p className="text-dark-700 text-center">
            Start the day with managing new appointments
          </p>
        </section>

        <section className="admin-stat">
          <StatCard
            type="appointments"
            count={appointments.scheduledCount}
            label="Scheduled appointments"
            icon={"/assets/icons/appointments.svg"}
          />
          <StatCard
            type="pending"
            count={appointments.pendingCount}
            label="Pending appointments"
            icon={"/assets/icons/pending.svg"}
          />
          <StatCard
            type="cancelled"
            count={appointments.cancelledCount}
            label="Cancelled appointments"
            icon={"/assets/icons/cancelled.svg"}
          />
        </section>

        <DoctorsProvider doctors={doctors}>
          <DataTable columns={columns} data={appointments.documents} page={page} total={appointments.totalCount} />
        </DoctorsProvider>
      </main>
    </div>
  );
};

export default AdminPage;

import { Brand } from "@/components/Brand";

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
  const [appointments, doctors] = await Promise.all([
    getRecentAppointmentList(page),
    getDoctors(),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <header className="admin-header">
        <Brand />

        <span className="hidden rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
          Care team workspace
        </span>
        <LogoutButton />
      </header>

      <main id="main-content" className="admin-main">
        <section className="w-full space-y-3">
          <p className="eyebrow">OVERVIEW</p>
          <h1 className="header">Appointments at a glance.</h1>
          <p className="text-muted-foreground">
            Review requests, coordinate schedules, and keep patient care moving.
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

        <div className="w-full space-y-2">
          <h2 className="sub-header">Appointment requests</h2>
          <p className="text-sm text-muted-foreground">
            Manage your patients’ upcoming visits.
          </p>
        </div>
        <DoctorsProvider doctors={doctors}>
          <DataTable
            columns={columns}
            data={appointments.documents}
            page={page}
            total={appointments.totalCount}
          />
        </DoctorsProvider>
      </main>
    </div>
  );
};

export default AdminPage;

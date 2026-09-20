import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { requirePatient } from "@/lib/api/server";
import { ApiError } from "@/lib/api/shared";
import { getAppointment } from "@/lib/actions/appointment.actions";
import { formatDateTime } from "@/lib/utils";

const RequestSuccess = async ({
  searchParams,
  params,
}: SearchParamProps) => {
  const { userId } = await params;
  await requirePatient(userId);
  const appointmentId = (await searchParams).appointmentId;
  if (typeof appointmentId !== "string" || !/^[\w-]{1,128}$/.test(appointmentId)) notFound();
  let appointment;
  try { appointment = await getAppointment(appointmentId); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); throw error; }

  return (
    <div className=" flex h-screen max-h-screen px-[5%]">
      <div className="success-img">
        <Link href="/">
          <Image
            src="/assets/icons/logo-full.svg"
            height={1000}
            width={1000}
            alt="logo"
            className="h-16 w-fit"
          />
        </Link>

        <section className="flex flex-col items-center">
          <Image
            src="/assets/gifs/success.gif"
            unoptimized
            height={300}
            width={280}
            alt="success"
          />
          <h2 className="header mb-6 max-w-[600px] text-emerald-50 text-center">
            Your <span className="text-green-500">appointment request</span> has
            been successfully submitted!
          </h2>
          <p className="text-emerald-50">We&apos;ll be in touch shortly to confirm.</p>
        </section>

        <section className="request-details text-emerald-50">
          <p>Requested appointment details: </p>
          <div className="flex items-center gap-3">
            <p className="whitespace-nowrap">{appointment.doctor?.name ?? "Your selected doctor"}</p>
          </div>
          <div className="flex gap-2">
            <Image
              src="/assets/icons/calendar.svg"
              height={24}
              width={24}
              alt="calendar"
            />
            <p> {formatDateTime(appointment.schedule).dateTime}</p>
          </div>
        </section>

        {/* <Button variant="outline" className="shad-primary-btn" asChild>
          <Link href={`/patients/${userId}/new-appointment`}>
            New Appointment
          </Link>
        </Button> */}
        <Button variant="outline" className="text-white bg-red-300" asChild>
          <Link href={`/`}>
            Home Page
          </Link>
        </Button>

        <p className="copyright text-emerald-50">© 2024 Medimatrix</p>
      </div>
    </div>
  );
};

export default RequestSuccess;

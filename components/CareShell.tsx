import Image from "next/image";
import { HeartPulse, CalendarDays, FolderHeart } from "lucide-react";
import { Brand } from "./Brand";
export function CareShell({
  children,
  image = "/assets/images/onboarding-img.jpg",
  wide = false,
}: {
  children: React.ReactNode;
  image?: string;
  wide?: boolean;
}) {
  return (
    <div className={`care-shell ${wide ? "care-shell-wide" : ""}`}>
      <main id="main-content" className="min-w-0 px-6 py-8 sm:px-12 lg:px-16">
        <div
          className={`mx-auto flex min-h-full flex-col ${wide ? "max-w-3xl" : "max-w-md"}`}
        >
          <div className="mb-12">
            <Brand />
          </div>
          <div className="flex-1">{children}</div>
          <p className="mt-10 text-xs leading-6 text-muted-foreground">
            © {new Date().getFullYear()} MediMatrix. Care, thoughtfully
            connected.
          </p>
        </div>
      </main>
      <aside className="care-visual" aria-label="Care with MediMatrix">
        <Image
          src={image}
          alt=""
          fill
          sizes="(min-width: 1024px) 45vw, 1px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#062e2c] via-[#062e2c]/65 to-[#062e2c]/10" />
        <div className="relative z-10 flex h-full flex-col justify-end p-10 xl:p-14">
          <span className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-white/25 bg-white/10">
            <HeartPulse aria-hidden="true" />
          </span>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">
            A little simpler. A lot more personal.
          </p>
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Your care.
            <br />
            All connected.
          </h2>
          <p className="mt-5 max-w-sm text-base leading-7 text-teal-50/80">
            A thoughtful space to manage appointments, share your information,
            and take the next step in your care.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-white/20 pt-6 text-sm text-teal-50">
            <span className="flex items-center gap-2">
              <CalendarDays size={18} aria-hidden="true" />
              Appointments
            </span>
            <span className="flex items-center gap-2">
              <FolderHeart size={18} aria-hidden="true" />
              Patient records
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

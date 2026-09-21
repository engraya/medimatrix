import Image from "next/image";

type StatCardProps = {
  type: "appointments" | "pending" | "cancelled";
  count: number;
  label: string;
  icon: string;
};

export const StatCard = ({ count = 0, label, icon, type }: StatCardProps) => {
  return (
    <div className="stat-card" data-status={type}>
      <div className="flex items-center gap-4">
        <Image
          src={icon}
          height={32}
          width={32}
          alt=""
          className="size-8 w-fit"
        />
        <h2 className="text-32-bold text-white">{count}</h2>
      </div>

      <p className="text-14-regular text-emerald-50">{label}</p>
    </div>
  );
};

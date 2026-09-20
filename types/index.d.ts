declare type SearchParamProps = {
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
declare type Gender = "Male" | "Female" | "Other";
declare type Status = "pending" | "scheduled" | "cancelled";
declare type User = import("./api").Identity;

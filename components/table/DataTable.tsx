"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  total: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  total,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (next: number) =>
    startTransition(() => router.push(`/admin?page=${next}`));

  // React Compiler is not enabled; TanStack manages the table's state.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="data-table" aria-busy={pending}>
      <p className="border-b border-border px-4 py-3 text-xs text-muted-foreground md:hidden">
        Swipe across to view appointment details and actions.
      </p>
      <Table
        className="shad-table min-w-[720px]"
        aria-label="Patient appointments"
      >
        <TableHeader className=" bg-dark-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="shad-table-row-header">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="shad-table-row"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No appointments to display. New requests will appear here.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="table-actions">
        <p aria-live="polite">
          Page {page} of {Math.max(1, Math.ceil(total / 20))}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(page - 1)}
          disabled={pending || page <= 1}
          aria-label="Previous page"
          className="shad-gray-btn"
        >
          <Image
            src="/assets/icons/arrow.svg"
            width={24}
            height={24}
            alt="arrow"
          />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(page + 1)}
          disabled={pending || page * 20 >= total}
          aria-label="Next page"
          className="shad-gray-btn"
        >
          <Image
            src="/assets/icons/arrow.svg"
            width={24}
            height={24}
            alt="arrow "
            className="rotate-180"
          />
        </Button>
      </div>
    </div>
  );
}

"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { JobSourceLogo } from "@/components/company-logo";
import { JobStatusBadge } from "@/components/job-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trackerStatuses } from "@/data/mock-data";
import { useApplicationStore } from "@/hooks/use-application-store";
import type { ApplicationJob, JobStatus } from "@/types/application";

function JobActionsMenu({
  job,
  onDelete,
  onUpdate,
}: {
  job: ApplicationJob;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ApplicationJob>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [draft, setDraft] = useState({
    role: job.role,
    company: job.company,
    platform: job.platform,
    location: job.location,
    status: job.status,
    jobUrl: job.jobUrl,
    jobDescription: job.jobDescription,
  });
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  function openEditor() {
    setDraft({
      role: job.role,
      company: job.company,
      platform: job.platform,
      location: job.location,
      status: job.status,
      jobUrl: job.jobUrl,
      jobDescription: job.jobDescription,
    });
    setOpen(false);
    setEditing(true);
  }

  useEffect(() => {
    if (!editing && !confirming) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [confirming, editing]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
        aria-label={`Open actions for ${job.role}`}
        onClick={() => {
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) {
            const menuWidth = 176;
            setMenuPosition({
              top: rect.bottom + 6,
              left: Math.min(
                Math.max(8, rect.right - menuWidth),
                window.innerWidth - menuWidth - 8,
              ),
            });
          }
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[100] w-44 rounded-lg border border-border bg-card p-1 text-left shadow-lg"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {job.jobUrl ? (
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4" />
                Open Job
              </a>
            ) : null}
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={openEditor}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => {
                setOpen(false);
                setConfirming(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>,
          document.body,
      )}
      {editing &&
        typeof document !== "undefined" &&
        createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
          <form
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            onSubmit={(event) => {
              event.preventDefault();
              onUpdate(job.id, {
                ...draft,
                status: draft.status as JobStatus,
                currentStage: draft.status,
              });
              setEditing(false);
            }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
              <div>
                <h3 className="text-2xl font-semibold">Edit application</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Update the details saved in Mira.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close editor"
                onClick={() => setEditing(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Role</span>
                <Input
                  value={draft.role}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Company</span>
                <Input
                  value={draft.company}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Platform</span>
                <Input
                  value={draft.platform}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      platform: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Location</span>
                <Input
                  value={draft.location}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Status</span>
                <select
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as JobStatus,
                    }))
                  }
                >
                  {trackerStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Job URL</span>
                <Input
                  value={draft.jobUrl}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      jobUrl: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label className="mt-3 block space-y-1.5">
              <span className="text-sm font-medium">Job description</span>
              <textarea
                className="min-h-64 w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={draft.jobDescription}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    jobDescription: event.target.value,
                  }))
                }
              />
            </label>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-border px-6 py-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="sm:min-w-40">
                Save changes
              </Button>
            </div>
          </form>
        </div>,
          document.body,
        )}
      {confirming &&
        typeof document !== "undefined" &&
        createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Delete application?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will remove {job.role} at {job.company} from your local job
              tracker.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  onDelete(job.id);
                  setConfirming(false);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}

export function JobApplicationsTable({ rows }: { rows?: ApplicationJob[] }) {
  const { jobs, deleteJob, updateJob } = useApplicationStore();
  const tableRows = rows ?? jobs;
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const filteredRows = useMemo(
    () =>
      tableRows.filter((job) => {
        return (
          (statusFilter === "All" || job.status === statusFilter) &&
          (platformFilter === "All" || job.platform === platformFilter)
        );
      }),
    [platformFilter, statusFilter, tableRows],
  );

  const platforms = useMemo(
    () => Array.from(new Set(tableRows.map((job) => job.platform))),
    [tableRows],
  );

  const columns = useMemo<ColumnDef<ApplicationJob>[]>(
    () => [
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.role}</span>
        ),
      },
      { accessorKey: "company", header: "Company" },
      {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row }) => (
          <JobSourceLogo platform={row.original.platform} company={row.original.company} />
        ),
      },
      { accessorKey: "location", header: "Location" },
      {
        accessorKey: "dateSaved",
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            Date Saved <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <JobStatusBadge status={row.original.status as JobStatus} />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <JobActionsMenu
            job={row.original}
            onDelete={deleteJob}
            onUpdate={updateJob}
          />
        ),
      },
    ],
    [deleteJob, updateJob],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <Card className="relative left-1/2 flex min-h-[calc(100vh-12rem)] w-[min(calc(100vw-2rem),1540px)] -translate-x-1/2 flex-col">
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-full pl-9 sm:w-60"
              placeholder="Search jobs"
              value={globalFilter}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                table.setPageIndex(0);
              }}
            />
          </div>
          <select
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              table.setPageIndex(0);
            }}
          >
            <option>All</option>
            {trackerStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
            value={platformFilter}
            onChange={(event) => {
              setPlatformFilter(event.target.value);
              table.setPageIndex(0);
            }}
          >
            <option>All</option>
            {platforms.map((platform) => (
              <option key={platform}>{platform}</option>
            ))}
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              setGlobalFilter("");
              setStatusFilter("All");
              setPlatformFilter("All");
              table.setPageIndex(0);
            }}
          >
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
          <table className="w-full min-w-[1320px] text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`whitespace-nowrap px-3 py-3 font-medium ${
                        header.column.id === "actions"
                          ? "sticky right-0 z-10 border-l border-border bg-muted text-center"
                          : ""
                      }`}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`whitespace-nowrap px-3 py-3 align-middle ${
                          cell.column.id === "actions"
                            ? "sticky right-0 z-10 border-l border-border bg-card text-center"
                            : ""
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Add your first job application from the dashboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 md:hidden">
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <div
                key={row.original.id}
                className="rounded-xl border border-border bg-card p-4 shadow-[0_8px_22px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold sm:text-base">{row.original.role}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                      {row.original.company} · {row.original.platform}
                    </p>
                  </div>
                  <JobStatusBadge status={row.original.status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {row.original.location && (
                      <span className="truncate">{row.original.location}</span>
                    )}
                    {row.original.dateSaved && (
                      <span>{row.original.dateSaved}</span>
                    )}
                  </div>
                  <JobActionsMenu
                    job={row.original}
                    onDelete={deleteJob}
                    onUpdate={updateJob}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Add your first job application from the dashboard.
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Rows per page</span>
            <select
              className="h-8 rounded-md border border-border bg-card px-2"
              value={table.getState().pagination.pageSize}
              onChange={(event) =>
                table.setPageSize(Number(event.target.value))
              }
            >
              {[5, 10, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            {Array.from({ length: table.getPageCount() || 1 }, (_, index) => (
              <Button
                key={index}
                variant={
                  table.getState().pagination.pageIndex === index
                    ? "primary"
                    : "secondary"
                }
                size="sm"
                onClick={() => table.setPageIndex(index)}
                aria-label={`Go to page ${index + 1}`}
              >
                {index + 1}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

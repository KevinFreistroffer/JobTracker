"use client";

import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  OpportunityForm,
  OpportunityFormValues,
  toFormValues,
} from "@/components/opportunity-form";
import { StatusBadge } from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CONTACT_TYPE_LABELS,
  CONTACT_TYPE_OPTIONS,
  OpportunityRecord,
  STATUS_OPTIONS,
} from "@/lib/constants";

type SortKey = "contactDate" | "companyName" | "status";

function buildQuery(
  statusFilter: string,
  contactTypeFilter: string,
  search: string,
) {
  const params = new URLSearchParams();
  if (statusFilter !== "ALL") {
    params.set("status", statusFilter);
  }
  if (contactTypeFilter !== "ALL") {
    params.set("contactType", contactTypeFilter);
  }
  if (search.trim()) {
    params.set("search", search.trim());
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function OpportunityDashboard() {
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [contactTypeFilter, setContactTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("contactDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] =
    useState<OpportunityRecord | null>(null);
  const [deletingOpportunity, setDeletingOpportunity] =
    useState<OpportunityRecord | null>(null);

  const loadOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/opportunities${buildQuery(statusFilter, contactTypeFilter, search)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load opportunities");
      }
      const data = (await response.json()) as OpportunityRecord[];
      setOpportunities(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load opportunities",
      );
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, contactTypeFilter, search]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  const sortedOpportunities = useMemo(() => {
    const copy = [...opportunities];
    copy.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "contactDate") {
        comparison =
          new Date(a.contactDate).getTime() - new Date(b.contactDate).getTime();
      } else if (sortKey === "companyName") {
        comparison = a.companyName.localeCompare(b.companyName);
      } else {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return copy;
  }, [opportunities, sortKey, sortDirection]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "contactDate" ? "desc" : "asc");
  }

  function openCreateDialog() {
    setEditingOpportunity(null);
    setFormOpen(true);
  }

  function openEditDialog(opportunity: OpportunityRecord) {
    setEditingOpportunity(opportunity);
    setFormOpen(true);
  }

  async function handleSubmit(values: OpportunityFormValues) {
    const payload = {
      ...values,
      recruiterEmail: values.recruiterEmail.trim() || null,
      roleTitle: values.roleTitle.trim() || null,
      notes: values.notes.trim() || null,
    };

    const response = await fetch(
      editingOpportunity
        ? `/api/opportunities/${editingOpportunity.id}`
        : "/api/opportunities",
      {
        method: editingOpportunity ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Failed to save opportunity");
    }

    setFormOpen(false);
    setEditingOpportunity(null);
    await loadOpportunities();
  }

  async function handleDelete() {
    if (!deletingOpportunity) {
      return;
    }

    const response = await fetch(
      `/api/opportunities/${deletingOpportunity.id}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      throw new Error("Failed to delete opportunity");
    }

    setDeletingOpportunity(null);
    await loadOpportunities();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Job Tracking
          </h1>
          <p className="mt-1 text-slate-600">
            Track recruiter emails and calls for software developer roles.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search company, recruiter, or role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Contact Type</Label>
          <Select
            value={contactTypeFilter}
            onValueChange={setContactTypeFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {CONTACT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="hidden rounded-lg border border-slate-200 bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  className="font-medium"
                  onClick={() => toggleSort("contactDate")}
                >
                  Date
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="font-medium"
                  onClick={() => toggleSort("companyName")}
                >
                  Company
                </button>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Recruiter</TableHead>
              <TableHead>
                <button
                  type="button"
                  className="font-medium"
                  onClick={() => toggleSort("status")}
                >
                  Status
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  Loading opportunities...
                </TableCell>
              </TableRow>
            ) : sortedOpportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-slate-500">
                  No opportunities yet. Add your first recruiter email or call.
                </TableCell>
              </TableRow>
            ) : (
              sortedOpportunities.map((opportunity) => (
                <TableRow key={opportunity.id}>
                  <TableCell>
                    {format(new Date(opportunity.contactDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {CONTACT_TYPE_LABELS[opportunity.contactType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {opportunity.companyName}
                  </TableCell>
                  <TableCell>{opportunity.roleTitle ?? "—"}</TableCell>
                  <TableCell>
                    <div>{opportunity.recruiterName}</div>
                    {opportunity.recruiterEmail ? (
                      <div className="text-xs text-slate-500">
                        {opportunity.recruiterEmail}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={opportunity.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(opportunity)}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingOpportunity(opportunity)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4 md:hidden">
        {isLoading ? (
          <p className="text-center text-slate-500">Loading opportunities...</p>
        ) : sortedOpportunities.length === 0 ? (
          <p className="text-center text-slate-500">
            No opportunities yet. Add your first recruiter email or call.
          </p>
        ) : (
          sortedOpportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {opportunity.companyName}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {opportunity.roleTitle ?? "Role not specified"}
                  </p>
                </div>
                <StatusBadge status={opportunity.status} />
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>
                  {format(new Date(opportunity.contactDate), "MMM d, yyyy")} ·{" "}
                  {CONTACT_TYPE_LABELS[opportunity.contactType]}
                </p>
                <p>{opportunity.recruiterName}</p>
                {opportunity.recruiterEmail ? (
                  <p>{opportunity.recruiterEmail}</p>
                ) : null}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(opportunity)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeletingOpportunity(opportunity)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingOpportunity ? "Edit Opportunity" : "Add Opportunity"}
            </DialogTitle>
            <DialogDescription>
              Record a recruiter email or call with status and contact details.
            </DialogDescription>
          </DialogHeader>
          <OpportunityForm
            key={editingOpportunity?.id ?? "new"}
            initialValues={toFormValues(editingOpportunity)}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditingOpportunity(null);
            }}
            submitLabel={editingOpportunity ? "Update" : "Create"}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingOpportunity)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingOpportunity(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete opportunity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the entry for{" "}
              <strong>{deletingOpportunity?.companyName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

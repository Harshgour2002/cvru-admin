"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import EventForm from "./EventForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";

type EventRow = {
  id: number;
  title: string;
  subtitle?: string;
  venue: string;
  eventDate: string;
  eventTime: string;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
});

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export default function EventsPage() {
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editIdInput, setEditIdInput] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ content?: EventRow[]; totalPages?: number } | { data: { content?: EventRow[]; totalPages?: number } }>(
        "/api/v1/events/upcoming",
        { params: { page, size: 10 } },
      );
      const pageData = unwrap<{ content?: EventRow[]; totalPages?: number }>(response.data);
      setRows(pageData.content || []);
      setTotalPages(pageData.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, reloadKey]);

  function openCreate() {
    setActiveEventId(undefined);
  }

  function openEditByInput() {
    const id = Number(editIdInput);
    if (!id || Number.isNaN(id)) return;
    setActiveEventId(id);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await api.delete(`/api/v1/events/${deleteId}`);
    setDeleteId(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Event Management</h1>
            <p className="text-sm text-slate-500">Only login and events module enabled.</p>
          </div>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-end">
            <div className="min-w-52">
              <label className="mb-1 block text-xs font-medium text-slate-600">Edit by Event ID</label>
              <Input value={editIdInput} onChange={(e) => setEditIdInput(e.target.value)} type="number" placeholder="Enter event ID" />
            </div>
            <Button type="button" className="bg-slate-700 hover:bg-slate-600" onClick={openEditByInput}>Load Event</Button>
            <Button type="button" onClick={openCreate}>New Event</Button>
          </div>
        </div>
      </Card>

      <EventForm eventId={activeEventId} onSaved={() => setReloadKey((k) => k + 1)} />

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming Events</h2>
          {loading ? <span className="text-sm text-slate-500">Loading...</span> : null}
        </div>
        <DataTable
          rows={rows}
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "venue", header: "Venue", render: (r) => r.venue },
            { key: "date", header: "Date", render: (r) => `${r.eventDate} ${r.eventTime}` },
            {
              key: "actions",
              header: "Actions",
              render: (r) => (
                <div className="flex gap-2">
                  <Button className="bg-slate-600 hover:bg-slate-500" onClick={() => setActiveEventId(r.id)}>Edit</Button>
                  <Button className="bg-red-600 hover:bg-red-500" onClick={() => setDeleteId(r.id)}>Delete</Button>
                </div>
              ),
            },
          ]}
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button className="bg-slate-200 text-slate-900" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <Button className="bg-slate-200 text-slate-900" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Event"
        description="Are you sure you want to delete this event?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

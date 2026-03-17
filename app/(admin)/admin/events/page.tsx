"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import EventForm from "./EventForm";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/providers/toast-provider";

type EventRow = {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  image?: string | null;
  imageUrl?: string | null;
  brochureUrl?: string | null;
};

type PageData = {
  content?: EventRow[];
  totalPages?: number;
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
  const { pushToast } = useToast();
  const [tab, setTab] = useState<"upcoming" | "ongoing">("upcoming");
  const [page, setPage] = useState(0);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [activeEventId, setActiveEventId] = useState<number | undefined>(undefined);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);


  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<unknown>(`/api/v1/events/${tab}`, { params: { page, size: 10 } });
      const data = unwrap<PageData>(response.data);
      setEvents(data.content || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      pushToast(`Failed to load ${tab} events`, "error");
    } finally {
      setLoading(false);
    }
  }, [page, pushToast, tab]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function openCreate() {
    setDrawerMode("create");
    setActiveEventId(undefined);
    setDrawerOpen(true);
  }

  function openEdit(id: number) {
    setDrawerMode("edit");
    setActiveEventId(id);
    setDrawerOpen(true);
  }

  async function confirmDelete() {
    if (!deleteId) return;

    const snapshot = events;
    setDeleting(true);
    setEvents((prev) => prev.filter((e) => e.id !== deleteId));

    try {
      pushToast("Deleting event...");
      await api.delete(`/api/v1/events/${deleteId}`);
      pushToast("Event Deleted Successfully");
      setDeleteId(null);
    } catch {
      setEvents(snapshot);
      pushToast("Failed to delete event", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Event Dashboard</h1>
            <p className="text-sm text-slate-500">Smooth event management workflow with media controls.</p>
          </div>
          <div className="flex gap-2">
            <Button className={tab === "upcoming" ? "" : "bg-slate-700 hover:bg-slate-600"} onClick={() => { setTab("upcoming"); setPage(0); }}>
              Upcoming
            </Button>
            <Button className={tab === "ongoing" ? "" : "bg-slate-700 hover:bg-slate-600"} onClick={() => { setTab("ongoing"); setPage(0); }}>
              Ongoing
            </Button>
            <Button onClick={openCreate}>Create Event</Button>
          </div>
        </div>
      </Card>

      {loading ? <p className="text-sm text-slate-500">Loading events...</p> : null}

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold">{event.title}</h3>
              <p className="text-xs text-slate-500">{event.eventDate}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{event.description || "No description"}</p>
              <p className="mt-2 text-xs font-medium text-slate-500">{event.brochureUrl ? "📄 Brochure attached" : "No brochure"}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button className="bg-slate-700 hover:bg-slate-600" onClick={() => openEdit(event.id)}>Edit</Button>
              <Button className="bg-red-600 hover:bg-red-500" onClick={() => setDeleteId(event.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      {!events.length && !loading ? <Card><p className="text-sm text-slate-500">No events found.</p></Card> : null}

      <div className="flex justify-end gap-2">
        <Button className="bg-slate-200 text-slate-900" disabled={page <= 0 || loading} onClick={() => setPage((p) => p - 1)}>Prev</Button>
        <Button className="bg-slate-200 text-slate-900" disabled={loading || page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>

      <EventForm
        open={drawerOpen}
        mode={drawerMode}
        eventId={activeEventId}
        onClose={() => setDrawerOpen(false)}
        onSaved={loadEvents}
        pushToast={pushToast}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Event"
        description="Are you sure you want to delete this event?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

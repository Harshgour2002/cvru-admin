"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EventForm from "./EventForm";

export default function EventsPage() {
  const [editIdInput, setEditIdInput] = useState("");
  const [activeEventId, setActiveEventId] = useState<number | undefined>(undefined);
  const [formKey, setFormKey] = useState(0);

  function openCreate() {
    setActiveEventId(undefined);
    setFormKey((k) => k + 1);
  }

  function openEdit() {
    const id = Number(editIdInput);
    if (!id || Number.isNaN(id)) return;
    setActiveEventId(id);
    setFormKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Management</h1>
          <p className="text-sm text-slate-500">Create events, update details, upload image/brochure, and remove media.</p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-end">
          <div className="min-w-52">
            <label className="mb-1 block text-xs font-medium text-slate-600">Edit Existing Event ID</label>
            <Input value={editIdInput} onChange={(e) => setEditIdInput(e.target.value)} type="number" placeholder="Enter event ID" />
          </div>
          <Button type="button" className="bg-slate-700 hover:bg-slate-600" onClick={openEdit}>
            Load Event
          </Button>
          <Button type="button" onClick={openCreate}>
            New Event
          </Button>
        </div>
      </div>

      <EventForm key={formKey} eventId={activeEventId} onSaved={(id) => setActiveEventId(id)} />
    </div>
  );
}

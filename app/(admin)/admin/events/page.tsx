"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateEvent, useDeleteEvent, useEvents, useUpdateEvent } from "@/features/events/api";
import { getApiErrorMessage } from "@/lib/api/client";
import { EventItem } from "@/types/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/providers/toast-provider";
import { Card } from "@/components/ui/card";

const schema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  image: z.string().url(),
  venue: z.string().min(1),
  eventDate: z.string().min(1),
  eventTime: z.string().min(1),
  organisingDepartment: z.string().min(1),
  brochureUrl: z.string().url(),
});

type EventFormValues = z.infer<typeof schema>;

export default function EventsPage() {
  const { pushToast } = useToast();
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError } = useEvents(page);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      image: "",
      venue: "",
      eventDate: "",
      eventTime: "",
      organisingDepartment: "",
      brochureUrl: "",
    },
  });

  function openCreate() {
    setEditing(null);
    reset();
    setShowForm(true);
  }

  function openEdit(item: EventItem) {
    setEditing(item);
    reset(item);
    setShowForm(true);
  }

  async function submit(values: EventFormValues) {
    try {
      if (editing?.id) {
        await updateEvent.mutateAsync({ id: editing.id, payload: values });
        pushToast("Event updated");
      } else {
        await createEvent.mutateAsync(values);
        pushToast("Event created");
      }
      setShowForm(false);
      reset();
    } catch (e) {
      pushToast(getApiErrorMessage(e), "error");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await deleteEvent.mutateAsync(deleteId);
      pushToast("Event deleted");
      setDeleteId(null);
    } catch (e) {
      pushToast(getApiErrorMessage(e), "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button onClick={openCreate}>Create Event</Button>
      </div>
      {isLoading ? <p>Loading events...</p> : null}
      {isError ? <p className="text-red-600">Failed to load events.</p> : null}
      {data ? (
        <>
          <DataTable
            rows={data.content}
            columns={[
              { key: "title", header: "Title", render: (row) => row.title },
              { key: "date", header: "Date", render: (row) => `${row.eventDate} ${row.eventTime}` },
              { key: "venue", header: "Venue", render: (row) => row.venue },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex gap-2">
                    <Button className="bg-slate-600 hover:bg-slate-500" onClick={() => openEdit(row)}>
                      Edit
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-500" onClick={() => setDeleteId(row.id || null)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
          />
          <div className="flex items-center justify-end gap-2">
            <Button className="bg-slate-200 text-slate-900 hover:bg-slate-300" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              className="bg-slate-200 text-slate-900 hover:bg-slate-300"
              disabled={(data.totalPages ?? 0) <= page + 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}

      {showForm ? (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">{editing ? "Edit Event" : "Create Event"}</h2>
          <form onSubmit={handleSubmit(submit)} className="grid gap-3 md:grid-cols-2">
            <FormField label="Title" error={errors.title?.message}><Input {...register("title")} /></FormField>
            <FormField label="Subtitle" error={errors.subtitle?.message}><Input {...register("subtitle")} /></FormField>
            <FormField label="Venue" error={errors.venue?.message}><Input {...register("venue")} /></FormField>
            <FormField label="Organising Department" error={errors.organisingDepartment?.message}><Input {...register("organisingDepartment")} /></FormField>
            <FormField label="Image URL" error={errors.image?.message}><Input {...register("image")} /></FormField>
            <FormField label="Brochure URL" error={errors.brochureUrl?.message}><Input {...register("brochureUrl")} /></FormField>
            <FormField label="Event Date" error={errors.eventDate?.message}><Input type="date" {...register("eventDate")} /></FormField>
            <FormField label="Event Time" error={errors.eventTime?.message}><Input type="time" {...register("eventTime")} /></FormField>
            <div className="md:col-span-2">
              <FormField label="Description" error={errors.description?.message}><Textarea rows={4} {...register("description")} /></FormField>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" className="bg-slate-200 text-slate-900 hover:bg-slate-300" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Event"
        description="Are you sure you want to delete this event?"
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        loading={deleteEvent.isPending}
      />
    </div>
  );
}

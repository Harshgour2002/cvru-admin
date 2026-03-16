"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type EventPayload = {
  title: string;
  subtitle: string;
  description: string;
  venue: string;
  organisingDepartment: string;
  eventDate: string;
  eventTime: string;
};

type EventDetails = EventPayload & {
  id: number;
  image?: string | null;
  imageUrl?: string | null;
  brochureUrl?: string | null;
};

type EventFormProps = {
  open: boolean;
  mode: "create" | "edit";
  eventId?: number;
  onClose: () => void;
  onSaved: () => void;
  pushToast: (message: string, type?: "success" | "error") => void;
};

const initialState: EventPayload = {
  title: "",
  subtitle: "",
  description: "",
  venue: "",
  organisingDepartment: "",
  eventDate: "",
  eventTime: "",
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

export default function EventForm({ open, mode, eventId, onClose, onSaved, pushToast }: EventFormProps) {
  const isEditMode = mode === "edit";
  const [form, setForm] = useState<EventPayload>(initialState);
  const [currentId, setCurrentId] = useState<number | null>(eventId ?? null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [removingBrochure, setRemovingBrochure] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imagePreview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return existingImageUrl;
  }, [imageFile, existingImageUrl]);

  useEffect(() => {
    return () => {
      if (imageFile && imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imageFile, imagePreview]);

  useEffect(() => {
    if (!open) return;

    setError(null);
    setBrochureFile(null);
    setImageFile(null);

    if (!isEditMode || !eventId) {
      setForm(initialState);
      setCurrentId(null);
      setExistingImageUrl(null);
      setExistingBrochureUrl(null);
      return;
    }

    let active = true;
    setFetching(true);
    api
      .get<unknown>(`/api/v1/events/upcoming/${eventId}`)
      .then((res) => {
        if (!active) return;
        const data = unwrap<EventDetails>(res.data);
        setCurrentId(data.id || eventId);
        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          description: data.description || "",
          venue: data.venue || "",
          organisingDepartment: data.organisingDepartment || "",
          eventDate: data.eventDate || "",
          eventTime: data.eventTime || "",
        });
        setExistingImageUrl(data.imageUrl || data.image || null);
        setExistingBrochureUrl(data.brochureUrl || null);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load event details.");
        pushToast("Failed to load event details", "error");
      })
      .finally(() => {
        if (active) setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [open, isEditMode, eventId, pushToast]);

  function setField<K extends keyof EventPayload>(key: K, value: EventPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(id: number) {
    if (!imageFile) return;
    const fd = new FormData();
    fd.append("image", imageFile);
    pushToast("Uploading image...");
    await api.post(`/api/v1/events/${id}/image`, fd);
    pushToast("Image Updated Successfully");
  }

  async function uploadBrochure(id: number) {
    if (!brochureFile) return;
    const fd = new FormData();
    fd.append("brochure", brochureFile);
    pushToast("Uploading brochure...");
    await api.post(`/api/v1/events/${id}/brochure`, fd);
    pushToast("PDF Uploaded Successfully");
  }

  async function onSave() {
    if (!form.title.trim() || !form.description.trim() || !form.eventDate) {
      const msg = "Title, description and event date are required.";
      setError(msg);
      pushToast(msg, "error");
      return;
    }

    if (!isEditMode && !imageFile) {
      const msg = "Image is required while creating an event.";
      setError(msg);
      pushToast(msg, "error");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let id = currentId;

      if (!id) {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("subtitle", form.subtitle);
        fd.append("description", form.description);
        fd.append("venue", form.venue);
        fd.append("organisingDepartment", form.organisingDepartment);
        fd.append("eventDate", form.eventDate);
        fd.append("eventTime", form.eventTime);
        if (imageFile) fd.append("image", imageFile);
        if (brochureFile) fd.append("brochure", brochureFile);

        pushToast("Saving event...");
        const created = await api.post<unknown>("/api/v1/events", fd);
        const payload = unwrap<EventDetails>(created.data);
        id = payload.id;
        setCurrentId(id);
        pushToast("Event Created Successfully");
      } else {
        pushToast("Saving event...");
        await api.put(`/api/v1/events/${id}`, form);

        if (imageFile) await uploadImage(id);
        if (brochureFile) await uploadBrochure(id);

        pushToast("Event Updated Successfully");
      }

      setImageFile(null);
      setBrochureFile(null);
      onSaved();
      onClose();
    } catch (e) {
      const message = (e as { message?: string; error?: string }).message || "Failed to save event.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeImage() {
    if (!currentId) return;
    setRemovingImage(true);
    try {
      await api.delete(`/api/v1/events/${currentId}/image`);
      setExistingImageUrl(null);
      setImageFile(null);
      pushToast("Image Updated Successfully");
    } catch {
      pushToast("Failed to remove image", "error");
    } finally {
      setRemovingImage(false);
    }
  }

  async function removeBrochure() {
    if (!currentId) return;
    setRemovingBrochure(true);
    try {
      await api.delete(`/api/v1/events/${currentId}/brochure`);
      setExistingBrochureUrl(null);
      setBrochureFile(null);
      pushToast("PDF Deleted Successfully");
    } catch {
      pushToast("Failed to remove brochure", "error");
    } finally {
      setRemovingBrochure(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditMode ? "Edit Event" : "Create Event"}</h2>
          <Button type="button" className="bg-slate-200 text-slate-900" onClick={onClose}>Close</Button>
        </div>

        {fetching ? <p className="mb-4 text-sm text-slate-500">Loading event details...</p> : null}

        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Title"><Input value={form.title} onChange={(e) => setField("title", e.target.value)} /></FormField>
            <FormField label="Subtitle"><Input value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} /></FormField>
            <FormField label="Venue"><Input value={form.venue} onChange={(e) => setField("venue", e.target.value)} /></FormField>
            <FormField label="Organising Department"><Input value={form.organisingDepartment} onChange={(e) => setField("organisingDepartment", e.target.value)} /></FormField>
            <FormField label="Event Date"><Input type="date" value={form.eventDate} onChange={(e) => setField("eventDate", e.target.value)} /></FormField>
            <FormField label="Event Time"><Input type="time" value={form.eventTime} onChange={(e) => setField("eventTime", e.target.value)} /></FormField>
            <div className="md:col-span-2"><FormField label="Description"><Textarea rows={4} value={form.description} onChange={(e) => setField("description", e.target.value)} /></FormField></div>

            <div className="md:col-span-2 rounded-lg border border-slate-200 p-4">
              <p className="mb-2 text-sm font-medium">Image Upload</p>
              <label className="flex min-h-[140px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 hover:bg-slate-100">
                Drag & drop image or click to select
                <input className="hidden" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>
              {imagePreview ? (
                <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                  <Image src={imagePreview} alt="Event image preview" width={1200} height={500} unoptimized className="h-56 w-full object-cover" />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <label className="cursor-pointer rounded-md bg-slate-900/85 px-3 py-1 text-xs text-white">
                      Replace
                      <input className="hidden" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    </label>
                    <Button type="button" className="bg-red-600 px-3 py-1 text-xs hover:bg-red-500" onClick={removeImage} disabled={removingImage || (!currentId && !imageFile)}>
                      {removingImage ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2 rounded-lg border border-slate-200 p-4">
              <p className="mb-2 text-sm font-medium">PDF Brochure</p>
              {!existingBrochureUrl && !brochureFile ? (
                <label className="inline-flex cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
                  Upload PDF
                  <input className="hidden" type="file" accept="application/pdf" onChange={(e) => setBrochureFile(e.target.files?.[0] || null)} />
                </label>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span>📄</span>
                    <span className="font-medium">{brochureFile?.name || "Current brochure"}</span>
                    {existingBrochureUrl ? <a href={existingBrochureUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">View PDF</a> : null}
                    <label className="cursor-pointer rounded-md bg-slate-700 px-2 py-1 text-xs text-white">
                      Replace
                      <input className="hidden" type="file" accept="application/pdf" onChange={(e) => setBrochureFile(e.target.files?.[0] || null)} />
                    </label>
                    <Button type="button" className="bg-red-600 px-2 py-1 text-xs hover:bg-red-500" onClick={removeBrochure} disabled={removingBrochure || (!currentId && !brochureFile)}>
                      {removingBrochure ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={onSave} disabled={saving || fetching || removingImage || removingBrochure}>
              {saving ? "Saving event..." : "Save Event"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

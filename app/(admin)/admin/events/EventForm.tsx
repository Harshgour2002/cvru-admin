"use client";

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
  eventId?: number;
  onSaved?: (id: number) => void;
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

export default function EventForm({ eventId, onSaved }: EventFormProps) {
  const isEditMode = typeof eventId === "number";
  const [form, setForm] = useState<EventPayload>(initialState);
  const [currentId, setCurrentId] = useState<number | null>(eventId ?? null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingBrochureUrl, setExistingBrochureUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [removingBrochure, setRemovingBrochure] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const imagePreview = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }
    return existingImageUrl;
  }, [imageFile, existingImageUrl]);

  useEffect(() => {
    return () => {
      if (imagePreview && imageFile) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview, imageFile]);

  useEffect(() => {
    if (!isEditMode || !eventId) {
      setForm(initialState);
      setCurrentId(null);
      setExistingImageUrl(null);
      setExistingBrochureUrl(null);
      setImageFile(null);
      setBrochureFile(null);
      setError(null);
      setSuccess(null);
      return;
    }

    let active = true;
    setFetching(true);
    setError(null);

    api
      .get<EventDetails>(`/api/v1/events/upcoming/${eventId}`)
      .then((res) => {
        if (!active) return;
        const data = res.data;
        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          description: data.description || "",
          venue: data.venue || "",
          organisingDepartment: data.organisingDepartment || "",
          eventDate: data.eventDate || "",
          eventTime: data.eventTime || "",
        });
        setCurrentId(data.id || eventId);
        setExistingImageUrl(data.imageUrl || data.image || null);
        setExistingBrochureUrl(data.brochureUrl || null);
      })
      .catch(() => {
        if (active) setError("Failed to load event details.");
      })
      .finally(() => {
        if (active) setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [eventId, isEditMode]);

  function setField<K extends keyof EventPayload>(key: K, value: EventPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(id: number) {
    if (!imageFile) return;
    const fd = new FormData();
    fd.append("image", imageFile);
    await api.post(`/api/v1/events/${id}/image`, fd);
    setImageFile(null);
  }

  async function uploadBrochure(id: number) {
    if (!brochureFile) return;
    const fd = new FormData();
    fd.append("brochure", brochureFile);
    await api.post(`/api/v1/events/${id}/brochure`, fd);
    setBrochureFile(null);
  }

  async function onSave() {
    setLoading(true);
    setError(null);
    setSuccess(null);

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
        if (brochureFile) fd.append("brochure", brochureFile);
        if (imageFile) fd.append("image", imageFile);

        const created = await api.post<{ data?: EventDetails } | EventDetails>("/api/v1/events", fd);
        const payload = (created.data as { data?: EventDetails }).data || (created.data as EventDetails);
        id = payload.id;
        setCurrentId(id);
        setImageFile(null);
        setBrochureFile(null);
      } else {
        await api.put(`/api/v1/events/${id}`, form);
      }

      if (!id) {
        throw new Error("Event ID missing after save.");
      }

      if (currentId && imageFile) await uploadImage(id);
      if (currentId && brochureFile) await uploadBrochure(id);

      if (isEditMode) {
        const refreshed = await api.get<EventDetails>(`/api/v1/events/upcoming/${id}`);
        setExistingImageUrl(refreshed.data.imageUrl || refreshed.data.image || null);
        setExistingBrochureUrl(refreshed.data.brochureUrl || null);
      }

      setSuccess(`Event ${isEditMode ? "updated" : "created"} successfully.`);
      onSaved?.(id);
    } catch (e) {
      const msg =
        (e as { message?: string; error?: string }).message ||
        (e as { message?: string; error?: string }).error ||
        "Failed to save event.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function removeImage() {
    if (!currentId) return;
    setRemovingImage(true);
    setError(null);
    try {
      await api.delete(`/api/v1/events/${currentId}/image`);
      setExistingImageUrl(null);
      setImageFile(null);
      setSuccess("Image removed.");
    } catch {
      setError("Failed to remove image.");
    } finally {
      setRemovingImage(false);
    }
  }

  async function removeBrochure() {
    if (!currentId) return;
    setRemovingBrochure(true);
    setError(null);
    try {
      await api.delete(`/api/v1/events/${currentId}/brochure`);
      setExistingBrochureUrl(null);
      setBrochureFile(null);
      setSuccess("Brochure removed.");
    } catch {
      setError("Failed to remove brochure.");
    } finally {
      setRemovingBrochure(false);
    }
  }

  if (fetching) {
    return <Card><p className="text-sm text-slate-500">Loading event...</p></Card>;
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{isEditMode ? "Edit Event" : "Create Event"}</h2>
        <span className="text-xs text-slate-500">{isEditMode ? `Event #${currentId ?? eventId}` : "New"}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Title">
          <Input value={form.title} onChange={(e) => setField("title", e.target.value)} />
        </FormField>
        <FormField label="Subtitle">
          <Input value={form.subtitle} onChange={(e) => setField("subtitle", e.target.value)} />
        </FormField>
        <FormField label="Venue">
          <Input value={form.venue} onChange={(e) => setField("venue", e.target.value)} />
        </FormField>
        <FormField label="Organising Department">
          <Input value={form.organisingDepartment} onChange={(e) => setField("organisingDepartment", e.target.value)} />
        </FormField>
        <FormField label="Event Date">
          <Input type="date" value={form.eventDate} onChange={(e) => setField("eventDate", e.target.value)} />
        </FormField>
        <FormField label="Event Time">
          <Input type="time" value={form.eventTime} onChange={(e) => setField("eventTime", e.target.value)} />
        </FormField>
        <div className="md:col-span-2">
          <FormField label="Description">
            <Textarea rows={5} value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </FormField>
        </div>

        <div className="md:col-span-1">
          <p className="mb-1 text-sm font-medium text-slate-700">Image Upload</p>
          <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 hover:bg-slate-100">
            <span>Drag & drop image here or click to select</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Event preview" className="mt-2 h-36 w-full rounded-md object-cover" />
          ) : null}
          {currentId && (existingImageUrl || imageFile) ? (
            <Button type="button" className="mt-2 bg-red-600 hover:bg-red-500" onClick={removeImage} disabled={removingImage}>
              {removingImage ? "Removing..." : "Remove Image"}
            </Button>
          ) : null}
        </div>

        <div className="md:col-span-1">
          <p className="mb-1 text-sm font-medium text-slate-700">Brochure Upload (PDF)</p>
          <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 hover:bg-slate-100">
            <span>Drag & drop brochure PDF or click to select</span>
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setBrochureFile(e.target.files?.[0] || null)} />
          </label>
          {brochureFile ? <p className="mt-2 text-sm text-slate-700">Selected: {brochureFile.name}</p> : null}
          {existingBrochureUrl ? (
            <a className="mt-2 block text-sm font-medium text-blue-600 underline" href={existingBrochureUrl} target="_blank" rel="noreferrer">
              Download current brochure
            </a>
          ) : null}
          {currentId && (existingBrochureUrl || brochureFile) ? (
            <Button type="button" className="mt-2 bg-red-600 hover:bg-red-500" onClick={removeBrochure} disabled={removingBrochure}>
              {removingBrochure ? "Removing..." : "Remove Brochure"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={onSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
}

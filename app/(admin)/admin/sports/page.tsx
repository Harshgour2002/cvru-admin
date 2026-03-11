"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSports, useCreateSport, useDeleteSport, useUpdateSport } from "@/features/sports/api";
import { SportItem } from "@/types/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({ title: z.string().min(1), overView: z.string().min(1), imageUrl: z.string().url(), achievementsText: z.string().default("[]") });
type FormValues = z.infer<typeof schema>;

export default function SportsPage() {
  const { pushToast } = useToast();
  const { data } = useSports();
  const createItem = useCreateSport();
  const updateItem = useUpdateSport();
  const deleteItem = useDeleteSport();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SportItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function openCreate() { setEditing(null); reset({ achievementsText: "[]" }); setShowForm(true); }
  function openEdit(item: SportItem) { setEditing(item); reset({ ...item, achievementsText: JSON.stringify(item.achievements ?? [], null, 2) }); setShowForm(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Sports</h1><Button onClick={openCreate}>Create Sport</Button></div>
      <DataTable rows={data?.content ?? []} columns={[{ key: "title", header: "Title", render: (r) => r.title }, { key: "overview", header: "Overview", render: (r) => r.overView.slice(0, 70) }, { key: "actions", header: "Actions", render: (r) => <div className="flex gap-2"><Button className="bg-slate-600 hover:bg-slate-500" onClick={() => openEdit(r)}>Edit</Button><Button className="bg-red-600 hover:bg-red-500" onClick={() => setDeleteId(r.id || null)}>Delete</Button></div> }]} />
      {showForm ? <Card><form onSubmit={handleSubmit(async (values) => { try { const payload: SportItem = { title: values.title, overView: values.overView, imageUrl: values.imageUrl, achievements: JSON.parse(values.achievementsText) }; if (editing?.id) await updateItem.mutateAsync({ id: editing.id, payload }); else await createItem.mutateAsync(payload); pushToast("Sport saved"); setShowForm(false); } catch (e) { pushToast(getApiErrorMessage(e), "error"); } })} className="grid gap-3"><FormField label="Title" error={errors.title?.message}><Input {...register("title")} /></FormField><FormField label="Image URL" error={errors.imageUrl?.message}><Input {...register("imageUrl")} /></FormField><FormField label="Overview" error={errors.overView?.message}><Textarea rows={4} {...register("overView")} /></FormField><FormField label="Achievements (JSON array)" error={errors.achievementsText?.message}><Textarea rows={8} {...register("achievementsText")} /></FormField><div className="flex justify-end gap-2"><Button type="button" className="bg-slate-200 text-slate-900" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Save</Button></div></form></Card> : null}
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Sport" description="Delete this sport entry?" onCancel={() => setDeleteId(null)} onConfirm={async () => { if (!deleteId) return; await deleteItem.mutateAsync(deleteId); setDeleteId(null); pushToast("Sport deleted"); }} />
    </div>
  );
}

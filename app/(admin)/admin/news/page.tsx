"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateNews, useDeleteNews, useNews, useUpdateNews } from "@/features/news/api";
import { NewsItem } from "@/types/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  thumbNail: z.string().url(),
  publisher: z.string().min(1),
  imagesText: z.string().default("[]"),
});

type FormValues = z.infer<typeof schema>;

export default function NewsPage() {
  const { pushToast } = useToast();
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { data } = useNews(page);
  const createItem = useCreateNews();
  const updateItem = useUpdateNews();
  const deleteItem = useDeleteNews();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function openCreate() { setEditing(null); reset({ imagesText: "[]" }); setShowForm(true); }
  function openEdit(item: NewsItem) {
    setEditing(item);
    reset({ ...item, imagesText: JSON.stringify(item.images ?? [], null, 2) });
    setShowForm(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      const payload: NewsItem = { ...values, images: JSON.parse(values.imagesText) };
      if (editing?.id) await updateItem.mutateAsync({ id: editing.id, payload }); else await createItem.mutateAsync(payload);
      pushToast("News saved");
      setShowForm(false);
    } catch (e) { pushToast(getApiErrorMessage(e), "error"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Latest News</h1><Button onClick={openCreate}>Create News</Button></div>
      <DataTable rows={data?.content ?? []} columns={[
        { key: "title", header: "Title", render: (r) => r.title },
        { key: "publisher", header: "Publisher", render: (r) => r.publisher },
        { key: "actions", header: "Actions", render: (r) => <div className="flex gap-2"><Button className="bg-slate-600 hover:bg-slate-500" onClick={() => openEdit(r)}>Edit</Button><Button className="bg-red-600 hover:bg-red-500" onClick={() => setDeleteId(r.id || null)}>Delete</Button></div> },
      ]} />
      <div className="flex justify-end gap-2"><Button className="bg-slate-200 text-slate-900" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>Prev</Button><Button className="bg-slate-200 text-slate-900" onClick={() => setPage((p) => p + 1)}>Next</Button></div>
      {showForm ? <Card><form onSubmit={handleSubmit(onSubmit)} className="grid gap-3"><FormField label="Title" error={errors.title?.message}><Input {...register("title")} /></FormField><FormField label="Publisher" error={errors.publisher?.message}><Input {...register("publisher")} /></FormField><FormField label="Thumbnail URL" error={errors.thumbNail?.message}><Input {...register("thumbNail")} /></FormField><FormField label="Description" error={errors.description?.message}><Textarea {...register("description")} /></FormField><FormField label="Images (JSON array)" error={errors.imagesText?.message}><Textarea rows={4} {...register("imagesText")} /></FormField><div className="flex justify-end gap-2"><Button type="button" className="bg-slate-200 text-slate-900" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Save</Button></div></form></Card> : null}
      <ConfirmDialog open={Boolean(deleteId)} title="Delete News" description="Delete this news entry?" onCancel={() => setDeleteId(null)} onConfirm={async () => { if (!deleteId) return; await deleteItem.mutateAsync(deleteId); setDeleteId(null); pushToast("News deleted"); }} />
    </div>
  );
}

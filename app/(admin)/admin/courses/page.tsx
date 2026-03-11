"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCourses, useCreateCourse, useDeleteCourse, useUpdateCourse } from "@/features/courses/api";
import { CourseItem } from "@/types/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";

const schema = z.object({
  payload: z.string().min(2),
});

type FormValues = z.infer<typeof schema>;

const template: CourseItem = {
  code: "CSE-001",
  title: "B.Tech CSE",
  overview: "",
  durationYears: 4,
  totalSemesters: 8,
  level: "UG",
  mode: "FULL_TIME",
  yearlyFee: 120000,
  department: "CSE",
  highlights: [{ title: "", description: "" }],
  semesters: [{ semesterNumber: 1, subjects: [{ subjectCode: "MA101", subjectName: "Maths", credits: 4 }] }],
  careerOpportunities: [{ roleName: "Software Engineer" }],
  eligibility: [{ requirement: "10+2 PCM" }],
};

export default function CoursesPage() {
  const { pushToast } = useToast();
  const { data } = useCourses();
  const createItem = useCreateCourse();
  const updateItem = useUpdateCourse();
  const deleteItem = useDeleteCourse();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CourseItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function openCreate() { setEditing(null); reset({ payload: JSON.stringify(template, null, 2) }); setShowForm(true); }
  function openEdit(item: CourseItem) { setEditing(item); reset({ payload: JSON.stringify(item, null, 2) }); setShowForm(true); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Courses</h1><Button onClick={openCreate}>Create Course</Button></div>
      <DataTable rows={data?.content ?? []} columns={[{ key: "code", header: "Code", render: (r) => r.code }, { key: "title", header: "Title", render: (r) => r.title }, { key: "department", header: "Department", render: (r) => r.department }, { key: "actions", header: "Actions", render: (r) => <div className="flex gap-2"><Button className="bg-slate-600 hover:bg-slate-500" onClick={() => openEdit(r)}>Edit</Button><Button className="bg-red-600 hover:bg-red-500" onClick={() => setDeleteId(r.id || null)}>Delete</Button></div> }]} />
      {showForm ? <Card><form onSubmit={handleSubmit(async (values) => { try { const payload = JSON.parse(values.payload) as CourseItem; if (editing?.id) await updateItem.mutateAsync({ id: editing.id, payload }); else await createItem.mutateAsync(payload); pushToast("Course saved"); setShowForm(false); } catch (e) { pushToast(getApiErrorMessage(e), "error"); } })} className="space-y-3"><FormField label="Course Payload (JSON)" error={errors.payload?.message}><Textarea rows={16} {...register("payload")} /></FormField><div className="flex justify-end gap-2"><Button type="button" className="bg-slate-200 text-slate-900" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit">Save</Button></div></form></Card> : null}
      <ConfirmDialog open={Boolean(deleteId)} title="Delete Course" description="Delete this course?" onCancel={() => setDeleteId(null)} onConfirm={async () => { if (!deleteId) return; await deleteItem.mutateAsync(deleteId); setDeleteId(null); pushToast("Course deleted"); }} />
    </div>
  );
}

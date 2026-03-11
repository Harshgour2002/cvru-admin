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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/client";
import { getEntityId } from "@/lib/api/entity-id";

const schema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  overview: z.string().min(1),
  durationYears: z.coerce.number().min(1),
  totalSemesters: z.coerce.number().min(1),
  level: z.string().min(1),
  mode: z.string().min(1),
  yearlyFee: z.coerce.number().min(0),
  department: z.string().min(1),
  highlightsText: z.string().optional(),
  semesterSubjectsText: z.string().optional(),
  careerText: z.string().optional(),
  eligibilityText: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function parseHighlights(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, description] = line.split("|").map((part) => part.trim());
      return { title: title || "", description: description || "" };
    });
}

function parseSemesters(input: string) {
  const map = new Map<number, { semesterNumber: number; subjects: { subjectCode: string; subjectName: string; credits: number }[] }>();

  input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [semesterRaw, code, name, creditsRaw] = line.split("|").map((part) => part.trim());
      const semesterNumber = Number(semesterRaw || 1);
      const credits = Number(creditsRaw || 0);
      if (!map.has(semesterNumber)) {
        map.set(semesterNumber, { semesterNumber, subjects: [] });
      }
      map.get(semesterNumber)?.subjects.push({
        subjectCode: code || "",
        subjectName: name || "",
        credits,
      });
    });

  return [...map.values()].sort((a, b) => a.semesterNumber - b.semesterNumber);
}

function parseSimpleList(input: string, key: "roleName" | "requirement") {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ [key]: line }));
}

function toFormDefaults(course?: CourseItem): Partial<FormValues> {
  if (!course) {
    return {
      code: "",
      title: "",
      overview: "",
      durationYears: 4,
      totalSemesters: 8,
      level: "UG",
      mode: "FULL_TIME",
      yearlyFee: 0,
      department: "",
      highlightsText: "",
      semesterSubjectsText: "",
      careerText: "",
      eligibilityText: "",
    };
  }

  return {
    code: course.code,
    title: course.title,
    overview: course.overview,
    durationYears: course.durationYears,
    totalSemesters: course.totalSemesters,
    level: course.level,
    mode: course.mode,
    yearlyFee: course.yearlyFee,
    department: course.department,
    highlightsText: course.highlights.map((h) => `${h.title}|${h.description}`).join("\n"),
    semesterSubjectsText: course.semesters
      .flatMap((s) => s.subjects.map((sub) => `${s.semesterNumber}|${sub.subjectCode}|${sub.subjectName}|${sub.credits}`))
      .join("\n"),
    careerText: course.careerOpportunities.map((c) => c.roleName).join("\n"),
    eligibilityText: course.eligibility.map((e) => e.requirement).join("\n"),
  };
}

export default function CoursesPage() {
  const { pushToast } = useToast();
  const { data } = useCourses();
  const createItem = useCreateCourse();
  const updateItem = useUpdateCourse();
  const deleteItem = useDeleteCourse();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CourseItem | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormDefaults(),
  });

  function openCreate() {
    setEditing(null);
    setEditingId(null);
    reset(toFormDefaults());
    setShowForm(true);
  }

  function openEdit(item: CourseItem) {
    setEditing(item);
    setEditingId(getEntityId(item));
    reset(toFormDefaults(item));
    setShowForm(true);
  }

  async function onSubmit(values: FormValues) {
    try {
      const payload: CourseItem = {
        code: values.code,
        title: values.title,
        overview: values.overview,
        durationYears: Number(values.durationYears),
        totalSemesters: Number(values.totalSemesters),
        level: values.level,
        mode: values.mode,
        yearlyFee: Number(values.yearlyFee),
        department: values.department,
        highlights: parseHighlights(values.highlightsText || ""),
        semesters: parseSemesters(values.semesterSubjectsText || ""),
        careerOpportunities: parseSimpleList(values.careerText || "", "roleName") as { roleName: string }[],
        eligibility: parseSimpleList(values.eligibilityText || "", "requirement") as { requirement: string }[],
      };

      if (editing && editingId) {
        await updateItem.mutateAsync({ id: editingId, payload });
        pushToast("Course updated");
      } else {
        await createItem.mutateAsync(payload);
        pushToast("Course created");
      }

      setShowForm(false);
      setEditing(null);
      setEditingId(null);
    } catch (e) {
      pushToast(getApiErrorMessage(e), "error");
    }
  }

  async function onConfirmDelete() {
    if (!deleteId) return;
    try {
      await deleteItem.mutateAsync(deleteId);
      setDeleteId(null);
      pushToast("Course deleted");
    } catch (e) {
      pushToast(getApiErrorMessage(e), "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Button onClick={openCreate}>Create Course</Button>
      </div>

      <DataTable
        rows={data?.content ?? []}
        columns={[
          { key: "code", header: "Code", render: (r) => r.code },
          { key: "title", header: "Title", render: (r) => r.title },
          { key: "department", header: "Department", render: (r) => r.department },
          {
            key: "actions",
            header: "Actions",
            render: (r) => {
              const rowId = getEntityId(r);
              return (
                <div className="flex gap-2">
                  <Button className="bg-slate-600 hover:bg-slate-500" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-500" onClick={() => setDeleteId(rowId)} disabled={!rowId}>
                    Delete
                  </Button>
                </div>
              );
            },
          },
        ]}
      />

      {showForm ? (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
            <FormField label="Course Code" error={errors.code?.message}><Input {...register("code")} /></FormField>
            <FormField label="Title" error={errors.title?.message}><Input {...register("title")} /></FormField>
            <FormField label="Duration (Years)" error={errors.durationYears?.message}><Input type="number" {...register("durationYears")} /></FormField>
            <FormField label="Total Semesters" error={errors.totalSemesters?.message}><Input type="number" {...register("totalSemesters")} /></FormField>
            <FormField label="Level" error={errors.level?.message}><Input {...register("level")} /></FormField>
            <FormField label="Mode" error={errors.mode?.message}><Input {...register("mode")} /></FormField>
            <FormField label="Yearly Fee" error={errors.yearlyFee?.message}><Input type="number" {...register("yearlyFee")} /></FormField>
            <FormField label="Department" error={errors.department?.message}><Input {...register("department")} /></FormField>

            <div className="md:col-span-2"><FormField label="Overview" error={errors.overview?.message}><Textarea rows={3} {...register("overview")} /></FormField></div>
            <div className="md:col-span-2"><FormField label="Highlights (one per line: title|description)"><Textarea rows={4} {...register("highlightsText")} /></FormField></div>
            <div className="md:col-span-2"><FormField label="Semester Subjects (one per line: semester|subjectCode|subjectName|credits)"><Textarea rows={5} {...register("semesterSubjectsText")} /></FormField></div>
            <div className="md:col-span-2"><FormField label="Career Opportunities (one role per line)"><Textarea rows={3} {...register("careerText")} /></FormField></div>
            <div className="md:col-span-2"><FormField label="Eligibility (one requirement per line)"><Textarea rows={3} {...register("eligibilityText")} /></FormField></div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" className="bg-slate-200 text-slate-900" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Card>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Course"
        description="Delete this course?"
        onCancel={() => setDeleteId(null)}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}

import { PropsWithChildren } from "react";

type FormFieldProps = PropsWithChildren<{
  label: string;
  error?: string;
}>;

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

"use client";

import { useState } from "react";

type UseFormOptions<T> = {
  defaultValues?: Partial<T>;
  resolver?: (values: T) => { values: T; errors: Record<string, { message: string }> };
};

export function useForm<T extends Record<string, unknown>>(options?: UseFormOptions<T>) {
  const [values, setValues] = useState<Partial<T>>(options?.defaultValues || {});
  const [errors, setErrors] = useState<Record<string, { message: string }>>({});
  const [isSubmitting, setSubmitting] = useState(false);

  function register(name: keyof T) {
    return {
      name,
      value: (values[name] as string | number | readonly string[] | undefined) ?? "",
      onChange: (e: { target: { value: unknown } }) => {
        setValues((prev) => ({ ...prev, [name]: e.target.value }));
      },
    };
  }

  function reset(next?: Partial<T>) {
    setValues(next || options?.defaultValues || {});
    setErrors({});
  }

  function handleSubmit(onValid: (vals: T) => void | Promise<void>) {
    return async (e?: { preventDefault: () => void }) => {
      e?.preventDefault();
      setSubmitting(true);
      try {
        if (options?.resolver) {
          const result = options.resolver(values as T);
          setErrors(result.errors || {});
          if (Object.keys(result.errors || {}).length) return;
          await onValid(result.values);
        } else {
          await onValid(values as T);
        }
      } finally {
        setSubmitting(false);
      }
    };
  }

  return { register, reset, handleSubmit, formState: { errors, isSubmitting } };
}

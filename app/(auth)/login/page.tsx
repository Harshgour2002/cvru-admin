"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient, getApiErrorMessage } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { setSession } from "@/lib/auth/session";
import { ApiEnvelope, AuthData, LoginRequest } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/lib/providers/toast-provider";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValue = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValue>({ resolver: zodResolver(schema) });

  async function onSubmit(values: LoginRequest) {
    setError(null);
    try {
      const response = await apiClient.post<ApiEnvelope<AuthData>>(endpoints.auth.login, values);
      setSession(response.data.data);
      pushToast("Logged in successfully");
      router.replace("/admin/events");
    } catch (e) {
      const message = getApiErrorMessage(e);
      setError(message);
      pushToast(message, "error");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card>
        <div className="w-[360px] space-y-4">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <FormField label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="admin@example.com" {...register("email")} />
            </FormField>
            <FormField label="Password" error={errors.password?.message}>
              <Input type="password" placeholder="******" {...register("password")} />
            </FormField>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
        </div>
      </Card>
    </main>
  );
}

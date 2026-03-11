"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";

type QueryClientValue = { version: number; bump: () => void };

const QueryContext = createContext<QueryClientValue | null>(null);

export class QueryClient {}

export function QueryClientProvider({ children }: PropsWithChildren<{ client: QueryClient }>) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo(() => ({ version, bump }), [version, bump]);
  return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
}

export function useQuery<T>({ queryFn, queryKey }: { queryFn: () => Promise<T>; queryKey: unknown[] }) {
  const ctx = useContext(QueryContext);
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setLoading] = useState(true);
  const [isError, setError] = useState(false);
  const key = JSON.stringify(queryKey);

  useEffect(() => {
    let mounted = true;
    queryFn()
      .then((res) => {
        if (mounted) {
          setData(res);
          setError(false);
        }
      })
      .catch(() => mounted && setError(true))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [ctx?.version, key, queryFn]);

  return { data, isLoading, isError };
}

export function useMutation<TData, TVariables>({ mutationFn, onSuccess }: { mutationFn: (payload: TVariables) => Promise<TData>; onSuccess?: () => void }) {
  const ctx = useContext(QueryContext);
  const [isPending, setPending] = useState(false);

  const mutateAsync = useCallback(
    async (payload: TVariables) => {
      setPending(true);
      try {
        const result = await mutationFn(payload);
        onSuccess?.();
        ctx?.bump();
        return result;
      } finally {
        setPending(false);
      }
    },
    [ctx, mutationFn, onSuccess],
  );

  return { mutateAsync, isPending };
}

export function useQueryClient() {
  const ctx = useContext(QueryContext);
  return {
    invalidateQueries: async (options?: unknown) => {
      void options;
      ctx?.bump();
    },
  };
}

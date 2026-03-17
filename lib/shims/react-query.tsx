"use client";

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type QueryClientValue = { version: number; bump: () => void };

const QueryContext = createContext<QueryClientValue | null>(null);
const queryCache = new Map<string, unknown>();

export class QueryClient {}

export function QueryClientProvider({ children }: PropsWithChildren<{ client: QueryClient }>) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo(() => ({ version, bump }), [version, bump]);
  return <QueryContext.Provider value={value}>{children}</QueryContext.Provider>;
}

export function useQuery<T>({ queryFn, queryKey }: { queryFn: () => Promise<T>; queryKey: unknown[] }) {
  const ctx = useContext(QueryContext);
  const key = JSON.stringify(queryKey);
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const cached = queryCache.get(key) as T | undefined;
  const [data, setData] = useState<T | undefined>(cached);
  const [isLoading, setLoading] = useState(!cached);
  const [isError, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    queryFnRef.current()
      .then((res) => {
        if (!mounted) return;
        queryCache.set(key, res);
        setData(res);
        setError(false);
      })
      .catch(() => {
        if (mounted) setError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [ctx?.version, key]);

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
        queryCache.clear();
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
      queryCache.clear();
      ctx?.bump();
    },
  };
}

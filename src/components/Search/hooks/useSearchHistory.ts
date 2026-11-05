// src/hooks/Search/useSearchHistory.ts
import { useEffect, useState, useCallback } from "react";
import { loadSearchHistory, upsertSearchHistory } from "@/components/Search/hooks/searchService";
import type { HistoryItem } from "@/components/Search/types/search";

const MAX_HISTORY = 5;
const ANON_KEY = "search_history_anonymous";

function isUuid(v?: string) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function useSearchHistory(userId?: string) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // If no userId or userId is not a UUID, load anonymous history from localStorage
    if (!userId || !isUuid(userId)) {
      try {
        const raw = localStorage.getItem(ANON_KEY);
        setHistory(raw ? (JSON.parse(raw) as HistoryItem[]) : []);
      } catch (err) {
        console.error("load anonymous search history failed:", err);
        setHistory([]);
      }
      return;
    }

    let mounted = true;

    const hasQuery = (obj: unknown): obj is { query: string } =>
      typeof obj === "object" && obj !== null && typeof (obj as Record<string, unknown>).query === "string";

    (async () => {
      try {
        // Debug: ensure we know what userId is when loading (optional)
        // console.debug("useSearchHistory: loading for userId:", userId);

        const data = await loadSearchHistory(userId as string);

        if (!mounted) return;

        // Normalize possible shapes:
        // - array directly
        // - { data: [...] } or { items: [...] } or { history: [...] }
        let arr: unknown[] | undefined;
        if (Array.isArray(data)) {
          arr = data;
        } else if (data && typeof data === "object") {
          const d = data as Record<string, unknown>;
          if (Array.isArray(d.data)) arr = d.data as unknown[];
          else if (Array.isArray(d.items)) arr = d.items as unknown[];
          else if (Array.isArray(d.history)) arr = d.history as unknown[];
        }

        if (!arr) {
          setHistory([]);
          return;
        }

        const next = arr.filter(hasQuery).map((h) => ({ query: h.query }));
        setHistory(next.slice(0, MAX_HISTORY));
      } catch (err) {
        console.error("loadSearchHistory error:", err);
        if (mounted) setHistory([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const saveHistory = useCallback(
    async (userIdParam: string | undefined, query: string): Promise<void> => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // optimistic update
      setHistory((prev) => {
        const next = [{ query: trimmed }, ...prev.filter((h) => h.query !== trimmed)];
        return next.slice(0, MAX_HISTORY);
      });

      try {
        // Treat non-UUID userIdParam as anonymous to avoid DB errors
        if (!userIdParam || !isUuid(userIdParam)) {
          const key = ANON_KEY;
          try {
            const raw = localStorage.getItem(key);
            const arr: HistoryItem[] = raw ? JSON.parse(raw) : [];
            const next = [{ query: trimmed }, ...arr.filter((h) => h.query !== trimmed)].slice(0, MAX_HISTORY);
            localStorage.setItem(key, JSON.stringify(next));
          } catch (err) {
            console.error("save anonymous history failed:", err);
          }
          return;
        }

        await upsertSearchHistory(userIdParam, trimmed);
      } catch (err) {
        console.error("saveHistory error:", err);
        // optional: rollback optimistic update or leave as-is
      }
    },
    // upsertSearchHistory is an imported function; including it in deps can cause lint noise.
     
    []
  );

  return { history, saveHistory };
}
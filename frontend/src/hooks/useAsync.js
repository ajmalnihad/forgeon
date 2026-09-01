import { useCallback, useEffect, useRef, useState } from "react";
import { toUserMessage } from "../services/api/client.js";

/**
 * Small data-fetching helper so every screen gets consistent
 * loading / error / empty handling without a heavy data library.
 */
export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (mounted.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(toUserMessage(err));
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: run, setData };
}

import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncDataState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  reload: () => void
}

/**
 * Runs an async fetcher and exposes `{ data, loading, error, reload }`.
 * Re-runs whenever a value in `deps` changes or `reload()` is called. The
 * fetcher is read from a ref so callers can pass inline closures without
 * re-triggering the effect on every render.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetcherRef
      .current()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err : new Error('Error desconocido'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { data, loading, error, reload }
}

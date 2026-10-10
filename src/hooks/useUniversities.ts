import { useEffect, useState } from 'react';
import { Realtime } from 'appwrite';
import { fetchAppwriteUniversities } from '@/data/appwriteUniversities';
import { appwriteClient } from '@/lib/appwrite';
import { catalogDatabase, universityCollection } from '@/lib/catalog';
import type { University } from '@/types/university';

export function useUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let queued = false;
    let snapshot = '';
    async function refresh() {
      if (cancelled) return;
      if (inFlight) { queued = true; return; }
      inFlight = true;
      try {
        const items = await fetchAppwriteUniversities();
        if (!cancelled) {
          const next = JSON.stringify(items);
          if (next !== snapshot) { snapshot = next; setUniversities(items); }
          setError(undefined);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught : new Error('Could not load universities.'));
      } finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
        if (queued && !cancelled) { queued = false; void refresh(); }
      }
    }
    const realtime = new Realtime(appwriteClient);
    const subscription = realtime.subscribe(`databases.${catalogDatabase}.collections.${universityCollection}.documents`, () => { void refresh(); });
    void subscription.then(sub => { if (cancelled) void sub.close(); else void refresh(); }).catch(() => { /* Polling remains available if realtime cannot connect. */ });
    void refresh();
    const visibleRefresh = () => { if (document.visibilityState === 'visible') void refresh(); };
    const timer = window.setInterval(visibleRefresh, 30000);
    window.addEventListener('focus', visibleRefresh);
    document.addEventListener('visibilitychange', visibleRefresh);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', visibleRefresh);
      document.removeEventListener('visibilitychange', visibleRefresh);
      void subscription.then(sub => sub.close()).catch(() => {});
    };
  }, []);
  return { universities, source: 'appwrite' as const, loading, error };
}

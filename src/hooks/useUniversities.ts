import { useEffect, useState } from "react";
import { fetchAppwriteUniversities } from "@/data/appwriteUniversities";
import type { University } from "@/types/university";

type UniversitySource = "appwrite";

export function useUniversities() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [source, setSource] = useState<UniversitySource>("appwrite");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let cancelled = false;

    fetchAppwriteUniversities()
      .then((items) => {
        if (cancelled || items.length === 0) return;
        setUniversities(items);
        setSource("appwrite");
        setError(undefined);
      })
      .catch((caught) => {
        if (cancelled) return;
        console.warn("Could not load university data from Appwrite.", caught);
        setError(caught instanceof Error ? caught : new Error("Could not load Appwrite universities."));
        setSource("appwrite");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { universities, source, loading, error };
}

import { useEffect, useState } from "react";
import { listCatalog } from "@/lib/catalog";
import type { Consultant } from "@/data/consultants";

export function useConsultants() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    listCatalog("consultants").then(rows => {
      if (active) setConsultants(rows.map(row => ({
        id: row.$id, name: String(row.name ?? ""), avatar: String(row.avatar ?? ""),
        rating: Number(row.rating ?? 0), badge: (row.badge ?? "Bronze Mentor") as Consultant["badge"],
        languages: (row.languages ?? []) as string[], specialties: (row.specialties ?? []) as string[],
        countryExpertise: (row.countryExpertise ?? []) as string[], price: String(row.price ?? ""), bio: String(row.bio ?? ""),
      })));
    }).catch(() => { if (active) setError("Could not load consultants. Please refresh to try again."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { consultants, loading, error };
}

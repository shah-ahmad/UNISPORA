import { createFileRoute } from "@tanstack/react-router";
import { AIAdvisorPanel } from "@/components/ai/AIAdvisorPanel";
import { AppShell } from "@/components/layout/AppShell";
import { useUniversities } from "@/hooks/useUniversities";

export const Route = createFileRoute("/ai-advisor")({
  validateSearch: (search: Record<string, unknown>) => ({
    university: typeof search.university === "string" ? search.university : undefined,
  }),
  component: AIAdvisor,
});

function AIAdvisor() {
  const { university: universityId } = Route.useSearch();
  const { universities, loading } = useUniversities();
  const university = universities.find((item) => item.id === universityId);

  return (
    <AppShell>
      <div className="page-container">
        <AIAdvisorPanel university={university} loading={loading} />
      </div>
    </AppShell>
  );
}

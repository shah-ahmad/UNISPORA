import { createFileRoute } from "@tanstack/react-router";
import { AIAdvisorPanel } from "@/components/ai/AIAdvisorPanel";
import { AppShell } from "@/components/layout/AppShell";
import { getUniversityById } from "@/data/universities";

export const Route = createFileRoute("/ai-advisor")({
  validateSearch: (search: Record<string, unknown>) => ({
    university: typeof search.university === "string" ? search.university : undefined,
  }),
  component: AIAdvisor,
});

function AIAdvisor() {
  const { university: universityId } = Route.useSearch();
  const university = getUniversityById(universityId);
  return (
    <AppShell>
      <div className="page-container">
        <AIAdvisorPanel university={university} />
      </div>
    </AppShell>
  );
}

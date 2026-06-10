import { createFileRoute } from "@tanstack/react-router";
import { ScholarshipGuidePage } from "@/components/scholarships/ScholarshipGuidePage";

export const Route = createFileRoute("/scholarships/stipendium-hungaricum")({
  component: StipendiumHungaricum,
});

function StipendiumHungaricum() {
  return <ScholarshipGuidePage slug="stipendium-hungaricum" />;
}

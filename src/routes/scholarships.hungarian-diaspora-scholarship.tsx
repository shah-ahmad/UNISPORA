import { createFileRoute } from "@tanstack/react-router";
import { ScholarshipGuidePage } from "@/components/scholarships/ScholarshipGuidePage";

export const Route = createFileRoute("/scholarships/hungarian-diaspora-scholarship")({
  component: HungarianDiasporaScholarship,
});

function HungarianDiasporaScholarship() {
  return <ScholarshipGuidePage slug="hungarian-diaspora-scholarship" />;
}

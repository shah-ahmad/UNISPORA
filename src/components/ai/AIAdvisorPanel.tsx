import { openAdvisor } from "./AdvisorChat";
import type { University } from "@/types/university";
export function AIAdvisorPanel({ university }: { university?: University; loading?: boolean }) {
  return <button className="panel-action primary" type="button" onClick={() => openAdvisor(university)}>Open AI Advisor chat</button>;
}

import { createFileRoute } from '@tanstack/react-router';
import { ScholarshipGuidePage } from '@/components/scholarships/ScholarshipGuidePage';
export const Route = createFileRoute('/scholarships/$slug')({ component: Guide });
function Guide() { const { slug } = Route.useParams(); return <ScholarshipGuidePage key={slug} slug={slug} />; }

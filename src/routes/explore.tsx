import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlobeMap } from "@/components/globe/GlobeMap";
import { UniversityDetailsPanel } from "@/components/globe/UniversityDetailsPanel";
import type { University } from "@/types/university";
import { useUniversities } from "@/hooks/useUniversities";

export const Route = createFileRoute("/explore")({
  component: Explore,
});

const all = "All";

function Explore() {
  const { universities } = useUniversities();
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState(all);
  const [country, setCountry] = useState(all);
  const [program, setProgram] = useState(all);
  const [language, setLanguage] = useState(all);
  const [tuition, setTuition] = useState(70000);
  const [scholarships, setScholarships] = useState(false);
  const [selected, setSelected] = useState<University>();
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number }>();

  useEffect(() => {
    if (universities[0] && (!selected || !universities.some((university) => university.id === selected.id))) {
      setSelected(universities[0]);
    }
  }, [selected, universities]);

  const filtered = useMemo(() => {
    return universities.filter((university) => {
      const haystack = `${university.name} ${university.city} ${university.country} ${university.programs.join(" ")}`.toLowerCase();
      return (
        haystack.includes(query.toLowerCase()) &&
        (continent === all || getContinent(university) === continent) &&
        (country === all || university.country === country) &&
        (program === all || university.programs.includes(program)) &&
        (language === all || university.languages.includes(language)) &&
        getTuitionValue(university) <= tuition &&
        (!scholarships || university.scholarships.length > 0)
      );
    });
  }, [universities, query, continent, country, program, language, tuition, scholarships]);

  return (
    <AppShell>
      <section className="explore-layout">
        <aside className="explore-sidebar">
          <label className="search-box">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search university, country, program..." />
          </label>
          <div className="filter-panel">
            <p><Filter size={16} /> Filters</p>
            <Select label="Continent" value={continent} onChange={setContinent} options={[all, ...unique(universities.map(getContinent))]} />
            <Select label="Country" value={country} onChange={setCountry} options={[all, ...unique(universities.map((u) => u.country))]} />
            <Select label="Program" value={program} onChange={setProgram} options={[all, ...unique(universities.flatMap((u) => u.programs))]} />
            <Select label="Language" value={language} onChange={setLanguage} options={[all, ...unique(universities.flatMap((u) => u.languages))]} />
            <label className="field-label">Tuition range <strong>Up to {tuition.toLocaleString()}</strong><input type="range" min="3000" max="70000" step="1000" value={tuition} onChange={(event) => setTuition(Number(event.target.value))} /></label>
            <label className="toggle-row"><input type="checkbox" checked={scholarships} onChange={(event) => setScholarships(event.target.checked)} /> Scholarships available</label>
          </div>
          <p className="results-count">{filtered.length} universities found</p>
          <div className="university-list">
            {filtered.map((university) => (
              <button key={university.id} type="button" className={`university-card ${selected?.id === university.id ? "active" : ""}`} onClick={() => setSelected(university)}>
                <strong>{university.name}</strong>
                <span>{university.city}, {university.country}</span>
                <small>{university.programs.slice(0, 2).join(" / ")}</small>
              </button>
            ))}
          </div>
        </aside>
        <section className="explore-globe">
          <GlobeMap
            universities={filtered}
            selectedUniversityId={selected?.id}
            onSelectUniversity={setSelected}
            onSelectedPointChange={setSelectedPoint}
          />
          <div className="explore-details anchored-details" style={getAnchoredPanelStyle(selectedPoint)}>
            <UniversityDetailsPanel university={selected} onClose={() => setSelected(undefined)} />
          </div>
        </section>
      </section>
    </AppShell>
  );
}

function getAnchoredPanelStyle(point?: { x: number; y: number }): CSSProperties {
  if (!point) return {};

  return {
    "--anchor-x": `${point.x}px`,
    "--anchor-y": `${point.y}px`,
  } as CSSProperties;
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function getContinent(university: University) {
  if (university.continent) return university.continent;

  const countryContinents: Record<string, string> = {
    Australia: "Oceania",
    Belgium: "Europe",
    Brazil: "South America",
    Canada: "North America",
    China: "Asia",
    Denmark: "Europe",
    Finland: "Europe",
    France: "Europe",
    Germany: "Europe",
    India: "Asia",
    Ireland: "Europe",
    Italy: "Europe",
    Japan: "Asia",
    Kenya: "Africa",
    Netherlands: "Europe",
    Nigeria: "Africa",
    Pakistan: "Asia",
    Poland: "Europe",
    Singapore: "Asia",
    Spain: "Europe",
    Sweden: "Europe",
    "Saudi Arabia": "Asia",
    "South Korea": "Asia",
    "United Kingdom": "Europe",
    USA: "North America",
  };

  return countryContinents[university.country] ?? "Other";
}

function getTuitionValue(university: University) {
  if (typeof university.tuitionValue === "number") return university.tuitionValue;
  if (/not publicly available|payable/i.test(university.tuition)) return 70000;
  return 25000;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field-label">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

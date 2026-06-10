import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Check, ChevronDown, Filter, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { GlobeMap } from "@/components/globe/GlobeMap";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SidebarHero } from "@/components/layout/SidebarHero";
import { TopNav } from "@/components/layout/TopNav";
import { UniversityDetailsPanel } from "@/components/globe/UniversityDetailsPanel";
import { AccountCard, Auth } from "@/routes/login";
import type { University } from "@/types/university";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppTheme } from "@/components/layout/theme";
import { useAuth } from "@/hooks/useAuth";
import { useUniversities } from "@/hooks/useUniversities";

export const Route = createFileRoute("/")({
  component: Index,
});

const all = "All";
type GlobeFocusTarget = {
  longitude: number;
  latitude: number;
  zoom: number;
  requestId: number;
};
type AuthMode = "login" | "signup" | "account";

function Index() {
  const { universities } = useUniversities();
  const { user } = useAuth();
  const userLabel = user?.name || user?.email?.split("@")[0];
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCommitted, setSearchCommitted] = useState(false);
  const [openFilterMenu, setOpenFilterMenu] = useState<string>();
  const [pendingContinent, setPendingContinent] = useState(all);
  const [pendingCountry, setPendingCountry] = useState(all);
  const [appliedContinent, setAppliedContinent] = useState(all);
  const [appliedCountry, setAppliedCountry] = useState(all);
  const [focusTarget, setFocusTarget] = useState<GlobeFocusTarget>();
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedPoint, setSelectedPoint] = useState<{ x: number; y: number }>();
  const { theme } = useAppTheme();
  const continentOptions = useMemo(() => [all, ...unique(universities.map(getContinent))], [universities]);
  const countryOptions = useMemo(() => {
    const scoped = pendingContinent === all
      ? universities
      : universities.filter((university) => getContinent(university) === pendingContinent);

    return [all, ...unique(scoped.map((university) => university.country))];
  }, [universities, pendingContinent]);
  const filteredUniversities = useMemo(
    () => filterUniversities(universities, appliedContinent, appliedCountry),
    [universities, appliedContinent, appliedCountry],
  );
  const pendingFilteredUniversities = useMemo(
    () => filterUniversities(universities, pendingContinent, pendingCountry),
    [universities, pendingContinent, pendingCountry],
  );
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return universities
      .filter((university) => `${university.name} ${university.city} ${university.country}`.toLowerCase().includes(query))
      .slice(0, 5);
  }, [universities, searchQuery]);
  const selected = useMemo(() => filteredUniversities.find((item) => item.id === selectedId), [filteredUniversities, selectedId]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  function applyFilters() {
    setOpenFilterMenu(undefined);
    setAppliedContinent(pendingContinent);
    setAppliedCountry(pendingCountry);
    setFocusTarget({
      ...getFilterFocusTarget(pendingContinent, pendingCountry, pendingFilteredUniversities),
      requestId: Date.now(),
    });

    if (selectedId && !pendingFilteredUniversities.some((university) => university.id === selectedId)) {
      setSelectedId(undefined);
    }
  }

  function updatePendingContinent(value: string) {
    setPendingContinent(value);
    setPendingCountry(all);
    setOpenFilterMenu(undefined);
  }

  function resetFilters() {
    setOpenFilterMenu(undefined);
    setPendingContinent(all);
    setPendingCountry(all);
    setAppliedContinent(all);
    setAppliedCountry(all);
    setSelectedId(undefined);
    setFocusTarget({
      longitude: 19.5,
      latitude: 47.1,
      zoom: 2.2,
      requestId: Date.now(),
    });
  }

  function focusUniversity(university: University) {
    setAppliedContinent(all);
    setAppliedCountry(all);
    setSelectedId(university.id);
    setFocusTarget({
      longitude: university.longitude,
      latitude: university.latitude,
      zoom: 4.8,
      requestId: Date.now(),
    });
  }

  function chooseSearchResult(university: University) {
    setSearchQuery(university.name);
    setSearchCommitted(true);
    focusUniversity(university);
  }

  function submitSearch() {
    const match = searchResults[0];
    if (!match) return;
    chooseSearchResult(match);
  }

  function renderFilterPopover(extraClass = "") {
    if (!filtersOpen) return null;

    return (
      <div className={`filter-popover ${openFilterMenu ? "menu-open" : ""} ${extraClass}`} role="dialog" aria-label="Filter universities">
        <div className="filter-popover-header">
          <div>
            <span>Filters</span>
            <strong>{pendingFilteredUniversities.length} universities</strong>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close filters"
            onClick={() => {
              setFiltersOpen(false);
              setOpenFilterMenu(undefined);
            }}
          >
            <X size={17} />
          </button>
        </div>
        <GlassSelect
          id="continent"
          label="Continent"
          value={pendingContinent}
          options={continentOptions}
          open={openFilterMenu === "continent"}
          onOpenChange={(open) => setOpenFilterMenu(open ? "continent" : undefined)}
          onChange={updatePendingContinent}
        />
        <GlassSelect
          id="country"
          label="Country"
          value={pendingCountry}
          options={countryOptions}
          open={openFilterMenu === "country"}
          onOpenChange={(open) => setOpenFilterMenu(open ? "country" : undefined)}
          onChange={(value) => {
            setPendingCountry(value);
            setOpenFilterMenu(undefined);
          }}
        />
        <div className="filter-actions-row">
          <button className="filter-apply-button" type="button" onClick={applyFilters}>
            <Check size={17} /> Apply filters
          </button>
          <button className="filter-reset-button" type="button" onClick={resetFilters}>
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="home-page">
      <div className="mobile-home-header">
        <div className="mobile-home-topline">
          <BrandLogo compact />
          <div className="mobile-home-controls">
            <ThemeToggle />
          </div>
        </div>
        {searchOpen ? (
          <div className="mobile-search-popover">
            <label className="home-search-box">
              <Search size={18} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchCommitted(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
                placeholder="Search university..."
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setSearchCommitted(false);
                }}
              >
                <X size={17} />
              </button>
            </label>
            {!searchCommitted && searchResults.length > 0 ? (
              <div className="home-search-results">
                {searchResults.map((university) => (
                  <button key={university.id} type="button" onClick={() => chooseSearchResult(university)}>
                    <strong>{university.name}</strong>
                    <span>{university.city}, {university.country}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <TopNav
            mobile
            onSearchClick={() => setSearchOpen(true)}
            onLoginClick={() => setAuthMode(user ? "account" : "login")}
            onSignupClick={() => setAuthMode("signup")}
            userLabel={userLabel}
            onAccountClick={() => setAuthMode("account")}
            activeAction={authMode === "account" ? undefined : authMode}
          />
        )}
      </div>
      <SidebarHero />
      <section className="home-globe">
        <button
          className="mobile-scroll-down"
          type="button"
          aria-label="Scroll to page details"
          onClick={() => document.querySelector(".home-sidebar")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          <ArrowDown size={18} />
        </button>
        <div className="mobile-map-actions">
          <Link className="mobile-map-action" to="/ai-advisor" search={{ university: undefined }} aria-label="AI Advisor">
            <Sparkles size={18} />
          </Link>
          <button
            className="mobile-map-action mobile-filter-pill"
            type="button"
            aria-label="Filters"
            onClick={() => {
              setFiltersOpen((value) => !value);
              setOpenFilterMenu(undefined);
            }}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>
        </div>
        <div className="mobile-filter-popover-wrap">
          {renderFilterPopover("mobile-filter-popover")}
        </div>
        <div className="absolute left-0 top-0 z-20 hidden h-full w-px bg-gradient-to-b from-transparent via-[#f6a623] to-transparent lg:block" />
        <div className="home-nav-slot absolute right-[220px] top-2 z-50 hidden xl:block">
          {searchOpen ? (
            <div className="home-search-popover">
              <label className="home-search-box">
                <Search size={18} />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setSearchCommitted(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitSearch();
                    }
                  }}
                  placeholder="Search university..."
                />
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                    setSearchCommitted(false);
                  }}
                >
                  <X size={17} />
                </button>
              </label>
              {!searchCommitted && searchResults.length > 0 ? (
                <div className="home-search-results">
                  {searchResults.map((university) => (
                    <button key={university.id} type="button" onClick={() => chooseSearchResult(university)}>
                      <strong>{university.name}</strong>
                      <span>{university.city}, {university.country}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <TopNav
              onSearchClick={() => setSearchOpen(true)}
              onLoginClick={() => setAuthMode(user ? "account" : "login")}
              onSignupClick={() => setAuthMode("signup")}
              userLabel={userLabel}
              onAccountClick={() => setAuthMode("account")}
              activeAction={authMode === "account" ? undefined : authMode}
            />
          )}
        </div>
        <div className="home-floating-controls absolute right-6 top-7 z-50 flex flex-col gap-3">
          <ThemeToggle />
          <div className="filter-control">
            <button
              className="control-pill"
              type="button"
              onClick={() => {
                setFiltersOpen((value) => !value);
                setOpenFilterMenu(undefined);
              }}
            >
              <Filter size={17} /> Filters
            </button>
            {renderFilterPopover()}
          </div>
        </div>
        <div className="globe-stage">
          <GlobeMap
            theme={theme}
            universities={filteredUniversities}
            focusTarget={focusTarget}
            selectedUniversityId={selectedId}
            onSelectUniversity={(university) => setSelectedId(university.id)}
            onSelectedPointChange={setSelectedPoint}
          />
        </div>
        {selected ? (
          <div className="home-details anchored-details" style={getAnchoredPanelStyle(selectedPoint)}>
            <UniversityDetailsPanel university={selected} onClose={() => setSelectedId(undefined)} />
          </div>
        ) : null}
        {authMode ? (
          <div className="auth-modal-layer" role="dialog" aria-modal="true" aria-label={authMode === "account" ? "Account" : authMode === "login" ? "Login" : "Sign up"} onPointerDown={() => setAuthMode(undefined)}>
            <div className="auth-modal" onPointerDown={(event) => event.stopPropagation()}>
              <button className="details-close" type="button" aria-label="Close auth modal" onClick={() => setAuthMode(undefined)}>
                <X size={18} />
              </button>
              {authMode === "account" && user ? (
                <AccountCard
                  name={userLabel ?? "UniSpora user"}
                  email={user.email}
                  onSignedOut={() => setAuthMode(undefined)}
                />
              ) : (
                <Auth
                  title={authMode === "login" ? "Welcome back to UniSpora." : "Create your UniSpora account."}
                  action={authMode === "login" ? "Login" : "Sign Up"}
                  signup={authMode === "signup"}
                  onSuccess={() => setAuthMode(undefined)}
                />
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function getAnchoredPanelStyle(point?: { x: number; y: number }): CSSProperties {
  if (!point) return {};

  return {
    "--anchor-x": `${point.x}px`,
    "--anchor-y": `${point.y}px`,
  } as CSSProperties;
}

function filterUniversities(items: University[], continent: string, country: string) {
  return items.filter((university) => (
    (continent === all || getContinent(university) === continent) &&
    (country === all || university.country === country)
  ));
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort();
}

function getFilterFocusTarget(continent: string, country: string, items: University[]) {
  if (country !== all && items.length > 0) {
    const center = getUniversityCenter(items);
    return { ...center, zoom: items.length === 1 ? 4.8 : 4 };
  }

  if (continent !== all) {
    return continentFocusTargets[continent] ?? { longitude: 0, latitude: 20, zoom: 1.8 };
  }

  return { longitude: 19.5, latitude: 47.1, zoom: 2.2 };
}

function getUniversityCenter(items: University[]) {
  const totals = items.reduce(
    (sum, university) => ({
      longitude: sum.longitude + university.longitude,
      latitude: sum.latitude + university.latitude,
    }),
    { longitude: 0, latitude: 0 },
  );

  return {
    longitude: totals.longitude / items.length,
    latitude: totals.latitude / items.length,
  };
}

const continentFocusTargets: Record<string, { longitude: number; latitude: number; zoom: number }> = {
  Africa: { longitude: 20, latitude: 3, zoom: 2.55 },
  Antarctica: { longitude: 20, latitude: -76, zoom: 2.3 },
  Asia: { longitude: 88, latitude: 31, zoom: 2.45 },
  Europe: { longitude: 15, latitude: 50, zoom: 3.05 },
  "North America": { longitude: -96, latitude: 42, zoom: 2.55 },
  Oceania: { longitude: 138, latitude: -25, zoom: 2.7 },
  "South America": { longitude: -60, latitude: -15, zoom: 2.55 },
};

function GlassSelect({
  id,
  label,
  value,
  options,
  open,
  onOpenChange,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (value: string) => void;
}) {
  function choose(option: string) {
    onChange(option);
    onOpenChange(false);
  }

  return (
    <div className="glass-select">
      <span className="glass-select-label">{label}</span>
      <button
        className="glass-select-trigger"
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-controls={`${id}-filter-options`}
      >
        <span>{value}</span>
        <ChevronDown size={16} />
      </button>
      {open ? (
        <div className="glass-select-menu" id={`${id}-filter-options`} role="listbox">
          {options.map((option) => (
            <button
              className={option === value ? "active" : ""}
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              onClick={() => choose(option)}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getContinent(university: University) {
  if (university.continent) return university.continent;

  const countryContinents: Record<string, string> = {
    Antarctica: "Antarctica",
    Australia: "Oceania",
    Belgium: "Europe",
    Brazil: "South America",
    Canada: "North America",
    China: "Asia",
    Denmark: "Europe",
    Egypt: "Africa",
    Finland: "Europe",
    France: "Europe",
    Germany: "Europe",
    Hungary: "Europe",
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
    "North Korea": "Asia",
    "Saudi Arabia": "Asia",
    "South Africa": "Africa",
    "South Korea": "Asia",
    "United Kingdom": "Europe",
    USA: "North America",
  };

  return countryContinents[university.country] ?? "Other";
}

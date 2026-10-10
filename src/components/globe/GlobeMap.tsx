import { useEffect, useRef, useState } from "react";
import type { University } from "@/types/university";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";
const DARK_MAP_STYLE = "mapbox://styles/ahmadshah2194/cmp1csqt3000801sj4sm44dfa";
const SATELLITE_MAP_STYLE = "mapbox://styles/mapbox/satellite-streets-v12";

type GlobeStyle = "digital" | "satellite";

type GlobeFocusTarget = {
  longitude: number;
  latitude: number;
  zoom: number;
  requestId: number;
};

type GlobeMapProps = {
  globeStyle?: GlobeStyle;
  universities: University[];
  focusTarget?: GlobeFocusTarget;
  selectedUniversityId?: string;
  onSelectUniversity?: (university: University) => void;
  onSelectedPointChange?: (point?: { x: number; y: number }) => void;
};

export function GlobeMap({
  globeStyle = "digital",
  universities,
  focusTarget,
  selectedUniversityId,
  onSelectUniversity,
  onSelectedPointChange,
}: GlobeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const universitiesRef = useRef(universities);
  const onSelectRef = useRef(onSelectUniversity);
  const selectedIdRef = useRef(selectedUniversityId);
  const onPointRef = useRef(onSelectedPointChange);
  const focusRef = useRef(focusTarget);
  const [mounted, setMounted] = useState(false);

  universitiesRef.current = universities;
  onSelectRef.current = onSelectUniversity;
  selectedIdRef.current = selectedUniversityId;
  onPointRef.current = onSelectedPointChange;
  focusRef.current = focusTarget;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    let map: any;
    let cancelled = false;
    let selectedPointFrame: number | undefined;
    let introTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      await import("mapbox-gl/dist/mapbox-gl.css");
      if (cancelled || !containerRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const selectedMapStyle = globeStyle === "satellite" ? SATELLITE_MAP_STYLE : DARK_MAP_STYLE;

      map = new mapboxgl.Map({
        container: containerRef.current,
        style: selectedMapStyle,
        projection: "globe",
        zoom: 0.9,
        center: [0, 25],
        bearing: -20,
        pitch: 0,
        maxZoom: 16,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
      mapRef.current = map;
      map.scrollZoom.enable();

      map.on("move", updateSelectedPoint);
      map.on("zoom", updateSelectedPoint);
      map.on("resize", updateSelectedPoint);

      map.on("load", () => {
        map.resize();
        updateSelectedPoint();
        map.setFog({
          color: "rgb(4, 11, 25)",
          "high-color": "rgb(74, 117, 166)",
          "horizon-blend": 0.08,
          "space-color": "rgb(0, 3, 10)",
          "star-intensity": globeStyle === "satellite" ? 0.55 : 1,
        });

        introTimer = setTimeout(() => {
          if (cancelled || focusRef.current) return;
          map.easeTo({
            center: [19.5, 47.1],
            zoom: 2.2,
            bearing: 20,
            pitch: 10,
            padding: { top: 40, bottom: 180, left: 0, right: 0 },
            duration: 2500,
            easing: (t: number) => t * (2 - t),
          });
        }, 300);

        map.addSource("universities", {
          type: "geojson",
          data: toGeoJson(universitiesRef.current),
          cluster: true,
          clusterMaxZoom: 8,
          clusterRadius: 60,
        });

        map.addLayer({
          id: "university-cluster-glow",
          type: "circle",
          source: "universities",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#f6b75c",
            "circle-opacity": 0.38,
            "circle-emissive-strength": 1,
            "circle-radius": ["step", ["get", "point_count"], 24, 5, 32, 10, 42],
            "circle-blur": 0.78,
          },
        });

        map.addLayer({
          id: "university-clusters",
          type: "circle",
          source: "universities",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#111820",
            "circle-opacity": 0.68,
            "circle-emissive-strength": 0.7,
            "circle-radius": ["step", ["get", "point_count"], 15, 5, 20, 10, 26],
            "circle-stroke-width": 2.4,
            "circle-stroke-color": "#f6b75c",
            "circle-stroke-opacity": 0.88,
          },
        });

        map.addLayer({
          id: "university-cluster-highlight",
          type: "circle",
          source: "universities",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#fff4d8",
            "circle-opacity": 0.16,
            "circle-emissive-strength": 1,
            "circle-radius": ["step", ["get", "point_count"], 10, 5, 14, 10, 18],
            "circle-blur": 0.65,
            "circle-translate": [-3, -4],
          },
        });

        map.addLayer({
          id: "university-cluster-count",
          type: "symbol",
          source: "universities",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 16,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
          paint: {
            "text-color": "#fff9ed",
            "text-halo-color": "#1c1206",
            "text-halo-width": 1,
          },
        });

        map.addLayer({
          id: "university-points",
          type: "circle",
          source: "universities",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": "#f6a623",
            "circle-opacity": 1,
            "circle-emissive-strength": 1,
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff3d5",
          },
        });

        // Keep the selected university visible even when nearby points are clustered.
        map.addSource('selected-university', { type: 'geojson', data: toGeoJson(universitiesRef.current.filter(item => item.id === selectedIdRef.current)) });
        map.addLayer({ id: 'selected-university-point', type: 'circle', source: 'selected-university', paint: {
          'circle-radius': 10, 'circle-color': '#f6a623', 'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff', 'circle-emissive-strength': 1,
        } });
        if (focusRef.current) focusMap(map, focusRef.current);

        map.on("click", "university-clusters", (e: any) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["university-clusters"] });
          const clusterId = features[0].properties.cluster_id;
          const source = map.getSource("universities");
          source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            map.easeTo({ center: features[0].geometry.coordinates, zoom, padding: { top: 40, bottom: 160, left: 0, right: 0 } });
          });
        });

        map.on("click", "university-points", (e: any) => {
          const id = e.features[0].properties.id as string;
          const university = universitiesRef.current.find((item) => item.id === id);
          if (!university) return;
          onSelectRef.current?.(university);
          selectedIdRef.current = university.id;
          updateSelectedPoint();
        });

        ["university-clusters", "university-points"].forEach((layer) => {
          map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
        });
      });
    })();

    return () => {
      cancelled = true;
      if (introTimer) clearTimeout(introTimer);
      if (selectedPointFrame !== undefined) {
        cancelAnimationFrame(selectedPointFrame);
      }
      onPointRef.current?.(undefined);
      if (map) map.remove();
      if (mapRef.current === map) mapRef.current = null;
    };

    function updateSelectedPoint() {
      if (selectedPointFrame !== undefined) return;

      selectedPointFrame = requestAnimationFrame(() => {
        selectedPointFrame = undefined;
        projectSelectedPoint();
      });
    }

    function projectSelectedPoint() {
      if (!map) return;
      const selected = universitiesRef.current.find((item) => item.id === selectedIdRef.current);
      if (!selected) {
        onPointRef.current?.(undefined);
        return;
      }

      const point = map.project([selected.longitude, selected.latitude]);
      onPointRef.current?.({ x: point.x, y: point.y });
    }
  }, [mounted, globeStyle]);

  useEffect(() => {
    const source = mapRef.current?.getSource("universities");
    if (!source) return;
    source.setData(toGeoJson(universities));
    mapRef.current?.getSource('selected-university')?.setData(toGeoJson(universities.filter(item => item.id === selectedIdRef.current)));
  }, [universities]);

  useEffect(() => {
    if (!focusTarget || !mapRef.current) return;

    if (mapRef.current.getSource('universities')) focusMap(mapRef.current, focusTarget);
  }, [focusTarget?.requestId]);

  useEffect(() => {
    mapRef.current?.getSource('selected-university')?.setData(toGeoJson(universitiesRef.current.filter(item => item.id === selectedUniversityId)));
    if (!selectedUniversityId) {
      onPointRef.current?.(undefined);
      return;
    }

    if (!mapRef.current) return;
    const university = universitiesRef.current.find((item) => item.id === selectedUniversityId);
    if (!university) {
      onPointRef.current?.(undefined);
      return;
    }
    const point = mapRef.current.project([university.longitude, university.latitude]);
    onPointRef.current?.({ x: point.x, y: point.y });
  }, [selectedUniversityId, universities]);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}

function focusMap(map: any, target: GlobeFocusTarget) {
  map.easeTo({ center: [target.longitude, target.latitude], zoom: target.zoom,
    bearing: 28, pitch: 12, padding: { top: 70, bottom: 170, left: 80, right: 160 },
    duration: 1900, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
}

function toGeoJson(items: University[]) {
  return {
    type: "FeatureCollection",
    features: items.map((university) => ({
      type: "Feature",
      properties: {
        id: university.id,
        name: university.name,
        city: university.city,
        country: university.country,
        website: university.website,
        description: university.description,
        programs: university.programs.join(", "),
        tuition: university.tuition,
        languages: university.languages.join(", "),
        scholarships: university.scholarships.join("|"),
      },
      geometry: {
        type: "Point",
        coordinates: [university.longitude, university.latitude],
      },
    })),
  };
}

import * as pmtiles from "pmtiles";
import * as maplibregl from "maplibre-gl";
import { useEffect, useState } from "react";
import supabase from "./supabase";

export function useSupabaseSession(callbacks: { loggedIn?: () => void, loggedOut?: () => void } = {}) {
    const [session, setSession] = useState<any | null | undefined>();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        });

        const { data: { subscription }, } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        // early return if session is undefined (yet to load)
        if (session === undefined) {
            return;
        }

        if (session) {
            if (callbacks.loggedIn) callbacks.loggedIn();
        } else {
            if (callbacks.loggedOut) callbacks.loggedOut();
        }

    }, [session]);

    return session;
}

interface Metadata {
  name?: string;
  type?: string;
  tilestats?: unknown;
  vector_layers: maplibregl.LayerSpecification[];
}
  
export async function layers(file: pmtiles.PMTiles, color: string): Promise<maplibregl.LayerSpecification[]> {
  const metadata = (await file.getMetadata()) as Metadata;
  let layers: maplibregl.LayerSpecification[] = [];

  console.log(metadata);

  const vectorLayers = metadata.vector_layers;

  if (vectorLayers == null) {
    return [];
  }

  for (const [i, layer] of vectorLayers.entries()) {
    layers.push(polygon(layer, 1, color));
    layers.push(linestring(layer, color));
    layers.push(point(layer, color));
  }

  return layers;
}

function polygon(layer: maplibregl.LayerSpecification, baseOpacity: number, color: string): maplibregl.LayerSpecification {
    return {
      id: `${layer.id}_fill`,
      type: "fill",
      source: "source",
      "source-layer": layer.id,
      paint: {
        "fill-color": color,
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          baseOpacity,
          baseOpacity - 0.15,
        ],
        "fill-outline-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          "hsl(0,100%,90%)",
          "rgba(0,0,0,0.2)",
        ],
      },
      filter: ["==", ["geometry-type"], "Polygon"],
    }
  }
  
  
  function point(layer: maplibregl.LayerSpecification, color: string): maplibregl.LayerSpecification {
    return {
      id: `${layer.id}_point`,
      type: "circle",
      source: "source",
      "source-layer": layer.id,
      paint: {
        "circle-color": color,
        "circle-radius": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          6,
          5,
        ],
      },
      filter: ["==", ["geometry-type"], "Point"],
    };
  }
  
  function linestring(layer: maplibregl.LayerSpecification, color: string): maplibregl.LayerSpecification {
    return {
      id: `${layer.id}_stroke`,
      type: "line",
      source: "source",
      "source-layer": layer.id,
      paint: {
        "line-color": color,
        "line-width": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          5,
          2.5,
        ],
      },
      filter: ["==", ["geometry-type"], "LineString"],
    }
  }
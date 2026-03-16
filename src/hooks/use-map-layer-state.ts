/**
 * useMapLayerState — Consolidates 34+ individual layer toggle `useState` booleans
 * into a single `useReducer` to reduce re-render scope and simplify state management.
 *
 * Each dispatch only produces a single state update → single re-render,
 * instead of multiple `useState` setters causing cascading renders.
 */
import { useReducer, useCallback, useMemo } from "react";

/* ── Layer keys ── */
export type LayerKey =
  | "seeds"
  | "groves"
  | "rootThreads"
  | "mycelialNetwork"
  | "offeringGlow"
  | "harvestLayer"
  | "ancientHighlight"
  | "externalTrees"
  | "birdsongHeat"
  | "hiveLayer"
  | "researchLayer"
  | "rootstones"
  | "rootstoneTrees"
  | "rootstoneGroves"
  | "immutableLayer"
  | "recentVisits"
  | "seedTraces"
  | "sharedTrees"
  | "tribeActivity"
  | "bloomedSeeds"
  | "seedTrail"
  | "heartGlow"
  | "churchyards"
  | "waterways"
  | "footpaths"
  | "heritage"
  | "castles"
  | "libraries"
  | "bookshops"
  | "botanicalGardens"
  | "bloomingClock"
  | "watersCommons"
  | "clearView"
  | "groveView"
  | "bloomConstellationMode"
  | "forestPulse"
  | "mycelialPathways";

export type LayerState = Record<LayerKey, boolean>;

/* ── Actions ── */
type LayerAction =
  | { type: "toggle"; key: LayerKey }
  | { type: "set"; key: LayerKey; value: boolean }
  | { type: "batch"; updates: Partial<LayerState> }
  | { type: "reset"; keys: LayerKey[]; value: boolean };

/* ── Default state ── */
function getInitialState(): LayerState {
  // Read URL params once for initial state
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(window.location.search);
  } catch {
    params = new URLSearchParams();
  }

  return {
    seeds: true,
    groves: false,
    rootThreads: false,
    mycelialNetwork: params.get("mycelial") === "on",
    offeringGlow: false,
    harvestLayer: false,
    ancientHighlight: false,
    externalTrees: false,
    birdsongHeat: false,
    hiveLayer: false,
    researchLayer: params.get("research") !== "off", // on by default
    rootstones: params.get("rootstones") === "on" || Boolean(params.get("rootstoneId")),
    rootstoneTrees: true,
    rootstoneGroves: true,
    immutableLayer: params.get("immutable") === "on",
    recentVisits: false,
    seedTraces: false,
    sharedTrees: false,
    tribeActivity: false,
    bloomedSeeds: false,
    seedTrail: false,
    heartGlow: false,
    churchyards: false,
    waterways: false,
    footpaths: false,
    heritage: false,
    castles: false,
    libraries: false,
    bookshops: false,
    botanicalGardens: false,
    bloomingClock: false,
    watersCommons: false,
    clearView: false,
    groveView: false,
    bloomConstellationMode: false,
    forestPulse: false,
  };
}

function layerReducer(state: LayerState, action: LayerAction): LayerState {
  switch (action.type) {
    case "toggle":
      return { ...state, [action.key]: !state[action.key] };
    case "set":
      if (state[action.key] === action.value) return state; // no-op
      return { ...state, [action.key]: action.value };
    case "batch":
      return { ...state, ...action.updates };
    case "reset": {
      const updates: Partial<LayerState> = {};
      action.keys.forEach((k) => {
        updates[k] = action.value;
      });
      return { ...state, ...updates };
    }
    default:
      return state;
  }
}

/* ── Hook ── */
export function useMapLayerState() {
  const [layers, dispatch] = useReducer(layerReducer, undefined, getInitialState);

  const toggle = useCallback((key: LayerKey) => {
    dispatch({ type: "toggle", key });
  }, []);

  const setLayer = useCallback((key: LayerKey, value: boolean) => {
    dispatch({ type: "set", key, value });
  }, []);

  const batchUpdate = useCallback((updates: Partial<LayerState>) => {
    dispatch({ type: "batch", updates });
  }, []);

  /** Create a toggle function for a specific layer — stable reference */
  const toggler = useCallback(
    (key: LayerKey) => () => dispatch({ type: "toggle", key }),
    []
  );

  /** Create a setter-style toggle (for (v: boolean) => void interfaces) */
  const setterToggle = useCallback(
    (key: LayerKey) => (fn: (prev: boolean) => boolean) => {
      // We need current state, so we use a functional approach
      dispatch({ type: "toggle", key });
    },
    []
  );

  return {
    layers,
    toggle,
    setLayer,
    batchUpdate,
    toggler,
    dispatch,
  };
}

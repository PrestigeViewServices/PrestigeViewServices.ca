/**
 * Snow event phases: pure definitions, safe to import from client
 * components. Storage lives in lib/snow-status.ts (server only).
 */

export const SNOW_PHASES = ["none", "watch", "deployed", "cleanup", "complete"] as const;
export type SnowPhase = (typeof SNOW_PHASES)[number];

export const COMPLETE_TTL_HOURS = 12;
export const ACTIVE_TTL_HOURS = 36;

export type SnowPhaseDef = {
  phase: SnowPhase;
  /** Short label for chips and buttons. */
  label: string;
  /** Public headline. */
  headline: string;
  /** Public default detail line (owner note replaces it when set). */
  detail: string;
  /** Step number in the storm timeline (0 = not shown). */
  step: number;
  tone: "idle" | "amber" | "sky" | "violet" | "emerald";
};

export const PHASE_DEFS: Record<SnowPhase, SnowPhaseDef> = {
  none: {
    phase: "none",
    label: "No event",
    headline: "No active snow event",
    detail: "Routes run automatically once 5 cm or more falls. No call needed.",
    step: 0,
    tone: "idle",
  },
  watch: {
    phase: "watch",
    label: "Storm watch",
    headline: "Storm watch: snow on the way",
    detail:
      "We're tracking the system and staging equipment. Routes start once snow reaches the trigger depth.",
    step: 1,
    tone: "amber",
  },
  deployed: {
    phase: "deployed",
    label: "Crews deployed",
    headline: "Crews deployed: routes underway",
    detail:
      "Tractors are out clearing Pembroke and Petawawa routes now. Follow them on the live map.",
    step: 2,
    tone: "sky",
  },
  cleanup: {
    phase: "cleanup",
    label: "Cleanup pass",
    headline: "Cleanup pass in progress",
    detail:
      "Main pass is done. We're back out for end-of-storm cleanup and plow windrows at the end of driveways.",
    step: 3,
    tone: "violet",
  },
  complete: {
    phase: "complete",
    label: "Routes complete",
    headline: "All routes complete",
    detail:
      "Every driveway on our routes has been cleared. Missed spot? Message us and we'll come back.",
    step: 4,
    tone: "emerald",
  },
};

/** The four public steps of a storm, in order. */
export const TIMELINE: SnowPhase[] = ["watch", "deployed", "cleanup", "complete"];

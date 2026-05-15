import type { RegionSlug } from "@/data/quiltMatchHomeRetreats";
import {
  DEFAULT_FILTERS,
  initialFiltersFromSeed,
  type RetreatFilters,
} from "@/lib/quilt-match-retreat-filters";

export type AiConciergeResult = {
  filters: RetreatFilters | null;
  summary: string;
  followUp: string | null;
};

/** Exact preset strings from quilt-match RetreatAiSearch EXAMPLES */
const PRESETS: Record<string, Partial<RetreatFilters>> = {
  "Beginner-friendly open sew weekend in Texas under $700, no shared rooms, near hiking": {
    states: ["TX"],
    region: "south",
    priceMax: 700,
    lengths: ["1-3"],
    focuses: ["open-sew"],
    okWithSharedRoom: false,
    experiences: ["Local hikes"],
  },
  "ADA accessible retreat with a long-arm and catered meals in the fall": {
    ada: {
      stepFreeAccess: true,
      accessibleRoom: true,
      accessibleBathroom: true,
      elevator: false,
    },
    amenities: ["Long-arm"],
    foodIncluded: true,
    foodStyles: ["catered"],
  },
  "5-day skill class in the Mountain region with vegetarian food and my own room": {
    region: "mountain",
    lengths: ["4-5"],
    focuses: ["skill-class"],
    dietary: ["Vegetarian"],
    privateRoomAvailable: true,
  },
};

const PRESET_SUMMARY: Record<string, { summary: string; followUp: string | null }> = {
  "Beginner-friendly open sew weekend in Texas under $700, no shared rooms, near hiking": {
    summary:
      "Here's what I picked: Texas, open sew, weekends under $700, no shared rooms, with hiking nearby.",
    followUp: null,
  },
  "ADA accessible retreat with a long-arm and catered meals in the fall": {
    summary:
      "Here's what I picked: accessibility-friendly stays, long-arm on site, and catered meals — tweak dates with the filters.",
    followUp: null,
  },
  "5-day skill class in the Mountain region with vegetarian food and my own room": {
    summary:
      "Here's what I picked: Mountain region, mid-length skill retreats, vegetarian-friendly food, private room options.",
    followUp: null,
  },
};

const STATE_WORDS: [RegExp, string][] = [
  [/\btexas\b|\btx\b/i, "TX"],
  [/\bvermont\b|\bvt\b/i, "VT"],
  [/\boregon\b|\bor\b/i, "OR"],
  [/\bnorth carolina\b|\bnc\b/i, "NC"],
  [/\bmontana\b|\bmt\b/i, "MT"],
  [/\bmaine\b|\bme\b/i, "ME"],
  [/\bwashington\b|\bwa\b/i, "WA"],
  [/\butah\b|\but\b/i, "UT"],
  [/\bcolorado\b|\bco\b/i, "CO"],
  [/\basheville\b/i, "NC"],
  [/\bstowe\b/i, "VT"],
  [/\bseattle\b/i, "WA"],
];

const REGION_WORDS: [RegExp, RegionSlug][] = [
  [/\bnortheast\b|\bnew england\b/i, "northeast"],
  [/\bsouth\b|\bcarolinas\b|\btexas\b|\bhill country\b/i, "south"],
  [/\bmidwest\b|\bamish\b|\bwisconsin\b|\bindiana\b/i, "midwest"],
  [/\bmountain\b|\brockies\b|\balpine\b/i, "mountain"],
  [/\bwest coast\b|\bpacific northwest\b|\bpnw\b/i, "west-coast"],
];

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

function heuristicPatch(query: string): Partial<RetreatFilters> | null {
  const q = query.trim();
  if (q.length < 4) return null;

  const patch: Partial<RetreatFilters> = {};
  const states: string[] = [];

  for (const [re, code] of STATE_WORDS) {
    if (re.test(q)) states.push(code);
  }
  if (states.length) patch.states = uniq(states);

  for (const [re, slug] of REGION_WORDS) {
    if (re.test(q)) {
      patch.region = slug;
      break;
    }
  }

  const under = q.match(/\bunder\s*\$?\s*(\d{3,4})\b/i);
  const budget = q.match(/\$\s*(\d{3,4})\b/);
  const n = under ? Number(under[1]) : budget ? Number(budget[1]) : null;
  if (n && n > 100 && n < 20000) {
    patch.priceMax = Math.min(n, DEFAULT_FILTERS.priceMax);
  }

  if (/\bada\b|\baccessible\b|\bwheelchair\b/i.test(q)) {
    patch.ada = {
      stepFreeAccess: true,
      accessibleRoom: true,
      accessibleBathroom: true,
      elevator: false,
    };
  }

  if (/\blong[\s-]?arm\b/i.test(q)) {
    patch.amenities = uniq([...(patch.amenities ?? []), "Long-arm"]);
  }

  if (/\bcatered\b|\bcater\b/i.test(q)) {
    patch.foodIncluded = true;
    patch.foodStyles = uniq([...(patch.foodStyles ?? []), "catered"]);
  }

  if (/\bvegetarian\b/i.test(q)) patch.dietary = uniq([...(patch.dietary ?? []), "Vegetarian"]);
  if (/\bvegan\b/i.test(q)) patch.dietary = uniq([...(patch.dietary ?? []), "Vegan"]);
  if (/\bgluten[- ]?free\b/i.test(q)) patch.dietary = uniq([...(patch.dietary ?? []), "Gluten-free"]);

  if (/\bopen sew\b|\bopen-sew\b/i.test(q)) patch.focuses = uniq([...(patch.focuses ?? []), "open-sew"]);
  if (/\bskill class\b|\bworkshop\b/i.test(q))
    patch.focuses = uniq([...(patch.focuses ?? []), "skill-class"]);

  if (/\b5[\s-]?day\b|\bfive[\s-]?day\b/i.test(q)) patch.lengths = uniq([...(patch.lengths ?? []), "4-5"]);
  if (/\bweekend\b|\b2[\s-]?night\b|\b3[\s-]?night\b/i.test(q))
    patch.lengths = uniq([...(patch.lengths ?? []), "1-3"]);

  if (/\bprivate room\b|\bmy own room\b|\bno shared\b|\bnot share\b/i.test(q)) {
    patch.privateRoomAvailable = true;
    patch.okWithSharedRoom = false;
  }

  if (/\bhiking\b|\bhikes\b/i.test(q))
    patch.experiences = uniq([...(patch.experiences ?? []), "Local hikes"]);

  const touched =
    (patch.states && patch.states.length > 0) ||
    patch.region ||
    patch.priceMax !== undefined ||
    (patch.amenities && patch.amenities.length > 0) ||
    patch.ada ||
    (patch.focuses && patch.focuses.length > 0) ||
    (patch.lengths && patch.lengths.length > 0) ||
    patch.foodIncluded !== undefined ||
    (patch.foodStyles && patch.foodStyles.length > 0) ||
    (patch.dietary && patch.dietary.length > 0) ||
    patch.privateRoomAvailable !== undefined ||
    patch.okWithSharedRoom !== undefined ||
    (patch.experiences && patch.experiences.length > 0);

  return touched ? patch : null;
}

/**
 * Client-side stand-in for quilt-match server AI (no API keys in the browser).
 * Handles exact example prompts + light keyword parsing.
 */
export async function searchRetreatsWithAIClient(query: string): Promise<AiConciergeResult> {
  await new Promise((r) => setTimeout(r, 450));
  const q = query.trim();
  if (!q) {
    return { filters: null, summary: "Try describing what you want in a sentence.", followUp: null };
  }

  const preset = PRESETS[q];
  if (preset) {
    const meta = PRESET_SUMMARY[q];
    return {
      filters: initialFiltersFromSeed(preset),
      summary: meta.summary,
      followUp: meta.followUp,
    };
  }

  const h = heuristicPatch(q);
  if (h) {
    return {
      filters: initialFiltersFromSeed(h),
      summary: "Here's a first pass from your description — refine with the filters anytime.",
      followUp: null,
    };
  }

  return {
    filters: null,
    summary:
      "I couldn't confidently map that yet — try one of the example chips or use the filters on the left.",
    followUp: null,
  };
}

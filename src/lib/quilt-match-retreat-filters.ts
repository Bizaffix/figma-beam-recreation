import type { FocusType, FoodStyle } from "@/data/quiltMatchRetreatExtras";
import type { RegionSlug } from "@/data/quiltMatchHomeRetreats";

export type LengthBucket = "1-3" | "4-5" | "6+";

export type RetreatFilters = {
  states: string[];
  region: "all" | RegionSlug;
  priceMin: number;
  priceMax: number;
  lengths: LengthBucket[];
  focuses: FocusType[];
  amenities: string[];
  ada: {
    stepFreeAccess: boolean;
    accessibleRoom: boolean;
    accessibleBathroom: boolean;
    elevator: boolean;
  };
  experiences: string[];
  foodIncluded: boolean | null;
  foodStyles: FoodStyle[];
  kitchenAccess: boolean | null;
  dietary: string[];
  privateRoomAvailable: boolean | null;
  okWithSharedRoom: boolean | null;
};

export const DEFAULT_FILTERS: RetreatFilters = {
  states: [],
  region: "all",
  priceMin: 0,
  priceMax: 5000,
  lengths: [],
  focuses: [],
  amenities: [],
  ada: {
    stepFreeAccess: false,
    accessibleRoom: false,
    accessibleBathroom: false,
    elevator: false,
  },
  experiences: [],
  foodIncluded: null,
  foodStyles: [],
  kitchenAccess: null,
  dietary: [],
  privateRoomAvailable: null,
  okWithSharedRoom: null,
};

export function lengthBucketFor(days: number): LengthBucket {
  if (days <= 3) return "1-3";
  if (days <= 5) return "4-5";
  return "6+";
}

/** Deep-merge partial seed onto defaults for controlled components */
export function initialFiltersFromSeed(seed?: Partial<RetreatFilters>): RetreatFilters {
  if (!seed) return DEFAULT_FILTERS;
  return {
    ...DEFAULT_FILTERS,
    ...seed,
    states: seed.states ?? DEFAULT_FILTERS.states,
    region: seed.region ?? DEFAULT_FILTERS.region,
    priceMin: seed.priceMin ?? DEFAULT_FILTERS.priceMin,
    priceMax: seed.priceMax ?? DEFAULT_FILTERS.priceMax,
    lengths: seed.lengths ?? DEFAULT_FILTERS.lengths,
    focuses: seed.focuses ?? DEFAULT_FILTERS.focuses,
    amenities: seed.amenities ?? DEFAULT_FILTERS.amenities,
    ada: { ...DEFAULT_FILTERS.ada, ...seed.ada },
    experiences: seed.experiences ?? DEFAULT_FILTERS.experiences,
    foodIncluded: seed.foodIncluded ?? DEFAULT_FILTERS.foodIncluded,
    foodStyles: seed.foodStyles ?? DEFAULT_FILTERS.foodStyles,
    kitchenAccess: seed.kitchenAccess ?? DEFAULT_FILTERS.kitchenAccess,
    dietary: seed.dietary ?? DEFAULT_FILTERS.dietary,
    privateRoomAvailable: seed.privateRoomAvailable ?? DEFAULT_FILTERS.privateRoomAvailable,
    okWithSharedRoom: seed.okWithSharedRoom ?? DEFAULT_FILTERS.okWithSharedRoom,
  };
}

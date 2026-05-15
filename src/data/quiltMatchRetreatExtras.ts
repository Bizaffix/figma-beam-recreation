// Extended search metadata for marketplace retreats. Keyed by Retreat.id.
// Ported from quilt-match src/data/retreat-extras.ts

export type FocusType = "open-sew" | "skill-class" | "mixed";
export type FoodStyle = "catered" | "chef" | "family-style" | "self-cater";

export type RetreatExtras = {
  lengthDays: number;
  focus: FocusType;
  amenities: string[];
  ada: {
    stepFreeAccess: boolean;
    accessibleRoom: boolean;
    accessibleBathroom: boolean;
    elevator: boolean;
  };
  experiences: string[];
  food: {
    included: boolean;
    style: FoodStyle;
    kitchenAccess: boolean;
    dietary: string[];
  };
  rooming: {
    privateRoomAvailable: boolean;
    sharedOnly: boolean;
    privateRoomUpcharge?: number;
  };
};

export const ALL_AMENITIES = [
  "Long-arm",
  "Design wall",
  "Cutting tables",
  "Iron stations",
  "Dedicated cutting room",
  "WiFi",
  "On-site shop",
  "Hot tub",
] as const;

export const ALL_EXPERIENCES = [
  "Local hikes",
  "Museum tour",
  "Quilt shop hop",
  "Wine tasting",
  "Farm visit",
  "Stargazing",
  "Lake swimming",
  "Ferry day trip",
] as const;

export const ALL_DIETARY = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free"] as const;

export const retreatExtras: Record<string, RetreatExtras> = {
  "modern-geometrics-2026": {
    lengthDays: 5,
    focus: "skill-class",
    amenities: ["Long-arm", "Design wall", "Cutting tables", "Iron stations", "WiFi"],
    ada: { stepFreeAccess: true, accessibleRoom: true, accessibleBathroom: true, elevator: false },
    experiences: ["Local hikes", "Stargazing"],
    food: { included: true, style: "chef", kitchenAccess: false, dietary: ["Vegetarian", "Gluten-free"] },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 200 },
  },
  "natural-dyeing-2026": {
    lengthDays: 4,
    focus: "skill-class",
    amenities: ["Design wall", "Cutting tables", "WiFi"],
    ada: { stepFreeAccess: false, accessibleRoom: false, accessibleBathroom: false, elevator: false },
    experiences: ["Farm visit", "Wine tasting"],
    food: { included: true, style: "family-style", kitchenAccess: true, dietary: ["Vegetarian", "Vegan"] },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 150 },
  },
  "heirloom-foundations-2027": {
    lengthDays: 5,
    focus: "skill-class",
    amenities: ["Long-arm", "Cutting tables", "Iron stations", "WiFi", "Dedicated cutting room"],
    ada: { stepFreeAccess: true, accessibleRoom: true, accessibleBathroom: true, elevator: true },
    experiences: ["Local hikes", "Quilt shop hop"],
    food: {
      included: true,
      style: "chef",
      kitchenAccess: false,
      dietary: ["Vegetarian", "Gluten-free", "Dairy-free"],
    },
    rooming: { privateRoomAvailable: true, sharedOnly: false },
  },
  "winter-scrap-2027": {
    lengthDays: 3,
    focus: "open-sew",
    amenities: ["Design wall", "Cutting tables", "Iron stations"],
    ada: { stepFreeAccess: true, accessibleRoom: false, accessibleBathroom: true, elevator: false },
    experiences: ["Wine tasting"],
    food: { included: true, style: "family-style", kitchenAccess: true, dietary: ["Vegetarian"] },
    rooming: { privateRoomAvailable: false, sharedOnly: true },
  },
  "prairie-star-2027": {
    lengthDays: 4,
    focus: "skill-class",
    amenities: ["Long-arm", "Design wall", "Cutting tables", "WiFi"],
    ada: { stepFreeAccess: true, accessibleRoom: true, accessibleBathroom: true, elevator: false },
    experiences: ["Local hikes", "Stargazing", "Farm visit"],
    food: { included: true, style: "chef", kitchenAccess: false, dietary: ["Vegetarian", "Gluten-free"] },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 250 },
  },
  "coastal-improv-2027": {
    lengthDays: 5,
    focus: "mixed",
    amenities: ["Design wall", "Cutting tables", "Iron stations", "WiFi"],
    ada: { stepFreeAccess: false, accessibleRoom: false, accessibleBathroom: false, elevator: false },
    experiences: ["Local hikes", "Museum tour"],
    food: { included: true, style: "chef", kitchenAccess: false, dietary: ["Vegetarian"] },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 300 },
  },
  "amish-sampler-2026": {
    lengthDays: 5,
    focus: "skill-class",
    amenities: ["Long-arm", "Cutting tables", "Iron stations", "On-site shop"],
    ada: { stepFreeAccess: true, accessibleRoom: true, accessibleBathroom: true, elevator: false },
    experiences: ["Quilt shop hop", "Farm visit"],
    food: { included: true, style: "family-style", kitchenAccess: false, dietary: ["Vegetarian"] },
    rooming: { privateRoomAvailable: false, sharedOnly: true },
  },
  "high-desert-hand-2026": {
    lengthDays: 5,
    focus: "open-sew",
    amenities: ["Design wall", "WiFi", "Hot tub"],
    ada: { stepFreeAccess: true, accessibleRoom: true, accessibleBathroom: true, elevator: true },
    experiences: ["Local hikes", "Stargazing"],
    food: { included: false, style: "self-cater", kitchenAccess: true, dietary: [] },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 175 },
  },
  "lake-log-cabin-2027": {
    lengthDays: 5,
    focus: "mixed",
    amenities: ["Long-arm", "Design wall", "Cutting tables", "WiFi"],
    ada: { stepFreeAccess: false, accessibleRoom: false, accessibleBathroom: false, elevator: false },
    experiences: ["Lake swimming", "Local hikes"],
    food: { included: true, style: "family-style", kitchenAccess: true, dietary: ["Vegetarian", "Gluten-free"] },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 200 },
  },
  "adobe-curves-2027": {
    lengthDays: 5,
    focus: "skill-class",
    amenities: ["Design wall", "Cutting tables", "Iron stations", "WiFi"],
    ada: { stepFreeAccess: true, accessibleRoom: true, accessibleBathroom: true, elevator: false },
    experiences: ["Museum tour", "Local hikes", "Stargazing"],
    food: {
      included: true,
      style: "chef",
      kitchenAccess: false,
      dietary: ["Vegetarian", "Vegan", "Gluten-free"],
    },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 225 },
  },
  "magnolia-longarm-2026": {
    lengthDays: 5,
    focus: "skill-class",
    amenities: [
      "Long-arm",
      "Design wall",
      "Cutting tables",
      "Iron stations",
      "Dedicated cutting room",
      "WiFi",
    ],
    ada: { stepFreeAccess: true, accessibleRoom: true, accessibleBathroom: true, elevator: true },
    experiences: ["Museum tour", "Quilt shop hop"],
    food: {
      included: true,
      style: "chef",
      kitchenAccess: false,
      dietary: ["Vegetarian", "Gluten-free", "Dairy-free"],
    },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 350 },
  },
  "sashiko-cascade-2027": {
    lengthDays: 5,
    focus: "skill-class",
    amenities: ["Design wall", "Cutting tables", "Iron stations", "WiFi"],
    ada: { stepFreeAccess: true, accessibleRoom: false, accessibleBathroom: true, elevator: true },
    experiences: ["Ferry day trip", "Museum tour", "Local hikes"],
    food: {
      included: true,
      style: "catered",
      kitchenAccess: true,
      dietary: ["Vegetarian", "Vegan", "Gluten-free"],
    },
    rooming: { privateRoomAvailable: true, sharedOnly: false, privateRoomUpcharge: 275 },
  },
};

export function getExtras(id: string): RetreatExtras | undefined {
  return retreatExtras[id];
}

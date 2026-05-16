import type { RetreatFilters } from "@/lib/quilt-match-retreat-filters";
import { ALL_AMENITIES, ALL_DIETARY, ALL_EXPERIENCES } from "@/data/quiltMatchRetreatExtras";
import { regions, type RegionSlug } from "@/data/quiltMatchHomeRetreats";
import type { ReactNode } from "react";

type Props = {
  filters: RetreatFilters;
  setFilters: (next: RetreatFilters) => void;
  availableStates: string[];
  priceBounds: { min: number; max: number };
};

const REGION_SLUGS: RegionSlug[] = ["northeast", "south", "midwest", "mountain", "west-coast"];
const FOCUSES = [
  { value: "open-sew" as const, label: "Open sew" },
  { value: "skill-class" as const, label: "Skill class" },
  { value: "mixed" as const, label: "Mixed" },
];
const LENGTHS = [
  { value: "1-3" as const, label: "1–3 nights" },
  { value: "4-5" as const, label: "4–5 nights" },
  { value: "6+" as const, label: "6+ nights" },
];
const FOOD_STYLES = [
  { value: "catered" as const, label: "Catered" },
  { value: "chef" as const, label: "Chef-prepared" },
  { value: "family-style" as const, label: "Family-style" },
  { value: "self-cater" as const, label: "Self-cater" },
];

export function RetreatFiltersPanel({ filters, setFilters, availableStates, priceBounds }: Props) {
  function toggleArr<T>(key: keyof RetreatFilters, value: T) {
    const arr = filters[key] as unknown as T[];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setFilters({ ...filters, [key]: next });
  }

  return (
    <aside className="space-y-7 text-sm">
      <Group label="Region">
        <Chip active={filters.region === "all"} onClick={() => setFilters({ ...filters, region: "all" })}>
          All
        </Chip>
        {REGION_SLUGS.map((slug) => (
          <Chip
            key={slug}
            active={filters.region === slug}
            onClick={() => setFilters({ ...filters, region: slug })}
          >
            {regions[slug].label}
          </Chip>
        ))}
      </Group>

      <Group label="State">
        <div className="flex flex-wrap gap-2">
          {availableStates.map((s) => (
            <Chip
              key={s}
              active={filters.states.includes(s)}
              onClick={() => toggleArr("states", s)}
            >
              {s}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label={`Price: $${filters.priceMin} – $${filters.priceMax}`}>
        <div className="space-y-2 w-full">
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            step={50}
            value={filters.priceMin}
            onChange={(e) =>
              setFilters({
                ...filters,
                priceMin: Math.min(Number(e.target.value), filters.priceMax),
              })
            }
            className="w-full"
            aria-label="Minimum price"
          />
          <input
            type="range"
            min={priceBounds.min}
            max={priceBounds.max}
            step={50}
            value={filters.priceMax}
            onChange={(e) =>
              setFilters({
                ...filters,
                priceMax: Math.max(Number(e.target.value), filters.priceMin),
              })
            }
            className="w-full"
            aria-label="Maximum price"
          />
        </div>
      </Group>

      <Group label="Length">
        {LENGTHS.map((l) => (
          <Chip
            key={l.value}
            active={filters.lengths.includes(l.value)}
            onClick={() => toggleArr("lengths", l.value)}
          >
            {l.label}
          </Chip>
        ))}
      </Group>

      <Group label="Class focus">
        {FOCUSES.map((f) => (
          <Chip
            key={f.value}
            active={filters.focuses.includes(f.value)}
            onClick={() => toggleArr("focuses", f.value)}
          >
            {f.label}
          </Chip>
        ))}
      </Group>

      <Group label="Amenities">
        {ALL_AMENITIES.map((a) => (
          <Chip key={a} active={filters.amenities.includes(a)} onClick={() => toggleArr("amenities", a)}>
            {a}
          </Chip>
        ))}
      </Group>

      <Group label="ADA needs">
        <Toggle
          label="Step-free access"
          checked={filters.ada.stepFreeAccess}
          onChange={(v) => setFilters({ ...filters, ada: { ...filters.ada, stepFreeAccess: v } })}
        />
        <Toggle
          label="Accessible room"
          checked={filters.ada.accessibleRoom}
          onChange={(v) => setFilters({ ...filters, ada: { ...filters.ada, accessibleRoom: v } })}
        />
        <Toggle
          label="Accessible bathroom"
          checked={filters.ada.accessibleBathroom}
          onChange={(v) => setFilters({ ...filters, ada: { ...filters.ada, accessibleBathroom: v } })}
        />
        <Toggle
          label="Elevator on-site"
          checked={filters.ada.elevator}
          onChange={(v) => setFilters({ ...filters, ada: { ...filters.ada, elevator: v } })}
        />
      </Group>

      <Group label="Experiences">
        {ALL_EXPERIENCES.map((e) => (
          <Chip key={e} active={filters.experiences.includes(e)} onClick={() => toggleArr("experiences", e)}>
            {e}
          </Chip>
        ))}
      </Group>

      <Group label="Food">
        <TriToggle
          label="Meals included"
          value={filters.foodIncluded}
          onChange={(v) => setFilters({ ...filters, foodIncluded: v })}
        />
        <TriToggle
          label="Kitchen access"
          value={filters.kitchenAccess}
          onChange={(v) => setFilters({ ...filters, kitchenAccess: v })}
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {FOOD_STYLES.map((f) => (
            <Chip
              key={f.value}
              active={filters.foodStyles.includes(f.value)}
              onClick={() => toggleArr("foodStyles", f.value)}
            >
              {f.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_DIETARY.map((d) => (
            <Chip key={d} active={filters.dietary.includes(d)} onClick={() => toggleArr("dietary", d)}>
              {d}
            </Chip>
          ))}
        </div>
      </Group>

      <Group label="Rooming">
        <TriToggle
          label="Private room available"
          value={filters.privateRoomAvailable}
          onChange={(v) => setFilters({ ...filters, privateRoomAvailable: v })}
        />
        <TriToggle
          label="OK with shared room"
          value={filters.okWithSharedRoom}
          onChange={(v) => setFilters({ ...filters, okWithSharedRoom: v })}
        />
      </Group>
    </aside>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 border text-xs transition-colors ${
        active
          ? "border-rust bg-rust text-rust-foreground"
          : "border-border hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 w-full text-xs cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-rust"
      />
      {label}
    </label>
  );
}

function TriToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  const next = value === null ? true : value === true ? false : null;
  const display = value === null ? "Any" : value ? "Yes" : "No";
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      className="flex items-center justify-between w-full border border-border px-2 py-1 text-xs hover:border-foreground/40"
    >
      <span>{label}</span>
      <span className={value === null ? "text-muted-foreground" : "text-rust"}>{display}</span>
    </button>
  );
}

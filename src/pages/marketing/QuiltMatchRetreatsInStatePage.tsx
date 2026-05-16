import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import { QuiltMatchRetreatsBrowseView } from "./QuiltMatchRetreatsBrowseView";
import { allRetreats } from "@/data/quiltMatchHomeRetreats";

export default function QuiltMatchRetreatsInStatePage() {
  const { state } = useParams<{ state: string }>();
  const code = state?.toUpperCase() ?? "";

  const validCodes = useMemo(() => new Set(allRetreats.map((r) => r.state)), []);

  if (!code || code.length !== 2 || !validCodes.has(code)) {
    return <Navigate to="/retreats" replace />;
  }

  const sample = allRetreats.find((r) => r.state === code);

  return (
    <QuiltMatchRetreatsBrowseView
      seedFilters={{ states: [code] }}
      eyebrow={`Retreats · ${code}`}
      title={`Quilt retreats in ${sample?.location.split(",").pop()?.trim() ?? code}.`}
      description="Same marketplace filters as the full US directory — narrowed to this state. Adjust chips anytime."
    />
  );
}

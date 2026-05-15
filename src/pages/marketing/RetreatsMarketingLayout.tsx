import { Outlet } from "react-router-dom";
import { QuiltMatchSiteHeader } from "@/components/quilt-match-home/site-header";
import { QuiltMatchSiteFooter } from "@/components/quilt-match-home/site-footer";

export default function RetreatsMarketingLayout() {
  return (
    <div className="quilt-match-home min-h-screen bg-background text-foreground">
      <QuiltMatchSiteHeader />
      <Outlet />
      <QuiltMatchSiteFooter />
    </div>
  );
}

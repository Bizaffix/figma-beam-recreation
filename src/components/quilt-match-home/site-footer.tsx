import { Link } from "react-router-dom";

type FooterColumn = {
  heading: string;
  links: { label: string; to: string }[];
};

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Explore by region",
    links: [
      { label: "Pacific Northwest", to: "/retreats/in/or" },
      { label: "New England", to: "/retreats/in/vt" },
      { label: "The South", to: "/retreats/in/nc" },
      { label: "Mountain West", to: "/retreats/in/mt" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog & guides", to: "/blog" },
      { label: "Retreat news", to: "/news" },
      { label: "Venue standards", to: "/guides" },
      { label: "Trust & safety", to: "/guides" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/how-it-works" },
      { label: "For Creators", to: "/creators" },
      { label: "For Venue Hosts", to: "/venues" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

export function QuiltMatchSiteFooter() {
  return (
    <footer className="bg-card border-t border-border px-5 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
          <div>
            <Link to="/" className="inline-block mb-5" aria-label="QuiltMatch home">
              <img
                src="/quiltmatch-logo.svg"
                alt="QuiltMatch"
                className="h-8 w-auto object-contain object-left"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
              The marketplace for quilting retreats. Connecting quilters with inspiring creative getaways nationwide.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="text-[11px] uppercase tracking-[0.14em] font-semibold mb-4 text-foreground">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} QuiltMatch · All rights reserved
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

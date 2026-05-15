import { Link } from "react-router-dom";

export function QuiltMatchSiteFooter() {
  return (
    <footer className="bg-foreground text-background py-24 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <span className="font-display text-2xl tracking-tight text-background block mb-6">QuiltMatch</span>
          <p className="text-xs leading-relaxed max-w-xs text-background/85">
            The US marketplace for the modern quilting community. Connecting makers, creators, and venues through the art of the stitch.
          </p>
        </div>
        <div>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] mb-8 text-background/80">Explore by region</h2>
          <ul className="space-y-4 text-sm">
            <li>
              <Link to="/retreats/in/or" className="text-background/90 hover:text-background">
                Pacific Northwest
              </Link>
            </li>
            <li>
              <Link to="/retreats/in/vt" className="text-background/90 hover:text-background">
                New England
              </Link>
            </li>
            <li>
              <Link to="/retreats/in/nc" className="text-background/90 hover:text-background">
                The South
              </Link>
            </li>
            <li>
              <Link to="/retreats/in/mt" className="text-background/90 hover:text-background">
                Mountain West
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] mb-8 text-background/80">Resources</h2>
          <ul className="space-y-4 text-sm">
            <li>
              <Link to="/blog" className="text-background/90 hover:text-background">
                Blog &amp; guides
              </Link>
            </li>
            <li>
              <Link to="/news" className="text-background/90 hover:text-background">
                Retreat news
              </Link>
            </li>
            <li>
              <Link to="/guides" className="text-background/90 hover:text-background">
                Venue standards
              </Link>
            </li>
            <li>
              <Link to="/guides" className="text-background/90 hover:text-background">
                Trust &amp; safety
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] mb-8 text-background/80">Join us</h2>
          <p className="text-sm mb-6 text-background">Sign up for our seasonal journal.</p>
          <div className="border-b border-background/40 pb-2 flex justify-between">
            <span className="text-sm text-background/85">Email address</span>
            <span className="text-xs font-mono uppercase cursor-pointer text-background">Sign up</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-background/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-background/80">© 2026 QuiltMatch. All rights reserved.</span>
        <div className="flex gap-8 text-[10px] font-mono uppercase tracking-widest text-background/80">
          <Link to="/privacy" className="hover:text-background">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-background">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

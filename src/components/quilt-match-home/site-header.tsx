import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const navLinks = [
  { to: "/retreats", label: "Explore Retreats" },
  { to: "/venues", label: "For Venue Hosts" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/creators", label: "Community" },
  { to: "/blog", label: "Blog" },
  { to: "/faq", label: "FAQ" },
] as const;

export function QuiltMatchSiteHeader() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const getDashboardHref = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "instructor") return "/instructor/dashboard";
    if (role === "location_owner") return "/location-owner/dashboard";
    return "/home";
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="relative h-16 w-full px-5 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between">
        <Link to="/" className="relative z-10 flex items-center shrink-0 min-w-0 max-w-[46%] sm:max-w-none" aria-label="QuiltMatch home">
          <img
            src="/quiltmatch-logo.svg"
            alt="QuiltMatch"
            className="h-7 sm:h-8 md:h-9 w-auto max-h-9 object-contain object-left"
          />
        </Link>

        <nav
          className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-4 xl:gap-7 max-w-[min(calc(100%-20rem),52rem)] px-2 pointer-events-none"
          aria-label="Main navigation"
        >
          {navLinks.map((l) => (
            <Link
              key={l.to + l.label}
              to={l.to}
              className="text-sm font-medium tracking-tight text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0 pointer-events-auto"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 hidden lg:flex items-center justify-end gap-4 xl:gap-6 text-sm font-medium shrink-0">
          {loading ? null : user ? (
            <>
              <Link to={getDashboardHref()} className="hover:text-foreground transition-colors text-muted-foreground">
                Dashboard
              </Link>
              <button type="button" onClick={handleSignOut} className="border-b border-foreground/20 pb-0.5 hover:border-foreground transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link to="/signup" className="btn-primary px-4 py-2">
              List Your Space
              </Link>
            </>
          )}
        </div>

        <div className="relative z-10 flex lg:hidden items-center justify-end gap-2 sm:gap-3 shrink-0 min-w-0">
          {loading ? null : user ? null : (
            <>
              <Link
                to="/login"
                className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap py-1.5"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="hidden min-[400px]:inline-flex btn-primary px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap"
              >
                List Your Space
              </Link>
            </>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="p-2 -mr-2 text-foreground hover:text-rust transition-colors"
            >
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-1rem,380px)] max-w-[380px] bg-background border-l border-border p-0">
              <div className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>QuiltMatch site navigation</SheetDescription>
              </div>
              <div className="flex flex-col h-full min-h-0 px-6 sm:px-8 pt-8 pb-8 overflow-y-auto">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center mb-12"
                  aria-label="QuiltMatch home"
                >
                  <img src="/quiltmatch-logo.svg" alt="QuiltMatch" className="h-10 w-auto object-contain object-left" />
                </Link>

                <div className="flex flex-col gap-5 sm:gap-6">
                  {navLinks.map((l) => (
                    <Link
                      key={l.to + l.label}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="font-display text-2xl sm:text-3xl tracking-tight text-foreground hover:text-rust transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-auto pt-8 sm:pt-10 border-t border-border">
                  {loading ? null : user ? (
                    <div className="flex flex-col gap-4 text-sm font-medium">
                      <Link
                        to={getDashboardHref()}
                        onClick={() => setOpen(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="self-start border-b border-foreground/20 pb-0.5 hover:border-foreground transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Link
                        to="/login"
                        onClick={() => setOpen(false)}
                        className="flex-1 text-sm text-center border border-border py-2.5 rounded-[4px] hover:bg-secondary transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setOpen(false)}
                        className="flex-1 btn-primary text-sm text-center py-2.5 rounded-[4px]"
                      >
                        List Your Space
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

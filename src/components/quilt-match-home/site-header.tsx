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
  { to: "/venues", label: "For Hosts" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/creators", label: "Community" },
  { to: "/blog", label: "Blog" },
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
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8 md:gap-10">
          <Link to="/" className="flex items-center shrink-0" aria-label="QuiltMatch home">
            <img
              src="/quiltmatch-logo.svg"
              alt="QuiltMatch"
              className="h-8 sm:h-9 w-auto max-h-9 object-contain object-left"
            />
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium tracking-tight text-muted-foreground">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
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
                Join
              </Link>
            </>
          )}
        </div>

        <div className="flex md:hidden items-center gap-3">
          {!loading && !user && (
            <Link to="/signup" className="btn-primary px-3 py-1.5 text-sm">
              Join
            </Link>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="p-2 -mr-2 text-foreground hover:text-rust transition-colors"
            >
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] sm:w-[380px] bg-background border-l border-border p-0">
              <div className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
                <SheetDescription>QuiltMatch site navigation</SheetDescription>
              </div>
              <div className="flex flex-col h-full px-8 pt-10 pb-8">
                <Link
                  to="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center mb-12"
                  aria-label="QuiltMatch home"
                >
                  <img src="/quiltmatch-logo.svg" alt="QuiltMatch" className="h-10 w-auto object-contain object-left" />
                </Link>

                <div className="flex flex-col gap-6">
                  {navLinks.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="font-display text-3xl tracking-tight text-foreground hover:text-rust transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-auto pt-10 border-t border-border flex flex-col gap-4 text-sm font-medium">
                  {loading ? null : user ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setOpen(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setOpen(false)}
                        className="btn-primary px-4 py-3 text-center"
                      >
                        Join QuiltMatch
                      </Link>
                    </>
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

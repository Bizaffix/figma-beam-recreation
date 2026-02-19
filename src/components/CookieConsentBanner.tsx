import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { hasCookieConsent, acceptCookies, declineCookies } from "@/lib/quiltmatch-tracking";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't responded yet
    if (!hasCookieConsent() && !document.cookie.includes("bmqr_cookie_consent=declined")) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-2xl mx-auto bg-white border border-border/60 rounded-xl shadow-lg p-4 flex items-start gap-4">
        <Cookie className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            We use cookies to save your retreat search and improve your experience.{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => {
              acceptCookies();
              setVisible(false);
            }}
            className="bg-primary hover:bg-primary/90 h-8 px-4 text-xs"
          >
            Got it
          </Button>
          <button
            onClick={() => {
              declineCookies();
              setVisible(false);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

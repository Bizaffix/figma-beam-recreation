import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Share2, Mail, MessageSquare, Link as LinkIcon, Check, Facebook, Instagram, Music2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/quilt-match-home/avatar";
import { CreatorModal, VenueModal, RetreatModal } from "@/components/quilt-match-home/profile-modals";
import type { Retreat } from "@/data/quiltMatchHomeRetreats";
import { toast } from "sonner";

export function ListingCard({ r }: { r: Retreat }) {
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);
  const [retreatOpen, setRetreatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const buildShareUrl = (source: string, medium = "share") => {
    const u = new URL(
      typeof window !== "undefined" ? window.location.origin : "https://example.com",
    );
    u.pathname = `/retreats/${r.region}`;
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", "listing_share");
    u.searchParams.set("utm_content", r.region);
    return u.toString();
  };

  const shareUrl = buildShareUrl("copy", "copy_link");
  const shareSubject = `Quilt retreat: ${r.title}`;
  const buildBody = (url: string) =>
    `Thought you'd love this — ${r.title} at ${r.venue} (${r.dates}, ${r.location}). ${r.price} per quilter.\n\n${url}`;

  const emailUrl = buildShareUrl("email", "email");
  const smsUrl = buildShareUrl("sms", "sms");
  const fbUrl = buildShareUrl("facebook", "social");
  const igUrl = buildShareUrl("instagram", "social");
  const ttUrl = buildShareUrl("tiktok", "social");
  const nativeUrl = buildShareUrl("native", "web_share");

  const mailtoHref = `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(buildBody(emailUrl))}`;
  const smsHref = `sms:?&body=${encodeURIComponent(buildBody(smsUrl))}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fbUrl)}&quote=${encodeURIComponent(shareSubject)}`;

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: shareSubject, text: buildBody(nativeUrl), url: nativeUrl });
    } catch {
      /* user cancelled */
    }
  };

  const handleSocialShare = async (network: "instagram" | "tiktok") => {
    const url = network === "instagram" ? igUrl : ttUrl;
    try {
      await navigator.clipboard.writeText(`${shareSubject}\n${url}`);
      toast.success(
        network === "instagram"
          ? "Link copied — paste into your Instagram story or DM"
          : "Link copied — paste into your TikTok bio or DM",
      );
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <article className="group flex flex-col">
      <button
        type="button"
        onClick={() => setRetreatOpen(true)}
        className="block text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-rust"
        aria-label={`Preview ${r.title} at ${r.venue} — ${r.price}`}
      >
        <div className="aspect-video bg-muted mb-4 overflow-hidden relative">
          <img
            src={r.image}
            alt={`${r.title} at ${r.venue}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
          {r.spotsLeft <= 3 && (
            <span className="absolute top-3 left-3 bg-rust text-rust-foreground text-[10px] font-mono uppercase tracking-wider px-2 py-1">
              {r.spotsLeft} spots left
            </span>
          )}
        </div>
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex -space-x-2">
          <Avatar
            initials={r.creator.initials}
            tone="rust"
            onClick={() => setCreatorOpen(true)}
            ariaLabel={`View profile of ${r.creator.name}`}
          />
          <Avatar
            initials={r.venueProfile.initials}
            tone="match-indigo"
            onClick={() => setVenueOpen(true)}
            ariaLabel={`View venue ${r.venueProfile.name}`}
          />
        </div>
        <div className="text-[11px] leading-tight">
          <button
            type="button"
            onClick={() => setCreatorOpen(true)}
            className="block font-medium hover:text-rust transition-colors text-left"
          >
            {r.creator.name}
          </button>
          <button
            type="button"
            onClick={() => setVenueOpen(true)}
            className="block text-muted-foreground hover:text-match-indigo transition-colors text-left"
          >
            at {r.venueProfile.name}
          </button>
        </div>
      </div>

      <button type="button" onClick={() => setRetreatOpen(true)} className="group/title text-left">
        <h3 className="font-display text-xl mb-1 group-hover/title:text-rust transition-colors">{r.title}</h3>
      </button>
      <p className="text-xs tracking-wide uppercase text-muted-foreground mb-4">
        {r.dates} · {r.location} · {r.skill}
      </p>

      <div className="mt-auto flex items-end justify-between gap-3 pt-3 border-t border-border">
        <div>
          <div className="font-display text-2xl text-rust leading-none">{r.price}</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            per quilter · all-inclusive
          </div>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label={`Share ${r.title}`}
            className="inline-flex items-center justify-center h-9 w-9 border border-border hover:border-rust hover:text-rust transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <Link
            to="/signup"
            className="btn-primary px-4 py-2 text-xs font-medium"
          >
            Register →
          </Link>
        </div>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Share this retreat</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-wider font-mono">
              {r.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center gap-3 px-3 py-3 border border-rust bg-rust/5 hover:bg-rust/10 transition-colors text-left"
              >
                <Send className="h-4 w-4 text-rust" />
                <span className="text-sm font-medium">Share via device…</span>
              </button>
            )}
            <a
              href={mailtoHref}
              className="flex items-center gap-3 px-3 py-3 border border-border hover:border-rust hover:bg-rust/5 transition-colors"
            >
              <Mail className="h-4 w-4 text-rust" />
              <span className="text-sm">Email</span>
            </a>
            <a
              href={smsHref}
              className="flex items-center gap-3 px-3 py-3 border border-border hover:border-rust hover:bg-rust/5 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-rust" />
              <span className="text-sm">Text message</span>
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-3 px-3 py-3 border border-border hover:border-rust hover:bg-rust/5 transition-colors text-left"
            >
              {copied ? (
                <Check className="h-4 w-4 text-sage" />
              ) : (
                <LinkIcon className="h-4 w-4 text-rust" />
              )}
              <span className="text-sm">{copied ? "Link copied" : "Copy link"}</span>
            </button>
            <a
              href={facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-3 border border-border hover:border-rust hover:bg-rust/5 transition-colors"
            >
              <Facebook className="h-4 w-4 text-rust" />
              <span className="text-sm">Facebook</span>
            </a>
            <button
              type="button"
              onClick={() => handleSocialShare("instagram")}
              className="flex items-center gap-3 px-3 py-3 border border-border hover:border-rust hover:bg-rust/5 transition-colors text-left"
            >
              <Instagram className="h-4 w-4 text-rust" />
              <span className="text-sm">Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialShare("tiktok")}
              className="flex items-center gap-3 px-3 py-3 border border-border hover:border-rust hover:bg-rust/5 transition-colors text-left"
            >
              <Music2 className="h-4 w-4 text-rust" />
              <span className="text-sm">TikTok</span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono break-all pt-2 border-t border-border">
            {shareUrl}
          </p>
        </DialogContent>
      </Dialog>

      <CreatorModal retreat={r} open={creatorOpen} onOpenChange={setCreatorOpen} />
      <VenueModal retreat={r} open={venueOpen} onOpenChange={setVenueOpen} />
      <RetreatModal retreat={r} open={retreatOpen} onOpenChange={setRetreatOpen} />
    </article>
  );
}

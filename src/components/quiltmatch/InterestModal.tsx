import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Send, Heart, Shield } from "lucide-react";
import { expressInterest } from "@/services/server/quiltmatch/discover";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { DraftListing } from "@/types/draft-listing";

interface InterestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: DraftListing;
  onSuccess: () => void;
}

export function InterestModal({ open, onOpenChange, listing, onSuccess }: InterestModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [contactPref, setContactPref] = useState<"platform" | "email">("platform");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() && !user) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const result = await expressInterest({
        draft_listing_id: listing.id,
        student_name: name || undefined,
        student_email: email || undefined,
        student_message: message || undefined,
        contact_preference: contactPref,
      });

      toast({
        title: result.email_sent ? "Interest sent & organizer notified!" : "Interest saved!",
        description: result.message,
      });
      onSuccess();
    } catch (err) {
      console.error("Express interest error:", err);
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent" />
            Express Interest
          </DialogTitle>
          <DialogDescription>
            We'll send <strong>{listing.organizer_name || "the organizer"}</strong> an
            invitation to claim this listing and connect with you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Name */}
          {!user && (
            <div>
              <Label className="text-sm" htmlFor="interest-name">
                Your Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="interest-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah"
                className="mt-1"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <Label className="text-sm" htmlFor="interest-email">
              Email (optional)
            </Label>
            <Input
              id="interest-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              type="email"
              className="mt-1"
            />
          </div>

          {/* Message */}
          <div>
            <Label className="text-sm" htmlFor="interest-message">
              Message to the organizer (optional)
            </Label>
            <Textarea
              id="interest-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! We're a group of 8 looking for March 2026, private rooms preferred..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Contact preference */}
          <div>
            <Label className="text-sm mb-2 block">
              How should they reach you?
            </Label>
            <RadioGroup
              value={contactPref}
              onValueChange={(v) => setContactPref(v as "platform" | "email")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="platform" id="pref-platform" />
                <Label htmlFor="pref-platform" className="text-sm text-muted-foreground cursor-pointer">
                  Through the platform
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="email" id="pref-email" />
                <Label htmlFor="pref-email" className="text-sm text-muted-foreground cursor-pointer">
                  Via email
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Privacy note */}
          <div className="flex items-start gap-2 bg-muted/40 rounded-lg p-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Your contact info won't be shared with the organizer until they claim
              their listing and you choose to connect.
            </p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={sending || (!name.trim() && !user)}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Send Interest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

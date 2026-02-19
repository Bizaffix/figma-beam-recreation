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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Heart, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { saveStudentContext } from "@/lib/quiltmatch-tracking";
import { getPersonalityId, getDreamSentence } from "@/lib/quiltmatch-tracking";
import { PERSONALITY_TYPES } from "@/data/retreater-personality";

interface ExitIntentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function ExitIntentModal({ open, onOpenChange, onSaved }: ExitIntentModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [alertMe, setAlertMe] = useState(true);
  const [saving, setSaving] = useState(false);

  const personalityId = getPersonalityId();
  const personality = PERSONALITY_TYPES.find((p) => p.id === personalityId);
  const dream = getDreamSentence();

  const handleSave = async () => {
    if (!email.trim()) {
      toast({ title: "Please enter your email", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      saveStudentContext({ name: name.trim(), email: email.trim() });

      // Save to student_query_log or a leads table
      await supabase.from("student_query_log").insert({
        raw_query: dream || "Exit intent capture",
        student_name: name.trim() || null,
        student_email: email.trim(),
        session_id: null,
        parsed_filters_json: {
          personality_type: personalityId || null,
          alert_new_matches: alertMe,
          capture_type: "exit_intent",
        },
      });

      toast({
        title: "Results saved!",
        description: "We'll email you when new retreats match your vibe.",
      });
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error("Exit intent save error:", err);
      toast({ title: "Saved locally", description: "Your results are saved in this browser." });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent" />
            Don't lose your retreat matches
          </DialogTitle>
          <DialogDescription>
            Create a free profile in 10 seconds and we'll save your results,
            plus send you alerts when new retreats match your vibe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Personality preview */}
          {personality && (
            <div className={`rounded-xl p-3 bg-gradient-to-br ${personality.gradient} text-white flex items-center gap-3`}>
              <span className="text-2xl">{personality.emoji}</span>
              <div>
                <p className="font-semibold text-sm">{personality.name}</p>
                <p className="text-xs text-white/80">{personality.tagline}</p>
              </div>
            </div>
          )}

          {!personality && dream && (
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-sm text-foreground italic line-clamp-2">"{dream}"</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm" htmlFor="exit-email">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="exit-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                type="email"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm" htmlFor="exit-name">
                What should we call you?
              </Label>
              <Input
                id="exit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah"
                className="mt-1"
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="exit-alert"
                checked={alertMe}
                onCheckedChange={(v) => setAlertMe(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="exit-alert" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                Alert me when new retreats match my{" "}
                {personality ? personality.name : "search"} vibe
              </Label>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-start gap-2 bg-muted/40 rounded-lg p-3">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              We'll never spam you. Just retreat matches and updates you asked for.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !email.trim()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Heart className="w-4 h-4 mr-2" />
              )}
              Save my results
            </Button>
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              No thanks, I'll lose my matches
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

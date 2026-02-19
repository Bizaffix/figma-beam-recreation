import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { getPersonalityId, getDreamSentence, getProgress } from "@/lib/quiltmatch-tracking";
import { PERSONALITY_TYPES } from "@/data/retreater-personality";
import type { ProgressStage } from "@/lib/quiltmatch-tracking";

interface WelcomeBackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResume: () => void;
  onStartFresh: () => void;
}

const stageLabels: Record<ProgressStage, string> = {
  not_started: "",
  screen_1_complete: "your dream sentence",
  screen_2_complete: "your vibe check answers",
  screen_3_complete: "your Retreater Personality",
  screen_4_complete: "your retreat matches",
};

export function WelcomeBackModal({ open, onOpenChange, onResume, onStartFresh }: WelcomeBackModalProps) {
  const progress = getProgress();
  const dream = getDreamSentence();
  const personalityId = getPersonalityId();
  const personality = PERSONALITY_TYPES.find((p) => p.id === personalityId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            Welcome back!
          </DialogTitle>
          <DialogDescription>
            We saved your retreat search. Want to pick up where you left off?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Show what we saved */}
          {personality && (
            <div className={`rounded-xl p-4 bg-gradient-to-br ${personality.gradient} text-white`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{personality.emoji}</span>
                <div>
                  <p className="font-semibold">{personality.name}</p>
                  <p className="text-sm text-white/80">Your Retreater Personality</p>
                </div>
              </div>
            </div>
          )}

          {dream && !personality && (
            <div className="bg-muted/40 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your dream</p>
              <p className="text-sm text-foreground italic line-clamp-2">"{dream}"</p>
            </div>
          )}

          {stageLabels[progress] && (
            <p className="text-sm text-muted-foreground">
              We saved {stageLabels[progress]}. Continue right where you stopped.
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => {
                onResume();
                onOpenChange(false);
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Yes, show my results
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                onStartFresh();
                onOpenChange(false);
              }}
              className="w-full text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start fresh
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

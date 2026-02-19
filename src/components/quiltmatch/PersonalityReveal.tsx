import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Share2, Download, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PersonalityType } from "@/data/retreater-personality";

interface PersonalityRevealProps {
  personality: PersonalityType;
  onContinueToResults: () => void;
}

export function PersonalityReveal({ personality, onContinueToResults }: PersonalityRevealProps) {
  const { toast } = useToast();
  const badgeRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const shareText = `I'm "${personality.name}" on BookMyQuiltRetreat.com!\n\n${personality.tagline}\n\nTake the quiz: ${window.location.origin}/find`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `My Retreater Personality: ${personality.name}`,
          text: shareText,
          url: `${window.location.origin}/find`,
        });
      } catch {
        // User cancelled or not supported
        await copyToClipboard(shareText);
      }
    } else {
      await copyToClipboard(shareText);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!", description: "Share it with your quilting friends." });
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Reveal animation wrapper */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Badge card */}
        <div ref={badgeRef} className="mb-8">
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className={`bg-gradient-to-br ${personality.gradient} p-8 pb-6`}>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-white mb-6">
                <Sparkles className="w-4 h-4" />
                Your Retreater Personality
              </div>
              <div className="text-7xl mb-4">{personality.emoji}</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {personality.name}
              </h2>
              <p className="text-white/90 text-lg italic max-w-md mx-auto">
                "{personality.tagline}"
              </p>
            </div>
            <CardContent className="p-6 md:p-8 space-y-6 bg-white">
              {/* Description */}
              <p className="text-muted-foreground leading-relaxed">
                {personality.description}
              </p>

              {/* What you need */}
              <div className="text-left">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  What you need in a retreat
                </h4>
                <ul className="space-y-2">
                  {personality.needsInRetreat.map((need, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      {need}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Retreats that feel like home */}
              <div className="bg-primary/5 rounded-xl p-4 text-left">
                <p className="text-sm font-medium text-primary mb-1">
                  Retreats that feel like home to you
                </p>
                <p className="text-sm text-muted-foreground">
                  {personality.retreatsFeelLikeHome}
                </p>
              </div>

              {/* Branding */}
              <p className="text-xs text-muted-foreground">
                BookMyQuiltRetreat.com
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <Button
            onClick={onContinueToResults}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-lg px-8 w-full sm:w-auto"
          >
            Find my matching retreats
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={handleShare}
              className="border-primary/30 text-primary hover:bg-primary/5"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share my personality
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Your quiz answers help us find better matches — they're never shared.
          </p>
        </div>
      </div>
    </div>
  );
}

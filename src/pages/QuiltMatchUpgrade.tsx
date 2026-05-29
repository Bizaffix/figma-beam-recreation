import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAiSubscriptionCheckout } from "@/services/server/quiltmatch/ai-subscription";
import { Header } from "@/components/Header";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";

export default function QuiltMatchUpgrade() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings: platformSettings } = usePlatformSettings();
  const aiMonthlyPrice = platformSettings?.ai_subscription_monthly_price ?? 3.99;

  const startCheckout = async () => {
    setLoading(true);
    try {
      const url = await createAiSubscriptionCheckout("/find");
      window.location.href = url;
    } catch (error: any) {
      toast({
        title: "Unable to start checkout",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <Card className="max-w-2xl mx-auto border-[#459394]/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-[#459394]/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#387C7F]" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Unlock QuiltMatch AI</CardTitle>
            <CardDescription className="text-base">
              Personalized retreat matching for <span className="font-semibold">${aiMonthlyPrice.toFixed(2)}/month</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="space-y-3 text-sm sm:text-base">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#459394] mt-0.5" />
                Dream-builder + personality quiz powered matching
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#459394] mt-0.5" />
                Better-fit recommendations from your vibe and preferences
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#459394] mt-0.5" />
                Cancel anytime from your billing portal
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-[#459394] hover:bg-[#387C7F] text-white"
                onClick={startCheckout}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Start ${aiMonthlyPrice.toFixed(2)}/month plan
              </Button>
              <Button variant="outline" onClick={() => navigate("/browse")}>
                Keep browsing free listings
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


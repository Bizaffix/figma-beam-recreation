import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";

export default function QuiltMatchSubscriptionSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Subscription started</h1>
            <p className="text-muted-foreground">
              Your QuiltMatch AI access is being activated. If access does not unlock immediately, refresh after a few seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={() => navigate("/find")} className="bg-[#459394] hover:bg-[#387C7F] text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Go to QuiltMatch AI
              </Button>
              <Button variant="outline" onClick={() => navigate("/browse")}>
                Back to browse
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Facebook, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreat: {
    id: number;
    title: string;
    description: string;
    image: string;
    price: number;
    location: string;
    date: string;
    url: string;
  };
}

export const ShareDialog = ({ open, onOpenChange, retreat }: ShareDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(retreat.url);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Retreat link copied to clipboard. You can now paste it anywhere!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFacebookShare = () => {
    // Facebook share URL with all retreat details
    const shareText = `${retreat.title}\n\n${retreat.description}\n\n📍 ${retreat.location}\n📅 ${retreat.date}\n💰 $${retreat.price}\n\n`;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(retreat.url)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookShareUrl, "_blank", "width=600,height=400");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Retreat</DialogTitle>
          <DialogDescription>
            Share this retreat on social media or copy the link to share anywhere.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Retreat Preview */}
          <div className="border rounded-lg overflow-hidden bg-muted/50">
            <div className="relative h-32">
              <img
                src={retreat.image || "/placeholder.svg"}
                alt={retreat.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3 space-y-1">
              <h3 className="font-semibold text-sm line-clamp-2">{retreat.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{retreat.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>📍 {retreat.location}</span>
                <span className="font-semibold text-primary">${retreat.price}</span>
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-2">
            <Button
              onClick={handleFacebookShare}
              className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white"
              size="lg"
            >
              <Facebook className="w-5 h-5 mr-2" />
              Share on Facebook
            </Button>
            
            <div className="space-y-2">
              <Label htmlFor="retreat-link">Or copy link</Label>
              <div className="flex gap-2">
                <Input
                  id="retreat-link"
                  value={retreat.url}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p className="font-medium mb-1">What gets shared:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Retreat title and description</li>
              <li>Retreat image</li>
              <li>Location, date, and price</li>
              <li>Direct link to retreat page</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


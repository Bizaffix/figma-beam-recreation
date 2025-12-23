import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";

// Simple Facebook icon SVG
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);
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
    date?: string;
  };
  userId?: string;
}

export function ShareDialog({ open, onOpenChange, retreat, userId }: ShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const retreatLink = `${window.location.origin}/retreat/${retreat.id}${userId ? `?ref=${userId}` : ''}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(retreatLink);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Retreat link copied to clipboard. You can now paste it anywhere.",
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
    // Create a formatted description with key details
    const shareDescription = `${retreat.title}\n\n${retreat.description.substring(0, 200)}${retreat.description.length > 200 ? '...' : ''}\n\n📍 ${retreat.location}${retreat.date ? `\n📅 ${retreat.date}` : ''}\n💰 $${retreat.price}`;
    
    // Facebook Share Dialog URL
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(retreatLink)}`;
    
    // Open Facebook share dialog in a new window
    window.open(
      facebookShareUrl,
      'facebook-share-dialog',
      'width=626,height=436,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes'
    );
    
    toast({
      title: "Opening Facebook...",
      description: "Share this retreat on your Facebook page or profile.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Retreat</DialogTitle>
          <DialogDescription>
            Share "{retreat.title}" on social media or copy the link
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {/* Facebook Share Button */}
          <Button
            onClick={handleFacebookShare}
            className="w-full justify-start bg-[#1877F2] hover:bg-[#166FE5] text-white"
            size="lg"
          >
            <FacebookIcon className="w-5 h-5 mr-3" />
            Share on Facebook
          </Button>

          {/* Copy Link Button */}
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full justify-start"
            size="lg"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 mr-3 text-green-600" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 mr-3" />
                Copy Link
              </>
            )}
          </Button>

          {/* Preview Info */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              When you share this link, it will include:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Retreat image and title</li>
              <li>• Description and details</li>
              <li>• Location and price</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


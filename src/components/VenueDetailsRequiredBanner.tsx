import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useVenueCompleteness } from "@/hooks/useVenueCompleteness";

interface VenueDetailsRequiredBannerProps {
  venueId: string;
  onDismiss?: () => void;
}

export const VenueDetailsRequiredBanner = ({ venueId, onDismiss }: VenueDetailsRequiredBannerProps) => {
  const { isComplete, validation, loading } = useVenueCompleteness(venueId);

  if (loading || isComplete) {
    return null;
  }

  const missingCount = validation?.missingFields.length || 0;

  return (
    <Card className="border-orange-200 bg-orange-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-orange-900 mb-1">
              Venue Details Required to complete profile
            </h4>
            <p className="text-sm text-orange-800 mb-3">
              To make booking an individual bed a more friendly, transparent process, we've added Room and Bed details to Venue listings. 
              {missingCount > 0 && ` You have ${missingCount} missing field(s).`}
            </p>
            <Button
              asChild
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Link to={`/location-owner/properties/${venueId}/edit`}>
                Update Venue Listing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-orange-700 hover:text-orange-900"
            >
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

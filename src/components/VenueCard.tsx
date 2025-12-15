import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Users, Settings, ChevronDown, ChevronUp } from "lucide-react";

interface VenueCardProps {
  id: string;
  name: string;
  location: string;
  description: string;
  photos: string[];
  sleeps: number;
  max_quilters: number;
  status: 'draft' | 'published' | 'verified';
  views: number;
  saves: number;
  inquiries: number;
  onSelect?: (id: string) => void;
}

export const VenueCard = ({
  id,
  name,
  location,
  description,
  photos,
  sleeps,
  max_quilters,
  status,
  views,
  saves,
  inquiries,
  onSelect,
}: VenueCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const mainImage = photos[0] || "/placeholder.svg";

  const statusColors = {
    draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    published: "bg-green-100 text-green-700 hover:bg-green-100",
    verified: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const shouldShowExpandButton = description.length > 150;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Main Image */}
      <div className="relative">
        <img
          src={mainImage}
          alt={name}
          className="w-full h-48 object-cover"
        />
        <Badge className={`absolute top-3 right-3 ${statusColors[status]}`}>
          {status}
        </Badge>
        {/* Edit Button */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="absolute top-3 left-3 bg-white/90 hover:bg-white"
        >
          <Link to={`/location-owner/properties/${id}/edit`}>
            <Settings className="w-4 h-4" />
          </Link>
        </Button>
      </div>
      
      <CardContent className="p-5 space-y-4">
        {/* Title and Location */}
        <div>
          <h3 className="text-xl font-semibold text-card-foreground mb-2">{name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            Sleeps {sleeps}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Max {max_quilters} quilters
          </Badge>
          <Badge variant="outline" className="text-xs">
            {views} views
          </Badge>
          <Badge variant="outline" className="text-xs">
            {saves} saves
          </Badge>
          <Badge variant="outline" className="text-xs">
            {inquiries} inquiries
          </Badge>
        </div>

        {/* Expandable Description */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isExpanded ? description : truncateText(description, 150)}
          </p>
          {shouldShowExpandButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto text-primary text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Show more
                </>
              )}
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button 
            variant="link" 
            className="text-primary p-0 h-auto"
            onClick={() => onSelect?.(id)}
          >
            View Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link to={`/location-owner/properties/${id}/edit`}>
              Edit Venue
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

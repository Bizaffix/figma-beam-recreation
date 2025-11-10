import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users } from "lucide-react";

interface RetreatCardProps {
  image: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  instructor: {
    name: string;
    avatar: string;
  };
  location: string;
  date: string;
  duration: string;
  spotsAvailable: number;
  totalSpots: number;
  price: number;
}

export const RetreatCard = ({
  image,
  level,
  title,
  instructor,
  location,
  date,
  duration,
  spotsAvailable,
  totalSpots,
  price,
}: RetreatCardProps) => {
  const levelColors = {
    Beginner: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    Intermediate: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    Advanced: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover"
        />
        <Badge className={`absolute top-3 right-3 ${levelColors[level]}`}>
          {level}
        </Badge>
      </div>
      
      <div className="p-5 space-y-4">
        <h3 className="text-xl font-semibold text-card-foreground">{title}</h3>
        
        <div className="flex items-center gap-2">
          <img
            src={instructor.avatar}
            alt={instructor.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-sm text-muted-foreground">
            with {instructor.name}
          </span>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{date} • {duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{spotsAvailable} of {totalSpots} spots available</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-bold text-primary">${price}</span>
          <Button variant="link" className="text-primary">
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

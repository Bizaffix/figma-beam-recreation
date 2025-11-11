import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Users, Clock, Heart } from "lucide-react";
import { getRetreatById } from "@/data/retreats";

const RetreatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch retreat by id from centralized data
  const retreat = getRetreatById(Number(id));

  if (!retreat) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Retreat Not Found</h1>
          <Button onClick={() => navigate("/")}>Back to Retreats</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header Image */}
      <div className="relative">
        <img
          src={retreat.image}
          alt={retreat.title}
          className="w-full h-80 object-cover"
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 rounded-full"
        >
          <Heart className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-4xl mx-auto space-y-6 pt-4">
        {/* Main Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className="mb-3 bg-amber-100 text-amber-700 hover:bg-amber-100">
                  {retreat.level}
                </Badge>
                <h1 className="text-3xl font-bold text-card-foreground mb-2">
                  {retreat.title}
                </h1>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">${retreat.price}</p>
              </div>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3 py-6 border-y border-border">
              <img
                src={retreat.instructor.avatar}
                alt={retreat.instructor.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-card-foreground">{retreat.instructor.name}</p>
                <p className="text-sm text-muted-foreground">Instructor</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium text-card-foreground">{retreat.location}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="text-xs text-muted-foreground">Dates</p>
                  <p className="text-sm font-medium text-card-foreground">{retreat.date}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium text-card-foreground">{retreat.duration}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <div>
                  <p className="text-xs text-muted-foreground">Availability</p>
                  <p className="text-sm font-medium text-card-foreground">
                    {retreat.spotsAvailable} of {retreat.totalSpots} spots
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-3">About This Retreat</h2>
            <p className="text-muted-foreground leading-relaxed">{retreat.description}</p>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-3">What's Included</h2>
            <ul className="space-y-2">
              {retreat.includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-primary mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-3">Schedule</h2>
            <div className="space-y-3">
              {retreat.schedule.map((item, idx) => (
                <div key={idx} className="pb-3 border-b border-border last:border-0 last:pb-0">
                  <p className="font-semibold text-card-foreground mb-1">{item.day}</p>
                  <p className="text-sm text-muted-foreground">{item.activities}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* About Instructor */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-3">About the Instructor</h2>
            <div className="flex items-start gap-4">
              <img
                src={retreat.instructor.avatar}
                alt={retreat.instructor.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-card-foreground mb-1">{retreat.instructor.name}</p>
                <p className="text-sm text-muted-foreground">{retreat.instructor.bio}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
          <div className="max-w-4xl mx-auto">
            <Button
              className="w-full h-12 text-lg"
              onClick={() => navigate(`/retreat/${id}/book`, { state: { retreat } })}
            >
              Book This Retreat - ${retreat.price}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetreatDetail;

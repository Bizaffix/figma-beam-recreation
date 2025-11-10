import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Users, Clock, Heart } from "lucide-react";

const RetreatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - in real app, fetch based on id
  const retreat = {
    image: "https://images.unsplash.com/photo-1706614452468-d9d7c5b967b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWlsdGluZyUyMGZhYnJpYyUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDM4NTc4NXww&ixlib=rb-4.1.0&q=80&w=1080",
    level: "Intermediate",
    title: "Modern Quilting Techniques",
    instructor: {
      name: "Emma Thompson",
      avatar: "https://images.unsplash.com/photo-1543430720-fa600c67e423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&h=100",
      bio: "Emma has been teaching quilting for over 15 years and specializes in modern techniques. She's passionate about helping students discover their unique quilting style."
    },
    location: "Burlington, Vermont",
    date: "Nov 5-8, 2025",
    duration: "4 days",
    spotsAvailable: 3,
    totalSpots: 12,
    price: 850,
    description: "Join us for an immersive 4-day retreat focused on modern quilting techniques. You'll learn innovative piecing methods, explore contemporary color theory, and create stunning modern quilt designs.",
    includes: [
      "All materials and fabric",
      "Daily breakfast and lunch",
      "Accommodation at the retreat center",
      "Access to professional sewing equipment",
      "Take-home project kit"
    ],
    schedule: [
      { day: "Day 1", activities: "Introduction, Color Theory, and Design Basics" },
      { day: "Day 2", activities: "Modern Piecing Techniques and Pattern Work" },
      { day: "Day 3", activities: "Advanced Methods and Personal Project" },
      { day: "Day 4", activities: "Finishing Touches and Showcase" }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header Image */}
      <div className="relative">
        <img
          src={retreat.image}
          alt={retreat.title}
          className="w-full h-64 object-cover"
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
      <div className="px-6 -mt-8 max-w-4xl mx-auto space-y-6">
        {/* Main Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
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
            <div className="flex items-center gap-3 py-4 border-y border-border">
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

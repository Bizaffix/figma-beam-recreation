import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRetreatById } from "@/data/retreats";

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  // Try to get retreat from navigation state first, then fetch by id
  const retreatFromState = (location.state as any)?.retreat;
  const retreat = retreatFromState ?? getRetreatById(Number(id));

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

  // Simple form state
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [skillLevel, setSkillLevel] = React.useState("");

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      <div className="px-6 max-w-4xl mx-auto space-y-6 pt-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={retreat.image} alt={retreat.title} className="w-20 h-16 rounded-md object-cover" />
              <div>
                <p className="font-semibold text-card-foreground">{retreat.title}</p>
                <p className="text-sm text-muted-foreground">{retreat.date}</p>
                <p className="text-sm text-muted-foreground">{retreat.location}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">${retreat.price}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div>
                <Label>Email Address</Label>
                <Input placeholder="your.email@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <Label>Your Skill Level</Label>
                <Input placeholder="e.g., Beginner, Intermediate" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Retreat price</span>
                <span>${retreat.price}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Service fee</span>
                <span>$0</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-card-foreground">
                <span>Total</span>
                <span className="text-primary">${retreat.price}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="fixed bottom-4 left-0 right-0 px-6">
          <div className="max-w-4xl mx-auto">
          <Button
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            onClick={() =>
              navigate(`/retreat/${id}/payment`, {
                state: {
                  retreat,
                  booking: { fullName, email, skillLevel },
                },
              })
            }
          >
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Booking;

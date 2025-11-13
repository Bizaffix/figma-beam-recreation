import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

interface RetreatData {
  id: number;
  title: string;
  location: string;
  date: string;
  price: number;
  spots_available: number;
  total_spots: number;
  published: boolean;
  image: string;
}

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [retreat, setRetreat] = useState<RetreatData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state - must be declared before any conditional returns
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  
  // Form validation errors
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    skillLevel: "",
  });
  
  // Validation function
  const validateForm = () => {
    const newErrors = {
      fullName: "",
      email: "",
      skillLevel: "",
    };
    
    let isValid = true;
    
    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
      isValid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address";
        isValid = false;
      }
    }
    
    // Validate skill level
    if (!skillLevel.trim()) {
      newErrors.skillLevel = "Skill level is required";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle field blur for real-time validation
  const handleBlur = (field: 'fullName' | 'email' | 'skillLevel') => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'fullName':
        if (!fullName.trim()) {
          newErrors.fullName = "Full name is required";
        } else if (fullName.trim().length < 2) {
          newErrors.fullName = "Full name must be at least 2 characters";
        } else {
          newErrors.fullName = "";
        }
        break;
      case 'email':
        if (!email.trim()) {
          newErrors.email = "Email is required";
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
            newErrors.email = "Please enter a valid email address";
          } else {
            newErrors.email = "";
          }
        }
        break;
      case 'skillLevel':
        if (!skillLevel.trim()) {
          newErrors.skillLevel = "Skill level is required";
        } else {
          newErrors.skillLevel = "";
        }
        break;
    }
    
    setErrors(newErrors);
  };
  
  // Handle form submission
  const handleContinue = () => {
    if (validateForm()) {
      navigate(`/retreat/${id}/payment`, {
        state: {
          retreat,
          booking: { fullName: fullName.trim(), email: email.trim(), skillLevel: skillLevel.trim() },
        },
      });
    }
  };

  // Try to get retreat from navigation state first, then fetch by id
  useEffect(() => {
    const retreatFromState = (location.state as any)?.retreat;
    
    if (retreatFromState) {
      // Transform if needed
      const transformed = {
        id: retreatFromState.id,
        title: retreatFromState.title,
        location: retreatFromState.location,
        date: retreatFromState.date,
        price: retreatFromState.price,
        spots_available: retreatFromState.spots_available || retreatFromState.spotsAvailable,
        total_spots: retreatFromState.total_spots || retreatFromState.totalSpots,
        published: retreatFromState.published,
        image: retreatFromState.image,
      };
      setRetreat(transformed);
      setLoading(false);
    } else if (id) {
      // Fetch from Supabase
      const fetchRetreat = async () => {
        try {
          const { data, error } = await supabase
            .from('retreats')
            .select('id, title, location, date, price, spots_available, total_spots, published, image')
            .eq('id', Number(id))
            .eq('published', true)
            .single();

          if (error) {
            console.error('Error fetching retreat:', error);
          } else if (data) {
            setRetreat(data);
          }
        } catch (error) {
          console.error('Unexpected error:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchRetreat();
    } else {
      setLoading(false);
    }
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading retreat details...</p>
        </div>
      </div>
    );
  }

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

  // Students can only book published retreats
  if (!retreat.published) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Retreat Not Available</h1>
          <p className="text-muted-foreground mb-4">This retreat is not published yet.</p>
          <Button onClick={() => navigate("/")}>Back to Retreats</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      <div className="px-6 max-w-4xl mx-auto space-y-6 pt-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={retreat.image || "/placeholder.svg"} alt={retreat.title} className="w-20 h-16 rounded-md object-cover" />
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
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors({ ...errors, fullName: "" });
                    }
                  }}
                  onBlur={() => handleBlur('fullName')}
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  placeholder="your.email@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: "" });
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="skillLevel">Your Skill Level *</Label>
                <Input
                  id="skillLevel"
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                  value={skillLevel}
                  onChange={(e) => {
                    setSkillLevel(e.target.value);
                    if (errors.skillLevel) {
                      setErrors({ ...errors, skillLevel: "" });
                    }
                  }}
                  onBlur={() => handleBlur('skillLevel')}
                  className={errors.skillLevel ? "border-destructive" : ""}
                />
                {errors.skillLevel && (
                  <p className="text-sm text-destructive mt-1">{errors.skillLevel}</p>
                )}
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
            onClick={handleContinue}
          >
            Continue to Payment
          </Button>
          {(errors.fullName || errors.email || errors.skillLevel) && (
            <p className="text-sm text-destructive text-center mt-2">
              Please fill in all required fields correctly
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;

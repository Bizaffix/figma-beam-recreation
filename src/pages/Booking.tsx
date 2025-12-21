import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

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
  deposit_amount?: number | null;
  deposit_refundable?: boolean | null;
  deposit_refund_days_before?: number | null;
  payment_days_before_event?: number | null;
  full_payment_non_refundable?: boolean | null;
  discount_coupon?: string | null;
  price_variants?: { id: string; name: string; price: number; description?: string }[] | null;
  add_ons?: { id: string; name: string; price: number; description?: string; required?: boolean }[] | null;
}

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [retreat, setRetreat] = useState<RetreatData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state - must be declared before any conditional returns
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Any" | "Beginner" | "Intermediate" | "Advanced" | "">("");
  const [selectedPriceVariant, setSelectedPriceVariant] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  
  // Form validation errors
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    skillLevel: "",
    priceVariant: "",
  });
  
  // Price calculation function
  const calculateTotalPrice = () => {
    let basePrice = retreat?.price || 0;
    
    // Use selected price variant if available
    if (retreat?.price_variants && retreat.price_variants.length > 0 && selectedPriceVariant) {
      const variant = retreat.price_variants.find(v => v.id === selectedPriceVariant);
      if (variant) {
        basePrice = variant.price;
      }
    }
    
    // Add selected add-ons
    let addOnsTotal = 0;
    if (retreat?.add_ons) {
      retreat.add_ons.forEach(addOn => {
        if (addOn.required || selectedAddOns.includes(addOn.id)) {
          addOnsTotal += addOn.price;
        }
      });
    }
    
    return basePrice + addOnsTotal;
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {
      fullName: "",
      email: "",
      skillLevel: "",
      priceVariant: "",
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
    if (!skillLevel) {
      newErrors.skillLevel = "Skill level is required";
      isValid = false;
    }
    
    // Validate price variant if available
    if (retreat?.price_variants && retreat.price_variants.length > 0 && !selectedPriceVariant) {
      newErrors.priceVariant = "Please select a pricing option";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  useEffect(() => {
    // Auto-select required add-ons when retreat data loads
    if (retreat?.add_ons) {
      const requiredAddOns = retreat.add_ons.filter(addOn => addOn.required).map(addOn => addOn.id);
      setSelectedAddOns(requiredAddOns);
    }
  }, [retreat]);

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
        if (!skillLevel) {
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
          booking: { 
            fullName: fullName.trim(), 
            email: email.trim(), 
            skillLevel: skillLevel,
            price_variant: selectedPriceVariant,
            selected_add_ons: selectedAddOns
          },
        },
      });
    }
  };

  // Fetch user profile to auto-fill name and email
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        } else if (data) {
          if (data.full_name) {
            setFullName(data.full_name);
          }
          if (data.email || user.email) {
            setEmail(data.email || user.email || "");
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

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
            .select('*')
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
          <Button onClick={() => navigate("/browse")}>Back to Retreats</Button>
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
          <Button onClick={() => navigate("/browse")}>Back to Retreats</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      <div className="px-4 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 sm:pt-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <img 
                  src={retreat.image || "/placeholder.svg"} 
                  alt={retreat.title} 
                  className="w-16 h-12 sm:w-20 sm:h-16 rounded-md object-cover flex-shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground text-sm sm:text-base truncate">{retreat.title}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{retreat.date}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{retreat.location}</p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                {retreat.price_variants && retreat.price_variants.length > 0 ? (
                  <div>
                    <p className="text-base sm:text-lg font-bold text-primary">
                      ${calculateTotalPrice().toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPriceVariant ? 
                        retreat.price_variants.find(v => v.id === selectedPriceVariant)?.name :
                        'Select pricing option'
                      }
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base sm:text-lg font-bold text-primary">${calculateTotalPrice().toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">per person</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
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
                <Select
                  value={skillLevel}
                  onValueChange={(value: "Any" | "Beginner" | "Intermediate" | "Advanced") => {
                    setSkillLevel(value);
                    if (errors.skillLevel) {
                      setErrors({ ...errors, skillLevel: "" });
                    }
                  }}
                >
                  <SelectTrigger id="skillLevel" className={errors.skillLevel ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any Skill Level</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {errors.skillLevel && (
                  <p className="text-sm text-destructive mt-1">{errors.skillLevel}</p>
                )}
              </div>

              {/* Price Variants Selection */}
              {retreat.price_variants && retreat.price_variants.length > 0 && (
                <div>
                  <Label htmlFor="priceVariant">Select Pricing Option *</Label>
                  <p className="text-xs text-muted-foreground mb-2">Choose your preferred pricing tier</p>
                  <div className="space-y-3">
                    {retreat.price_variants.map((variant) => (
                      <div 
                        key={variant.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPriceVariant === variant.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedPriceVariant(variant.id);
                          if (errors.priceVariant) {
                            setErrors({ ...errors, priceVariant: "" });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-card-foreground">{variant.name}</div>
                            {variant.description && (
                              <div className="text-sm text-muted-foreground mt-1">{variant.description}</div>
                            )}
                          </div>
                          <div className="text-lg font-bold text-primary">${variant.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.priceVariant && (
                    <p className="text-sm text-destructive mt-1">{errors.priceVariant}</p>
                  )}
                </div>
              )}

              {/* Add-ons Selection */}
              {retreat.add_ons && retreat.add_ons.length > 0 && (
                <div>
                  <Label>Additional Options</Label>
                  <p className="text-xs text-muted-foreground mb-2">Enhance your retreat experience</p>
                  <div className="space-y-3">
                    {retreat.add_ons.map((addOn) => {
                      const isSelected = selectedAddOns.includes(addOn.id) || addOn.required;
                      return (
                        <div 
                          key={addOn.id}
                          className={`p-3 border rounded-lg transition-colors ${
                            addOn.required 
                              ? 'border-orange-200 bg-orange-50 cursor-not-allowed' 
                              : isSelected
                                ? 'border-primary bg-primary/5 cursor-pointer'
                                : 'border-border cursor-pointer hover:border-primary/50'
                          }`}
                          onClick={() => {
                            if (!addOn.required) {
                              if (isSelected) {
                                setSelectedAddOns(prev => prev.filter(id => id !== addOn.id));
                              } else {
                                setSelectedAddOns(prev => [...prev, addOn.id]);
                              }
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-card-foreground">{addOn.name}</div>
                                {addOn.required && (
                                  <span className="text-xs bg-orange-100 text checked:by-orange-800 px-2 py-1 rounded">Required</span>
                                )}
                              </div>
                              {addOn.description && (
                                <div className="text-sm text-muted-foreground mt-1">{addOn.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-bold text-primary">${addOn.price.toFixed(2)}</div>
                              {!addOn.required && (
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'border-primary bg-primary' : 'border-border'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {/* Base Price or Selected Price Variant */}
              {retreat.price_variants && retreat.price_variants.length > 0 && selectedPriceVariant ? (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>
                    {retreat.price_variants.find(v => v.id === selectedPriceVariant)?.name}
                  </span>
                  <span>
                    ${retreat.price_variants.find(v => v.id === selectedPriceVariant)?.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Retreat price</span>
                  <span>${retreat.price}</span>
                </div>
              )}
              
              {/* Add-ons */}
              {retreat.add_ons && retreat.add_ons.length > 0 && (
                <>
                  {retreat.add_ons
                    .filter(addOn => addOn.required || selectedAddOns.includes(addOn.id))
                    .map(addOn => (
                      <div key={addOn.id} className="flex items-center justify-between text-muted-foreground">
                        <span>
                          {addOn.name}
                          {addOn.required && <span className="text-xs ml-1">(required)</span>}
                        </span>
                        <span>${addOn.price.toFixed(2)}</span>
                      </div>
                    ))}
                </>
              )}
              
              <div className="flex items-center justify-between font-semibold text-card-foreground pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">${calculateTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="fixed bottom-4 left-0 right-0 px-4 sm:px-6 pb-safe">
        <div className="max-w-4xl mx-auto">
          <Button
            className="w-full h-12 text-base sm:text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            onClick={handleContinue}
          >
            Continue to Payment
          </Button>
          {(errors.fullName || errors.email || errors.skillLevel) && (
            <p className="text-xs sm:text-sm text-destructive text-center mt-2">
              Please fill in all required fields correctly
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;

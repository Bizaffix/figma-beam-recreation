import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Switch } from "@/components/ui/switch";

import { Label } from "@/components/ui/label";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/contexts/AuthContext";

import { useGetUserProfileQuery, useUpdateUserProfileMutation } from "@/services/server";

import { useToast } from "@/hooks/use-toast";

import {

  GraduationCap,

  CheckCircle2,

  AlertCircle,

  Users,

  Calendar,

  DollarSign,

  MessageSquare,

} from "lucide-react";



interface InstructorModeSettings {

  enabled: boolean;

  instructor_bio: string;

  instructor_specialties: string[];

  teaching_experience: string;

  preferred_group_sizes: string[];

  pricing_visibility: "public" | "private" | "property_only";

}



const InstructorModeToggle = () => {

  const { user, role } = useAuth();

  const { toast } = useToast();

  const { data: profile, isLoading: profileLoading } = useGetUserProfileQuery(undefined, {

    skip: !user || role !== "location_owner",

  });

  const [updateUserProfile] = useUpdateUserProfileMutation();

  const [settings, setSettings] = useState<InstructorModeSettings>({

    enabled: false,

    instructor_bio: "",

    instructor_specialties: [],

    teaching_experience: "",

    preferred_group_sizes: [],

    pricing_visibility: "private",

  });

  const [saving, setSaving] = useState(false);



  useEffect(() => {

    if (profile?.bio) {

      setSettings((prev) => ({ ...prev, instructor_bio: profile.bio ?? "" }));

    }

  }, [profile?.bio]);



  const saveSettings = async () => {

    if (!user) return;



    setSaving(true);

    try {

      await updateUserProfile({ bio: settings.instructor_bio || undefined }).unwrap();



      if (settings.enabled) {

        toast({

          title: "Admin approval required",

          description:

            "Enabling instructor mode requires admin approval. Your teaching bio was saved.",

        });

      } else {

        toast({

          title: "Settings saved",

          description: "Your instructor profile details were updated.",

        });

      }

    } catch (error) {

      console.error("Error saving instructor settings:", error);

      toast({

        title: "Error",

        description: "Failed to save instructor settings.",

        variant: "destructive",

      });

    } finally {

      setSaving(false);

    }

  };



  const toggleInstructorMode = (enabled: boolean) => {

    setSettings((prev) => ({ ...prev, enabled }));

  };



  if (role !== "location_owner") {

    return null;

  }



  if (profileLoading) {

    return (

      <Card>

        <CardContent className="p-6">

          <div className="animate-pulse space-y-4">

            <div className="h-4 bg-muted rounded w-1/4"></div>

            <div className="h-3 bg-muted rounded w-3/4"></div>

            <div className="h-3 bg-muted rounded w-1/2"></div>

          </div>

        </CardContent>

      </Card>

    );

  }



  return (

    <Card>

      <CardHeader>

        <CardTitle className="flex items-center gap-2">

          <GraduationCap className="w-5 h-5" />

          Instructor Mode

        </CardTitle>

        <CardDescription>

          Enable instructor features to host your own retreats at your property

        </CardDescription>

      </CardHeader>

      <CardContent className="space-y-6">

        <div className="flex items-center justify-between">

          <div className="space-y-1">

            <Label htmlFor="instructor-mode" className="text-base font-medium">

              Enable Instructor Mode

            </Label>

            <p className="text-sm text-muted-foreground">

              Get full event tools for retreats you personally create

            </p>

          </div>

          <Switch

            id="instructor-mode"

            checked={settings.enabled}

            onCheckedChange={toggleInstructorMode}

          />

        </div>



        {settings.enabled && (

          <>

            <Alert>

              <CheckCircle2 className="h-4 w-4" />

              <AlertDescription>

                With instructor mode enabled, you'll have access to:

              </AlertDescription>

            </Alert>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="flex items-start gap-3">

                <Users className="w-5 h-5 text-primary mt-1" />

                <div>

                  <h4 className="font-medium text-sm">Student Management</h4>

                  <p className="text-xs text-muted-foreground">Manage registrations and communications</p>

                </div>

              </div>

              <div className="flex items-start gap-3">

                <Calendar className="w-5 h-5 text-primary mt-1" />

                <div>

                  <h4 className="font-medium text-sm">Event Creation</h4>

                  <p className="text-xs text-muted-foreground">Create and manage your own retreats</p>

                </div>

              </div>

              <div className="flex items-start gap-3">

                <DollarSign className="w-5 h-5 text-primary mt-1" />

                <div>

                  <h4 className="font-medium text-sm">Payment Processing</h4>

                  <p className="text-xs text-muted-foreground">Handle payments for your events</p>

                </div>

              </div>

              <div className="flex items-start gap-3">

                <MessageSquare className="w-5 h-5 text-primary mt-1" />

                <div>

                  <h4 className="font-medium text-sm">Student Messaging</h4>

                  <p className="text-xs text-muted-foreground">Communicate with your participants</p>

                </div>

              </div>

            </div>



            <div className="space-y-4">

              <h4 className="font-medium">Instructor Profile</h4>



              <div className="space-y-2">

                <Label htmlFor="bio">Teaching Bio</Label>

                <textarea

                  id="bio"

                  className="w-full p-2 border rounded-md"

                  rows={3}

                  placeholder="Tell quilters about your teaching experience and specialties..."

                  value={settings.instructor_bio}

                  onChange={(e) => setSettings((prev) => ({ ...prev, instructor_bio: e.target.value }))}

                />

              </div>



              <div className="space-y-2">

                <Label htmlFor="experience">Teaching Experience</Label>

                <input

                  id="experience"

                  type="text"

                  className="w-full p-2 border rounded-md"

                  placeholder="e.g., 5+ years teaching quilting workshops"

                  value={settings.teaching_experience}

                  onChange={(e) =>

                    setSettings((prev) => ({ ...prev, teaching_experience: e.target.value }))

                  }

                />

              </div>



              <div className="space-y-2">

                <Label>Preferred Group Sizes</Label>

                <div className="flex flex-wrap gap-2">

                  {["Small (4-8)", "Medium (9-15)", "Large (16+)"].map((size) => (

                    <Badge

                      key={size}

                      variant={settings.preferred_group_sizes.includes(size) ? "default" : "outline"}

                      className="cursor-pointer"

                      onClick={() => {

                        setSettings((prev) => ({

                          ...prev,

                          preferred_group_sizes: prev.preferred_group_sizes.includes(size)

                            ? prev.preferred_group_sizes.filter((s) => s !== size)

                            : [...prev.preferred_group_sizes, size],

                        }));

                      }}

                    >

                      {size}

                    </Badge>

                  ))}

                </div>

              </div>

            </div>



            <div className="space-y-2">

              <Label>Pricing Visibility</Label>

              <select

                className="w-full p-2 border rounded-md"

                value={settings.pricing_visibility}

                onChange={(e) =>

                  setSettings((prev) => ({

                    ...prev,

                    pricing_visibility: e.target.value as InstructorModeSettings["pricing_visibility"],

                  }))

                }

              >

                <option value="private">Private (only you can see)</option>

                <option value="property_only">Property Only (show on your property page)</option>

                <option value="public">Public (show in search results)</option>

              </select>

            </div>



            <Alert>

              <AlertCircle className="h-4 w-4" />

              <AlertDescription>

                You'll have both Property Owner and Instructor permissions. Instructor features only apply to events you personally create.

              </AlertDescription>

            </Alert>

          </>

        )}



        <div className="flex justify-end">

          <Button onClick={saveSettings} disabled={saving}>

            {saving ? "Saving..." : "Save Settings"}

          </Button>

        </div>

      </CardContent>

    </Card>

  );

};



export default InstructorModeToggle;



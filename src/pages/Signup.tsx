import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { INSTRUCTOR_AGREEMENT } from "@/content/instructor-agreement";
import { PRIVACY_POLICY } from "@/content/privacy-policy";
import { STUDENT_TERMS_AND_CONDITIONS } from "@/content/student-terms-and-conditions";
import { STUDENT_PRIVACY_POLICY } from "@/content/student-privacy-policy";
import { createReferral, getCurrentAffiliate } from "@/lib/affiliate-tracking";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor' | 'location_owner'>('student');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showStudentTermsDialog, setShowStudentTermsDialog] = useState(false);
  const [showStudentPrivacyDialog, setShowStudentPrivacyDialog] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || undefined;
  const roleParam = searchParams.get('role');
  
  // Set initial role from URL parameter if provided
  useEffect(() => {
    if (roleParam === 'student' || roleParam === 'instructor' || roleParam === 'location_owner') {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name fields (required for all roles)
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first and last name",
        variant: "destructive",
      });
      return;
    }
    
    // Validate agreement checkboxes
    if (selectedRole === 'instructor') {
      if (!agreedToTerms || !agreedToPrivacy) {
        toast({
          title: "Error",
          description: "Please read and agree to the Instructor Terms of Service and Privacy Policy",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedRole === 'student') {
      if (!agreedToTerms || !agreedToPrivacy) {
        toast({
          title: "Error",
          description: "Please read and agree to the Participant Terms and Conditions and Privacy Policy",
          variant: "destructive",
        });
        return;
      }
    }
    // Location owners don't need terms agreement for basic signup (they'll agree during property registration)
    
    setLoading(true);
    try {
      const studentData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };
      
      const instructorData = selectedRole === 'instructor' ? {
        ...studentData,
        bio: bio.trim(),
      } : undefined;
      
      const locationOwnerData = selectedRole === 'location_owner' ? {
        ...studentData,
      } : undefined;
      
      const result = await signUp(email, password, selectedRole, referralCode, studentData, instructorData, locationOwnerData);
      const { error, needsConfirmation, data: signupData } = result as { error: any; needsConfirmation?: boolean; data?: any };
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to sign up",
          variant: "destructive",
        });
      } else {
        // Create affiliate referral if user was referred via affiliate link
        // Note: This happens after email confirmation, but we track the cookie now
        const affiliateData = getCurrentAffiliate();
        if (affiliateData && signupData?.user?.id) {
          try {
            const referralType = selectedRole === 'instructor' ? 'organizer' : selectedRole === 'location_owner' ? 'venue' : 'student';
            await createReferral(referralType, signupData.user.id);
          } catch (affiliateError) {
            console.error('Error creating affiliate referral:', affiliateError);
            // Don't block signup if affiliate tracking fails
          }
        }

        toast({
          title: "Account Created",
          description: "Please check your email and click the confirmation link to verify your account before signing in.",
          duration: 10000,
        });
        // Don't redirect - user needs to confirm email first
        // Clear the form
        setEmail("");
        setPassword("");
        setSelectedRole('student');
        setFirstName("");
        setLastName("");
        setBio("");
        setAgreedToTerms(false);
        setAgreedToPrivacy(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Mobile Header Banner */}
      <div className="lg:hidden relative bg-gradient-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 z-10"></div>
        <div className="relative z-20 px-4 py-8 sm:py-10">
          <div className="max-w-md mx-auto text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              {selectedRole === 'instructor' 
                ? "Share Your Quilting Expertise" 
                : "Start Your Quilting Journey Today"}
            </h2>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              {selectedRole === 'instructor'
                ? "Join our community of instructors. Create retreats, manage bookings, and share your passion with eager quilters."
                : "Join our community of passionate quilters and instructors. Discover retreats, share your skills, and create unforgettable experiences."}
            </p>
            <div className="space-y-2 pt-3">
              {selectedRole === 'instructor' ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <span className="text-xs sm:text-sm text-white/90">Create and manage retreats</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <span className="text-xs sm:text-sm text-white/90">Handle bookings and payments</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <span className="text-xs sm:text-sm text-white/90">Reach passionate quilters</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <span className="text-xs sm:text-sm text-white/90">Discover amazing retreats</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <span className="text-xs sm:text-sm text-white/90">Connect with instructors</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    <span className="text-xs sm:text-sm text-white/90">Join a vibrant community</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2">
        {/* Desktop Image Section */}
        <div className="hidden lg:flex relative bg-gradient-primary overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 z-10"></div>
          <img 
            src={selectedRole === 'instructor' ? "/Image4.jpg" : "/Image3.jpg"}
            alt={selectedRole === 'instructor' ? "Quilting instructor" : "Quilting workshop"} 
            className="w-full h-full object-cover mix-blend-overlay transition-opacity duration-300"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-white">
            <div className="max-w-md space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                {selectedRole === 'instructor' 
                  ? "Share Your Quilting Expertise" 
                  : "Start Your Quilting Journey Today"}
              </h2>
              <p className="text-lg text-white/90 leading-relaxed">
                {selectedRole === 'instructor'
                  ? "Join our community of instructors. Create retreats, manage bookings, and share your passion with eager quilters."
                  : "Join our community of passionate quilters and instructors. Discover retreats, share your skills, and create unforgettable experiences."}
              </p>
              <div className="space-y-3 pt-4">
                {selectedRole === 'instructor' ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-sm text-white/90">Create and manage retreats</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-sm text-white/90">Handle bookings and payments</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-sm text-white/90">Reach passionate quilters</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-sm text-white/90">Discover amazing retreats</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-sm text-white/90">Connect with instructors</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-sm text-white/90">Join a vibrant community</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex items-start md:items-center justify-center p-4 sm:p-6 py-6 sm:py-8 md:py-6 lg:py-8 md:p-8 lg:p-12 bg-muted/20 md:bg-background overflow-y-auto md:overflow-visible">
          <div className="w-full max-w-md md:max-h-[calc(100vh-3rem)] lg:max-h-[calc(100vh-4rem)] md:overflow-y-auto md:pr-2">
            <Card className="w-full shadow-lg border md:shadow-xl bg-card">
        <CardHeader className="pb-2 sm:pb-3 md:pb-4">
          <CardTitle className="text-xl sm:text-2xl text-center">Quilting Retreats</CardTitle>
          <CardDescription className="text-center text-xs sm:text-sm md:text-base">
            Create a new account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-3 sm:pb-4 md:pb-6">
          <form onSubmit={handleSignUp} className="space-y-2.5 sm:space-y-3 md:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">I am a...</Label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value as 'student' | 'instructor' | 'location_owner');
                  // Reset agreement checkboxes when role changes
                  if (value === 'student') {
                    setAgreedToTerms(false);
                    setAgreedToPrivacy(false);
                  } else if (value === 'instructor') {
                    setAgreedToTerms(false);
                    setAgreedToPrivacy(false);
                  } else if (value === 'location_owner') {
                    setAgreedToTerms(false);
                    setAgreedToPrivacy(false);
                  }
                }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="role-student" />
                  <Label htmlFor="role-student" className="font-normal cursor-pointer text-xs sm:text-sm md:text-base">
                    Student
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instructor" id="role-instructor" />
                  <Label htmlFor="role-instructor" className="font-normal cursor-pointer text-xs sm:text-sm md:text-base">
                    Instructor
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="location_owner" id="role-location-owner" />
                  <Label htmlFor="role-location-owner" className="font-normal cursor-pointer text-xs sm:text-sm md:text-base">
                    Venue Owner
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="firstname" className="text-xs sm:text-sm">First Name</Label>
                <Input
                  id="firstname"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="lastname" className="text-xs sm:text-sm">Last Name</Label>
                <Input
                  id="lastname"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
                />
              </div>
            </div>
            
            {selectedRole === 'student' && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="student-terms-agreement"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="student-terms-agreement" className="text-xs sm:text-sm font-normal cursor-pointer leading-relaxed">
                      I have read and agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowStudentTermsDialog(true)}
                        className="text-primary hover:underline font-medium"
                      >
                        Participant Terms and Conditions
                      </button>
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="student-privacy-agreement"
                    checked={agreedToPrivacy}
                    onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="student-privacy-agreement" className="text-xs sm:text-sm font-normal cursor-pointer leading-relaxed">
                      I have read and agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowStudentPrivacyDialog(true)}
                        className="text-primary hover:underline font-medium"
                      >
                        Privacy Policy
                      </button>
                    </Label>
                  </div>
                </div>
              </div>
            )}
            
            {selectedRole === 'instructor' && (
              <>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="bio" className="text-xs sm:text-sm">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={2}
                    className="text-xs sm:text-sm md:text-base resize-none min-h-[60px]"
                  />
                </div>
                
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms-agreement"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor="terms-agreement" className="text-xs sm:text-sm font-normal cursor-pointer leading-relaxed">
                        I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsDialog(true)}
                          className="text-primary hover:underline font-medium"
                        >
                          Instructor Terms of Service
                        </button>
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="privacy-agreement"
                      checked={agreedToPrivacy}
                      onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor="privacy-agreement" className="text-xs sm:text-sm font-normal cursor-pointer leading-relaxed">
                        I have read and agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setShowPrivacyDialog(true)}
                          className="text-primary hover:underline font-medium"
                        >
                          Privacy Policy
                        </button>
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10 h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters
              </p>
            </div>
            <Button type="submit" className="w-full h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-3 sm:mt-4 md:mt-6 text-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
          </div>
        </div>
      </div>

      {/* Dialogs - Outside grid layout */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{INSTRUCTOR_AGREEMENT.title}</DialogTitle>
            <DialogDescription>
              {INSTRUCTOR_AGREEMENT.company} • Effective Date: {INSTRUCTOR_AGREEMENT.effectiveDate}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="pr-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {INSTRUCTOR_AGREEMENT.content}
                </pre>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button onClick={() => setShowTermsDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Terms and Conditions Dialog */}
      <Dialog open={showStudentTermsDialog} onOpenChange={setShowStudentTermsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{STUDENT_TERMS_AND_CONDITIONS.title}</DialogTitle>
            <DialogDescription>
              {STUDENT_TERMS_AND_CONDITIONS.company} • Last Updated: {STUDENT_TERMS_AND_CONDITIONS.lastUpdated}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="pr-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {STUDENT_TERMS_AND_CONDITIONS.content}
                </pre>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button onClick={() => setShowStudentTermsDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Privacy Policy Dialog */}
      <Dialog open={showStudentPrivacyDialog} onOpenChange={setShowStudentPrivacyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{STUDENT_PRIVACY_POLICY.title}</DialogTitle>
            <DialogDescription>
              {STUDENT_PRIVACY_POLICY.company} • Last Updated: {STUDENT_PRIVACY_POLICY.lastUpdated}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="pr-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {STUDENT_PRIVACY_POLICY.content}
                </pre>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button onClick={() => setShowStudentPrivacyDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
            <DialogTitle>{PRIVACY_POLICY.title}</DialogTitle>
            <DialogDescription>
              {PRIVACY_POLICY.company} • Last Updated: {PRIVACY_POLICY.lastUpdated}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <div className="pr-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {PRIVACY_POLICY.content}
                </pre>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 pb-6 px-6 border-t flex-shrink-0">
            <Button onClick={() => setShowPrivacyDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Signup;


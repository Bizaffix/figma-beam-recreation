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

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor'>('student');
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || undefined;
  const roleParam = searchParams.get('role');
  
  // Set initial role from URL parameter if provided
  useEffect(() => {
    if (roleParam === 'student' || roleParam === 'instructor') {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name fields (required for both students and instructors)
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your first and last name",
        variant: "destructive",
      });
      return;
    }
    
    // Validate agreement checkboxes for instructors
    if (selectedRole === 'instructor') {
      if (!agreedToTerms || !agreedToPrivacy) {
        toast({
          title: "Error",
          description: "Please read and agree to the Instructor Terms of Service and Privacy Policy",
          variant: "destructive",
        });
        return;
      }
    }
    
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
      
      const { error, needsConfirmation } = await signUp(email, password, selectedRole, referralCode, studentData, instructorData);
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to sign up",
          variant: "destructive",
        });
      } else {
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
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Image Section */}
        <div className="hidden lg:flex relative bg-gradient-primary overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/90 z-10"></div>
          <img 
            src="/Image3.jpg" 
            alt="Quilting workshop" 
            className="w-full h-full object-cover mix-blend-overlay"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-white">
            <div className="max-w-md space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Start Your Quilting Journey Today
              </h2>
              <p className="text-lg text-white/90 leading-relaxed">
                Join our community of passionate quilters and instructors. Discover retreats, share your skills, and create unforgettable experiences.
              </p>
              <div className="space-y-3 pt-4">
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
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex items-center justify-center p-6 py-12 lg:p-12">
          <Card className="w-full max-w-md shadow-lg border-0 lg:shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Quilting Retreats</CardTitle>
          <CardDescription className="text-center">
            Create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-3">
              <Label>I am a...</Label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value as 'student' | 'instructor');
                  // Reset agreement checkboxes when role changes
                  if (value === 'student') {
                    setAgreedToTerms(false);
                    setAgreedToPrivacy(false);
                  }
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="student" id="role-student" />
                  <Label htmlFor="role-student" className="font-normal cursor-pointer">
                    Student
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="instructor" id="role-instructor" />
                  <Label htmlFor="role-instructor" className="font-normal cursor-pointer">
                    Instructor
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {selectedRole === 'instructor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms-agreement"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="terms-agreement" className="text-sm font-normal cursor-pointer leading-tight">
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
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="privacy-agreement"
                      checked={agreedToPrivacy}
                      onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="privacy-agreement" className="text-sm font-normal cursor-pointer leading-tight">
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
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
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


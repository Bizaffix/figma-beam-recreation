import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createReferral, getCurrentAffiliate } from "@/lib/affiliate-tracking";
import { clearOAuthCallbackHash, parseOAuthCallbackHash } from "@/lib/google-oauth";
import { redirectAfterAuth } from "@/lib/post-auth";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { completeGoogleOAuth } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const { accessToken } = parseOAuthCallbackHash();
    clearOAuthCallbackHash();

    if (!accessToken) {
      toast({
        title: "Sign in failed",
        description: "Google sign-in did not return a session. Please try again.",
        variant: "destructive",
      });
      navigate("/login", { replace: true });
      return;
    }

    void (async () => {
      const { error, role, userId } = await completeGoogleOAuth(accessToken);
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message || "Could not complete Google sign-in.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
        return;
      }

      const affiliateData = getCurrentAffiliate();
      if (affiliateData && userId) {
        try {
          await createReferral("student", userId);
        } catch (affiliateError) {
          console.error("Error creating affiliate referral after Google sign-in:", affiliateError);
        }
      }

      toast({
        title: "Success",
        description: "Signed in with Google",
      });
      redirectAfterAuth(navigate, role);
    })();
  }, [completeGoogleOAuth, navigate, toast]);

  return <PageLoader />;
}

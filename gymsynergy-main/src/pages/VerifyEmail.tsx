import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Icons } from "../components/ui/icons";
import { CheckCircle, Mail, Loader } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

export default function VerifyEmail() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const { currentUser, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    const checkVerification = async () => {
      if (currentUser) {
        try {
          await currentUser.reload();
          if (currentUser.emailVerified) {
            setVerified(true);
            toast({
              title: "Success",
              description: "Your email has been verified!",
            });
          }
        } catch (error) {
          console.error("Error checking verification:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkVerification();
  }, [currentUser, toast]);

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      await sendVerificationEmail();
      toast({
        title: "Success",
        description: "Verification email has been resent. Please check your inbox.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to resend verification email.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {verified
              ? "Your email has been verified successfully!"
              : "Please verify your email address to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {verified ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : (
            <>
              <Mail className="h-16 w-16 text-primary" />
              <p className="text-center text-sm text-muted-foreground">
                We've sent a verification email to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {verified ? (
            <Button
              className="w-full"
              onClick={() => navigate("/client-login")}
            >
              Continue to Login
            </Button>
          ) : (
            <>
              <Button
                className="w-full"
                onClick={handleResendVerification}
                disabled={loading}
              >
                {loading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Resend Verification Email
              </Button>
              <div className="text-sm text-muted-foreground text-center">
                Already verified?{" "}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => navigate("/client-login")}
                >
                  Sign in
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

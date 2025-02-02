import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Icons } from "../components/ui/icons";
import { useToast } from "../components/ui/use-toast";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { ConnectionStatus } from "../components/ui/connection-status";

export default function InstructorSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle, sendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "No Internet Connection",
        description: "Please check your internet connection and try again.",
      });
      return;
    }

    // Validate form data
    if (password !== confirmPassword) {
      return toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match.",
      });
    }

    if (!displayName.trim()) {
      return toast({
        variant: "destructive",
        title: "Error",
        description: "Name is required.",
      });
    }

    if (!bio.trim()) {
      return toast({
        variant: "destructive",
        title: "Error",
        description: "Bio is required to help clients know more about you.",
      });
    }

    if (!specialties.trim()) {
      return toast({
        variant: "destructive",
        title: "Error",
        description: "Please list your specialties.",
      });
    }

    try {
      setLoading(true);

      // Create instructor account
      const userCredential = await signUp(email, password, "instructor", displayName);
      const userId = userCredential.user.uid;

      // Create instructor profile in Firestore
      await setDoc(doc(db, 'instructor_profiles', userId), {
        userId,
        profile: {
          displayName,
          email,
          bio,
          specialties: specialties.split(',').map(s => s.trim()),
          rating: 0,
          reviewCount: 0,
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          theme: 'light',
          availability: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },
        },
        fees: {
          baseRate: 0,
          sessionFee: 0,
          planFee: 0,
          currency: 'USD',
        },
        stats: {
          totalClients: 0,
          activeClients: 0,
          totalSessions: 0,
          totalEarnings: 0,
        },
        verification: {
          status: 'pending',
          documents: [],
          submittedAt: new Date(),
        },
      });

      // Send verification email
      await sendVerificationEmail();

      toast({
        title: "Success",
        description: "Account created! Please check your email to verify your account.",
      });
      
      // Add delay before navigation to ensure data is saved
      setTimeout(() => {
        navigate("/instructor-login");
      }, 1500);

    } catch (error: any) {
      let errorMessage = "Failed to create an account.";
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please try logging in.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters long.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }

      toast({
        variant: "destructive",
        title: "Signup Error",
        description: errorMessage,
      });
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "No Internet Connection",
        description: "Please check your internet connection and try again.",
      });
      return;
    }
    try {
      setLoading(true);
      await signInWithGoogle("instructor");
      // Navigation will be handled by the AuthContext after profile is loaded
    } catch (error: any) {
      let errorMessage = "Failed to sign up with Google.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign up cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up blocked. Please allow pop-ups and try again.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[500px]">
        <CardHeader className="space-y-1">
          <div className="flex justify-end">
            <ConnectionStatus />
          </div>
          <CardTitle className="text-2xl text-center">Create Instructor Account</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create an instructor account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <div className="grid gap-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your experience and qualifications..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="specialties">Specialties</Label>
                <Input
                  id="specialties"
                  type="text"
                  placeholder="e.g., Yoga, HIIT, Strength Training"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid gap-1">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Account
              </Button>
            </div>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={() => navigate("/instructor-login")}
            >
              Sign in
            </Button>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Looking for a trainer?{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={() => navigate("/client-signup")}
            >
              Sign up as client
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

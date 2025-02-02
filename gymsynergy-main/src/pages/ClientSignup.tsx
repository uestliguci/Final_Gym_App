import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Icons } from "../components/ui/icons";
import { useToast } from "../components/ui/use-toast";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import { ConnectionStatus } from "../components/ui/connection-status";

interface DemographicData {
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  occupation: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

interface HealthData {
  healthConditions: string[];
  medicalHistory: string;
  allergies: string[];
  bloodType: string;
  lifestyleHabits: {
    exerciseFrequency: string;
    dietaryPreferences: string;
    sleepHours: string;
    stressLevel: string;
  };
}

interface BodyMeasurements {
  chest: string;
  waist: string;
  hips: string;
  biceps: string;
  thighs: string;
}

export default function ClientSignup() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [demographicData, setDemographicData] = useState<DemographicData>({
    dateOfBirth: "",
    gender: "",
    height: "",
    weight: "",
    occupation: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [healthData, setHealthData] = useState<HealthData>({
    healthConditions: [],
    medicalHistory: "",
    allergies: [],
    bloodType: "",
    lifestyleHabits: {
      exerciseFrequency: "",
      dietaryPreferences: "",
      sleepHours: "",
      stressLevel: "",
    },
  });

  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurements>({
    chest: "",
    waist: "",
    hips: "",
    biceps: "",
    thighs: "",
  });
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

    if (step < 4) {
      setStep(step + 1);
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

    // Validate required demographic data
    if (!demographicData.dateOfBirth || !demographicData.gender || !demographicData.height || !demographicData.weight) {
      return toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required demographic information.",
      });
    }

    try {
      setLoading(true);

      // Create user account
      const userCredential = await signUp(email, password, "client", displayName);
      const userId = userCredential.user.uid;

      // Calculate BMI
      const heightInMeters = parseFloat(demographicData.height) / 100;
      const weightInKg = parseFloat(demographicData.weight);
      const bmi = weightInKg / (heightInMeters * heightInMeters);

      // Create client profile in Firestore
      await setDoc(doc(db, 'client_profiles', userId), {
        userId,
        demographic: {
          ...demographicData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        health: {
          ...healthData,
          bmi: bmi.toFixed(2),
          updatedAt: new Date(),
        },
        measurements: {
          ...bodyMeasurements,
          updatedAt: new Date(),
        },
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          theme: 'light',
        },
        subscription: {
          status: 'free',
          startDate: new Date(),
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
        navigate("/client-login");
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
      await signInWithGoogle("client");
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

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderAccountForm();
      case 2:
        return renderDemographicForm();
      case 3:
        return renderHealthForm();
      case 4:
        return renderMeasurementsForm();
      default:
        return null;
    }
  };

  const renderAccountForm = () => (
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
          {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Next
        </Button>
      </div>
    </form>
  );

  const renderDemographicForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={demographicData.dateOfBirth}
            onChange={(e) => setDemographicData({...demographicData, dateOfBirth: e.target.value})}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={demographicData.gender}
            onValueChange={(value) => setDemographicData({...demographicData, gender: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            value={demographicData.height}
            onChange={(e) => setDemographicData({...demographicData, height: e.target.value})}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={demographicData.weight}
            onChange={(e) => setDemographicData({...demographicData, weight: e.target.value})}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            type="text"
            value={demographicData.occupation}
            onChange={(e) => setDemographicData({...demographicData, occupation: e.target.value})}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Next
        </Button>
      </div>
    </form>
  );

  const renderHealthForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="healthConditions">Health Conditions</Label>
          <Textarea
            id="healthConditions"
            placeholder="List any health conditions..."
            value={healthData.healthConditions.join(", ")}
            onChange={(e) => setHealthData({
              ...healthData,
              healthConditions: e.target.value.split(",").map(item => item.trim())
            })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="medicalHistory">Medical History</Label>
          <Textarea
            id="medicalHistory"
            placeholder="Brief medical history..."
            value={healthData.medicalHistory}
            onChange={(e) => setHealthData({...healthData, medicalHistory: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="allergies">Allergies</Label>
          <Input
            id="allergies"
            placeholder="List any allergies..."
            value={healthData.allergies.join(", ")}
            onChange={(e) => setHealthData({
              ...healthData,
              allergies: e.target.value.split(",").map(item => item.trim())
            })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bloodType">Blood Type</Label>
          <Select
            value={healthData.bloodType}
            onValueChange={(value) => setHealthData({...healthData, bloodType: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blood type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          Next
        </Button>
      </div>
    </form>
  );

  const renderMeasurementsForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="chest">Chest (cm)</Label>
          <Input
            id="chest"
            type="number"
            value={bodyMeasurements.chest}
            onChange={(e) => setBodyMeasurements({...bodyMeasurements, chest: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="waist">Waist (cm)</Label>
          <Input
            id="waist"
            type="number"
            value={bodyMeasurements.waist}
            onChange={(e) => setBodyMeasurements({...bodyMeasurements, waist: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="hips">Hips (cm)</Label>
          <Input
            id="hips"
            type="number"
            value={bodyMeasurements.hips}
            onChange={(e) => setBodyMeasurements({...bodyMeasurements, hips: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="biceps">Biceps (cm)</Label>
          <Input
            id="biceps"
            type="number"
            value={bodyMeasurements.biceps}
            onChange={(e) => setBodyMeasurements({...bodyMeasurements, biceps: e.target.value})}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="thighs">Thighs (cm)</Label>
          <Input
            id="thighs"
            type="number"
            value={bodyMeasurements.thighs}
            onChange={(e) => setBodyMeasurements({...bodyMeasurements, thighs: e.target.value})}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </div>
    </form>
  );

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[500px]">
        <CardHeader className="space-y-1">
          <div className="flex justify-end">
            <ConnectionStatus />
          </div>
          <CardTitle className="text-2xl text-center">Create Client Account</CardTitle>
          <CardDescription className="text-center">
            Step {step} of 4: {
              step === 1 ? "Account Information" :
              step === 2 ? "Demographic Information" :
              step === 3 ? "Health Information" :
              "Body Measurements"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {renderStepContent()}
          {step === 1 && (
            <>
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
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="w-full"
            >
              Back
            </Button>
          )}
          {step === 1 && (
            <>
              <div className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => navigate("/client-login")}
                >
                  Sign in
                </Button>
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Want to become an instructor?{" "}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => navigate("/instructor-signup")}
                >
                  Apply now
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

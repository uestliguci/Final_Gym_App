import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../components/ui/use-toast";
import { Badge } from "../components/ui/badge";

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  targetMuscles: string[];
  equipment: string[];
  price: number;
  currency: string;
}

interface WorkoutGuide {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  accessLevel: string;
  price: number;
  currency: string;
}

interface InstructorData {
  profile: {
    displayName: string;
    bio: string;
    specialties: string[];
    rating: number;
    reviewCount: number;
    verified: boolean;
  };
  fees: {
    baseRate: number;
    sessionFee: number;
    planFee: number;
    currency: string;
  };
  settings: {
    availability: {
      [key: string]: { start: string; end: string }[];
    };
  };
}

export default function InstructorDetails() {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [instructor, setInstructor] = useState<InstructorData | null>(null);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [workoutGuides, setWorkoutGuides] = useState<WorkoutGuide[]>([]);

  useEffect(() => {
    const fetchInstructorData = async () => {
      if (!instructorId) return;

      try {
        setLoading(true);
        
        // Fetch instructor profile
        const instructorDoc = await getDoc(doc(db, 'instructor_profiles', instructorId));
        if (!instructorDoc.exists()) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Instructor not found",
          });
          navigate("/instructors");
          return;
        }
        setInstructor(instructorDoc.data() as InstructorData);

        // Fetch workout plans
        const plansQuery = query(
          collection(db, 'workout_plans'),
          where('instructorId', '==', instructorId)
        );
        const plansSnapshot = await getDocs(plansQuery);
        const plans = plansSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WorkoutPlan[];
        setWorkoutPlans(plans);

        // Fetch workout guides
        const guidesQuery = query(
          collection(db, 'workout_guides'),
          where('instructorId', '==', instructorId)
        );
        const guidesSnapshot = await getDocs(guidesQuery);
        const guides = guidesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as WorkoutGuide[];
        setWorkoutGuides(guides);

      } catch (error) {
        console.error("Error fetching instructor data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load instructor data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorData();
  }, [instructorId]);

  const handleSubscribe = async () => {
    if (!currentUser || !instructor) return;

    try {
      // Navigate to subscription page
      navigate(`/subscribe/${instructorId}`);
    } catch (error) {
      console.error("Error subscribing to instructor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process subscription",
      });
    }
  };

  if (loading || !instructor) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-10">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {instructor.profile.displayName}
                {instructor.profile.verified && (
                  <Badge variant="secondary" className="ml-2">Verified</Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-2">
                {instructor.profile.specialties.join(" • ")}
              </CardDescription>
            </div>
            <Button onClick={handleSubscribe}>
              Subscribe
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{instructor.profile.bio}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Base Rate</h4>
                <p className="text-lg">
                  {instructor.fees.baseRate} {instructor.fees.currency}/hr
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Rating</h4>
                <p className="text-lg">
                  {instructor.profile.rating.toFixed(1)} ({instructor.profile.reviewCount} reviews)
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Session Fee</h4>
                <p className="text-lg">
                  {instructor.fees.sessionFee} {instructor.fees.currency}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="plans">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="plans">Workout Plans</TabsTrigger>
          <TabsTrigger value="guides">Workout Guides</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid gap-6">
            {workoutPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>
                    {plan.duration} • {plan.difficulty}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{plan.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {plan.targetMuscles.map((muscle, index) => (
                      <Badge key={index} variant="outline">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Equipment: {plan.equipment.join(", ")}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {plan.price} {plan.currency}
                      </span>
                      <Button onClick={() => navigate(`/workout-plan/${plan.id}`)}>
                        View Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guides">
          <div className="grid gap-6">
            {workoutGuides.map((guide) => (
              <Card key={guide.id}>
                <CardHeader>
                  <CardTitle>{guide.title}</CardTitle>
                  <CardDescription>
                    Access Level: {guide.accessLevel}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{guide.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {guide.price} {guide.currency}
                    </span>
                    <Button onClick={() => window.open(guide.fileUrl)}>
                      View Guide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Edit2, Trash2, FileText } from "lucide-react";

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  type: 'platform' | 'instructor';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: 'monthly' | '3-months' | '6-months' | 'yearly' | 'one-time';
  price: number;
  currency: string;
  features: string[];
  exercises: {
    name: string;
    sets: number;
    reps: string;
    notes: string;
  }[];
  instructorId: string;
  instructorName: string;
  subscribers: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function WorkoutPlans() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [newPlan, setNewPlan] = useState<Omit<WorkoutPlan, 'id' | 'instructorId' | 'instructorName' | 'subscribers' | 'createdAt' | 'updatedAt'>>({
    title: "",
    description: "",
    type: "instructor",
    level: "beginner",
    duration: "monthly",
    price: 0,
    currency: "USD",
    features: [""],
    exercises: [{
      name: "",
      sets: 3,
      reps: "10",
      notes: "",
    }],
  });

  useEffect(() => {
    fetchPlans();
  }, [currentUser]);

  const fetchPlans = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const plansQuery = query(
        collection(db, 'workout_plans'),
        where('instructorId', '==', currentUser.uid)
      );
      const plansSnapshot = await getDocs(plansQuery);
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as WorkoutPlan[];

      setPlans(plansData);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load workout plans",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      const planData = {
        ...newPlan,
        instructorId: currentUser.uid,
        instructorName: currentUser.displayName || 'Unknown Instructor',
        subscribers: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingPlan) {
        await updateDoc(doc(db, 'workout_plans', editingPlan.id), {
          ...planData,
          updatedAt: new Date(),
        });
        toast({
          title: "Success",
          description: "Workout plan updated successfully",
        });
      } else {
        await addDoc(collection(db, 'workout_plans'), planData);
        toast({
          title: "Success",
          description: "Workout plan created successfully",
        });
      }

      setShowNewPlanDialog(false);
      setEditingPlan(null);
      setNewPlan({
        title: "",
        description: "",
        type: "instructor",
        level: "beginner",
        duration: "monthly",
        price: 0,
        currency: "USD",
        features: [""],
        exercises: [{
          name: "",
          sets: 3,
          reps: "10",
          notes: "",
        }],
      });
      fetchPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save workout plan",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this workout plan?")) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'workout_plans', planId));
      toast({
        title: "Success",
        description: "Workout plan deleted successfully",
      });
      fetchPlans();
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete workout plan",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setNewPlan({
      ...newPlan,
      features: [...newPlan.features, ""],
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...newPlan.features];
    newFeatures[index] = value;
    setNewPlan({
      ...newPlan,
      features: newFeatures,
    });
  };

  const removeFeature = (index: number) => {
    setNewPlan({
      ...newPlan,
      features: newPlan.features.filter((_, i) => i !== index),
    });
  };

  const addExercise = () => {
    setNewPlan({
      ...newPlan,
      exercises: [...newPlan.exercises, {
        name: "",
        sets: 3,
        reps: "10",
        notes: "",
      }],
    });
  };

  const updateExercise = (index: number, field: keyof typeof newPlan.exercises[0], value: string | number) => {
    const newExercises = [...newPlan.exercises];
    newExercises[index] = {
      ...newExercises[index],
      [field]: value,
    };
    setNewPlan({
      ...newPlan,
      exercises: newExercises,
    });
  };

  const removeExercise = (index: number) => {
    setNewPlan({
      ...newPlan,
      exercises: newPlan.exercises.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workout Plans</h1>
          <p className="text-muted-foreground">
            Create and manage your workout plans
          </p>
        </div>
        <Button onClick={() => setShowNewPlanDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Plans</TabsTrigger>
          <TabsTrigger value="platform">Platform Plans</TabsTrigger>
          <TabsTrigger value="instructor">Instructor Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.type === 'platform' ? 'secondary' : 'default'}>
                      {plan.type}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPlan(plan);
                          setNewPlan({
                            title: plan.title,
                            description: plan.description,
                            type: plan.type,
                            level: plan.level,
                            duration: plan.duration,
                            price: plan.price,
                            currency: plan.currency,
                            features: plan.features,
                            exercises: plan.exercises,
                          });
                          setShowNewPlanDialog(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{plan.level}</Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {plan.price} {plan.currency}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {plan.duration}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Features:</div>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {plan.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {plan.subscribers} active subscribers
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="platform">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.filter(plan => plan.type === 'platform').map((plan) => (
              <Card key={plan.id}>
                {/* Same card content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="instructor">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.filter(plan => plan.type === 'instructor').map((plan) => (
              <Card key={plan.id}>
                {/* Same card content as above */}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showNewPlanDialog} onOpenChange={setShowNewPlanDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Workout Plan' : 'Create New Workout Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update your workout plan details' : 'Create a new workout plan for your clients'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newPlan.type}
                      onValueChange={(value: 'platform' | 'instructor') => setNewPlan({ ...newPlan, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="platform">Platform</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={newPlan.level}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setNewPlan({ ...newPlan, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                      value={newPlan.duration}
                      onValueChange={(value: 'monthly' | '3-months' | '6-months' | 'yearly' | 'one-time') => setNewPlan({ ...newPlan, duration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="3-months">3 Months</SelectItem>
                        <SelectItem value="6-months">6 Months</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="one-time">One Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newPlan.currency}
                      onValueChange={(value) => setNewPlan({ ...newPlan, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Features</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                      Add Feature
                    </Button>
                  </div>
                  {newPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Exercises</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                      Add Exercise
                    </Button>
                  </div>
                  {newPlan.exercises.map((exercise, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <Label>Exercise {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExercise(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Name</Label>
                          <Input
                            value={exercise.name}
                            onChange={(e) => updateExercise(index, 'name', e.target.value)}
                            placeholder="Exercise name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Sets</Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Reps</Label>
                            <Input
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                              placeholder="e.g., 10 or 8-12"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={exercise.notes}
                            onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                            placeholder="Exercise instructions or notes"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowNewPlanDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

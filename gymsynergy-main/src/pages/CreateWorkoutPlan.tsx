import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes: string;
}

interface WorkoutDay {
  name: string;
  exercises: Exercise[];
}

interface WorkoutPlan {
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  targetMuscles: string[];
  equipment: string[];
  price: number;
  currency: string;
  workoutDays: WorkoutDay[];
  instructorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function CreateWorkoutPlan() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan>({
    title: "",
    description: "",
    duration: "4-weeks",
    difficulty: "intermediate",
    targetMuscles: [],
    equipment: [],
    price: 0,
    currency: "USD",
    workoutDays: [
      {
        name: "Day 1",
        exercises: [
          {
            name: "",
            sets: 3,
            reps: "12",
            rest: "60",
            notes: "",
          },
        ],
      },
    ],
    instructorId: currentUser?.uid || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      const planRef = doc(collection(db, 'workout_plans'));
      
      await setDoc(planRef, {
        ...workoutPlan,
        instructorId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Success",
        description: "Workout plan created successfully",
      });

      // Reset form
      setWorkoutPlan({
        title: "",
        description: "",
        duration: "4-weeks",
        difficulty: "intermediate",
        targetMuscles: [],
        equipment: [],
        price: 0,
        currency: "USD",
        workoutDays: [
          {
            name: "Day 1",
            exercises: [
              {
                name: "",
                sets: 3,
                reps: "12",
                rest: "60",
                notes: "",
              },
            ],
          },
        ],
        instructorId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error creating workout plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create workout plan",
      });
    } finally {
      setLoading(false);
    }
  };

  const addWorkoutDay = () => {
    setWorkoutPlan({
      ...workoutPlan,
      workoutDays: [
        ...workoutPlan.workoutDays,
        {
          name: `Day ${workoutPlan.workoutDays.length + 1}`,
          exercises: [
            {
              name: "",
              sets: 3,
              reps: "12",
              rest: "60",
              notes: "",
            },
          ],
        },
      ],
    });
  };

  const addExercise = (dayIndex: number) => {
    const newWorkoutDays = [...workoutPlan.workoutDays];
    newWorkoutDays[dayIndex].exercises.push({
      name: "",
      sets: 3,
      reps: "12",
      rest: "60",
      notes: "",
    });
    setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
  };

  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    const newWorkoutDays = [...workoutPlan.workoutDays];
    newWorkoutDays[dayIndex].exercises.splice(exerciseIndex, 1);
    setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
  };

  const removeWorkoutDay = (dayIndex: number) => {
    const newWorkoutDays = [...workoutPlan.workoutDays];
    newWorkoutDays.splice(dayIndex, 1);
    setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create Workout Plan</CardTitle>
          <CardDescription>
            Create a new workout plan for your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={workoutPlan.title}
                  onChange={(e) => setWorkoutPlan({ ...workoutPlan, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={workoutPlan.description}
                  onChange={(e) => setWorkoutPlan({ ...workoutPlan, description: e.target.value })}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select
                    value={workoutPlan.duration}
                    onValueChange={(value) => setWorkoutPlan({ ...workoutPlan, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-week">1 Week</SelectItem>
                      <SelectItem value="2-weeks">2 Weeks</SelectItem>
                      <SelectItem value="4-weeks">4 Weeks</SelectItem>
                      <SelectItem value="8-weeks">8 Weeks</SelectItem>
                      <SelectItem value="12-weeks">12 Weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={workoutPlan.difficulty}
                    onValueChange={(value) => setWorkoutPlan({ ...workoutPlan, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targetMuscles">Target Muscles</Label>
                <Input
                  id="targetMuscles"
                  value={workoutPlan.targetMuscles.join(", ")}
                  onChange={(e) => setWorkoutPlan({
                    ...workoutPlan,
                    targetMuscles: e.target.value.split(",").map(m => m.trim())
                  })}
                  placeholder="e.g., Chest, Back, Legs"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="equipment">Required Equipment</Label>
                <Input
                  id="equipment"
                  value={workoutPlan.equipment.join(", ")}
                  onChange={(e) => setWorkoutPlan({
                    ...workoutPlan,
                    equipment: e.target.value.split(",").map(e => e.trim())
                  })}
                  placeholder="e.g., Dumbbells, Barbell, Resistance Bands"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={workoutPlan.price}
                    onChange={(e) => setWorkoutPlan({
                      ...workoutPlan,
                      price: parseFloat(e.target.value)
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={workoutPlan.currency}
                    onValueChange={(value) => setWorkoutPlan({ ...workoutPlan, currency: value })}
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
            </div>

            <div className="space-y-6">
              {workoutPlan.workoutDays.map((day, dayIndex) => (
                <Card key={dayIndex}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                      <CardTitle>
                        <Input
                          value={day.name}
                          onChange={(e) => {
                            const newWorkoutDays = [...workoutPlan.workoutDays];
                            newWorkoutDays[dayIndex].name = e.target.value;
                            setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
                          }}
                          className="h-7 px-2"
                        />
                      </CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeWorkoutDay(dayIndex)}
                    >
                      Remove Day
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="grid gap-4">
                        <div className="grid grid-cols-6 gap-4">
                          <div className="col-span-2">
                            <Label>Exercise</Label>
                            <Input
                              value={exercise.name}
                              onChange={(e) => {
                                const newWorkoutDays = [...workoutPlan.workoutDays];
                                newWorkoutDays[dayIndex].exercises[exerciseIndex].name = e.target.value;
                                setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
                              }}
                              placeholder="Exercise name"
                            />
                          </div>
                          <div>
                            <Label>Sets</Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => {
                                const newWorkoutDays = [...workoutPlan.workoutDays];
                                newWorkoutDays[dayIndex].exercises[exerciseIndex].sets = parseInt(e.target.value);
                                setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
                              }}
                            />
                          </div>
                          <div>
                            <Label>Reps</Label>
                            <Input
                              value={exercise.reps}
                              onChange={(e) => {
                                const newWorkoutDays = [...workoutPlan.workoutDays];
                                newWorkoutDays[dayIndex].exercises[exerciseIndex].reps = e.target.value;
                                setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
                              }}
                              placeholder="e.g., 12 or 8-12"
                            />
                          </div>
                          <div>
                            <Label>Rest (sec)</Label>
                            <Input
                              value={exercise.rest}
                              onChange={(e) => {
                                const newWorkoutDays = [...workoutPlan.workoutDays];
                                newWorkoutDays[dayIndex].exercises[exerciseIndex].rest = e.target.value;
                                setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
                              }}
                            />
                          </div>
                          <div>
                            <Label>&nbsp;</Label>
                            <Button
                              type="button"
                              variant="destructive"
                              className="w-full"
                              onClick={() => removeExercise(dayIndex, exerciseIndex)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            value={exercise.notes}
                            onChange={(e) => {
                              const newWorkoutDays = [...workoutPlan.workoutDays];
                              newWorkoutDays[dayIndex].exercises[exerciseIndex].notes = e.target.value;
                              setWorkoutPlan({ ...workoutPlan, workoutDays: newWorkoutDays });
                            }}
                            placeholder="Form cues, variations, etc."
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addExercise(dayIndex)}
                    >
                      Add Exercise
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addWorkoutDay}
                className="w-full"
              >
                Add Workout Day
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              Create Workout Plan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

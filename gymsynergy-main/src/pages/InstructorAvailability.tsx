import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useNavigate } from "react-router-dom";
import { X, Plus } from "lucide-react";

interface TimeSlot {
  start: string;
  end: string;
}

interface Availability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export default function InstructorAvailability() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Availability>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });

  useEffect(() => {
    fetchAvailability();
  }, [currentUser]);

  const fetchAvailability = async () => {
    if (!currentUser) return;

    try {
      const docRef = doc(db, 'instructor_profiles', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAvailability(data?.settings?.availability || {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        });
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load availability settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      const docRef = doc(db, 'instructor_profiles', currentUser.uid);
      await updateDoc(docRef, {
        'settings.availability': availability,
        updatedAt: new Date(),
      });

      toast({
        title: "Success",
        description: "Availability settings saved successfully",
      });
      navigate("/instructor/schedule");
    } catch (error) {
      console.error("Error saving availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save availability settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = (day: keyof Availability) => {
    setAvailability({
      ...availability,
      [day]: [
        ...availability[day],
        { start: "09:00", end: "17:00" },
      ],
    });
  };

  const removeTimeSlot = (day: keyof Availability, index: number) => {
    setAvailability({
      ...availability,
      [day]: availability[day].filter((_, i) => i !== index),
    });
  };

  const updateTimeSlot = (
    day: keyof Availability,
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    const newSlots = [...availability[day]];
    newSlots[index] = {
      ...newSlots[index],
      [field]: value,
    };
    setAvailability({
      ...availability,
      [day]: newSlots,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability Settings</h1>
          <p className="text-muted-foreground">
            Set your weekly availability schedule
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/instructor/schedule")}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(availability).map(([day, slots]) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="capitalize">{day}</CardTitle>
              <CardDescription>
                Set your available time slots for {day}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="grid gap-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(day as keyof Availability, index, 'start', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(day as keyof Availability, index, 'end', e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeTimeSlot(day as keyof Availability, index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => addTimeSlot(day as keyof Availability)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Time Slot
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

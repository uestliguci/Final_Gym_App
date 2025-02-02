import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, collection, query, where, getDocs, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { Calendar } from "../components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";

interface TimeSlot {
  start: string;
  end: string;
}

interface Availability {
  [key: string]: TimeSlot[];
}

interface Session {
  id: string;
  clientId: string;
  clientName: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: string;
  notes: string;
}

export default function InstructorSchedule() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      fetchAvailability();
      fetchSessions();
    }
  }, [currentUser, date]);

  const fetchAvailability = async () => {
    try {
      const docRef = doc(db, 'instructor_profiles', currentUser!.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAvailability(data?.settings?.availability || {});
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load availability",
      });
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const startDate = startOfDay(date);
      const endDate = addDays(startDate, 1);

      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('instructorId', '==', currentUser!.uid),
        where('date', '>=', startDate),
        where('date', '<', endDate)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsData = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as Session[];

      setSessions(sessionsData);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sessions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionStatusChange = async (sessionId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'sessions', sessionId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      setSessions(sessions.map(session => 
        session.id === sessionId ? { ...session, status: newStatus } : session
      ));

      toast({
        title: "Success",
        description: `Session marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating session status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update session status",
      });
    }
  };

  const getAvailableTimeSlots = () => {
    const dayOfWeek = format(date, 'EEEE').toLowerCase();
    return availability[dayOfWeek] || [];
  };

  const isTimeSlotAvailable = (timeSlot: TimeSlot) => {
    return !sessions.some(session => 
      session.startTime === timeSlot.start && 
      session.endTime === timeSlot.end &&
      isSameDay(session.date, date)
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Manage your sessions and availability
          </p>
        </div>
        <Button onClick={() => navigate("/instructor/availability")}>
          Set Availability
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>
              Select a date to view or schedule sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
            <CardDescription>
              {format(date, 'PPPP')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getAvailableTimeSlots().map((slot, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isTimeSlotAvailable(slot)
                      ? 'bg-secondary/50'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {slot.start} - {slot.end}
                      </p>
                      {!isTimeSlotAvailable(slot) && (
                        <p className="text-sm text-muted-foreground">
                          Booked
                        </p>
                      )}
                    </div>
                    {isTimeSlotAvailable(slot) && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/instructor/schedule-session?date=${format(date, 'yyyy-MM-dd')}&startTime=${slot.start}&endTime=${slot.end}`)}
                      >
                        Schedule Session
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Manage your scheduled sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{session.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.startTime} - {session.endTime}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.type}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      session.status === 'completed'
                        ? 'default'
                        : session.status === 'cancelled'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {session.status}
                  </Badge>
                  {session.status === 'scheduled' && (
                    <Select
                      onValueChange={(value) => 
                        handleSessionStatusChange(
                          session.id,
                          value as 'completed' | 'cancelled'
                        )
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Complete</SelectItem>
                        <SelectItem value="cancelled">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-center text-muted-foreground">
                No sessions scheduled for this day
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

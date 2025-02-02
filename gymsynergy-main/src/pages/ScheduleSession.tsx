import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { format } from "date-fns";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface SessionDetails {
  clientId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: string;
  notes: string;
}

export default function ScheduleSession() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails>({
    clientId: searchParams.get('clientId') || '',
    date: new Date(searchParams.get('date') || new Date()),
    startTime: searchParams.get('startTime') || '',
    endTime: searchParams.get('endTime') || '',
    type: 'one-on-one',
    notes: '',
  });

  useEffect(() => {
    fetchClients();
  }, [currentUser]);

  const fetchClients = async () => {
    if (!currentUser) return;

    try {
      const clientsQuery = query(
        collection(db, 'client_profiles'),
        where('instructorIds', 'array-contains', currentUser.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];

      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load clients",
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

      // Create session document
      const sessionRef = await addDoc(collection(db, 'sessions'), {
        instructorId: currentUser.uid,
        clientId: sessionDetails.clientId,
        clientName: clients.find(c => c.id === sessionDetails.clientId)?.name || '',
        date: sessionDetails.date,
        startTime: sessionDetails.startTime,
        endTime: sessionDetails.endTime,
        type: sessionDetails.type,
        notes: sessionDetails.notes,
        status: 'scheduled',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Success",
        description: "Session scheduled successfully",
      });

      navigate("/instructor/schedule");
    } catch (error) {
      console.error("Error scheduling session:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to schedule session",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Session</CardTitle>
            <CardDescription>
              Schedule a new session with a client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={sessionDetails.clientId}
                    onValueChange={(value) => setSessionDetails({
                      ...sessionDetails,
                      clientId: value,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={format(sessionDetails.date, 'yyyy-MM-dd')}
                    onChange={(e) => setSessionDetails({
                      ...sessionDetails,
                      date: new Date(e.target.value),
                    })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={sessionDetails.startTime}
                      onChange={(e) => setSessionDetails({
                        ...sessionDetails,
                        startTime: e.target.value,
                      })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={sessionDetails.endTime}
                      onChange={(e) => setSessionDetails({
                        ...sessionDetails,
                        endTime: e.target.value,
                      })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="type">Session Type</Label>
                  <Select
                    value={sessionDetails.type}
                    onValueChange={(value) => setSessionDetails({
                      ...sessionDetails,
                      type: value,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-on-one">One-on-One Training</SelectItem>
                      <SelectItem value="assessment">Fitness Assessment</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={sessionDetails.notes}
                    onChange={(e) => setSessionDetails({
                      ...sessionDetails,
                      notes: e.target.value,
                    })}
                    placeholder="Any special instructions or notes for the session"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/instructor/schedule")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Schedule Session
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

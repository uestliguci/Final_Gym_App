import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

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

interface InstructorProfileData {
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
    availability: Availability;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

export default function InstructorProfile() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<InstructorProfileData | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser) return;

      try {
        const docRef = doc(db, 'instructor_profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfileData(docSnap.data() as InstructorProfileData);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data",
        });
      }
    };

    fetchProfileData();
  }, [currentUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileData) return;

    try {
      setLoading(true);
      const docRef = doc(db, 'instructor_profiles', currentUser.uid);
      
      await updateDoc(docRef, {
        'profile.displayName': profileData.profile.displayName,
        'profile.bio': profileData.profile.bio,
        'profile.specialties': profileData.profile.specialties,
        'profile.updatedAt': new Date(),
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileData) return;

    try {
      setLoading(true);
      const docRef = doc(db, 'instructor_profiles', currentUser.uid);
      
      await updateDoc(docRef, {
        'fees.baseRate': profileData.fees.baseRate,
        'fees.sessionFee': profileData.fees.sessionFee,
        'fees.planFee': profileData.fees.planFee,
        'fees.currency': profileData.fees.currency,
      });

      toast({
        title: "Success",
        description: "Fees updated successfully",
      });
    } catch (error) {
      console.error("Error updating fees:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update fees",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileData) return;

    try {
      setLoading(true);
      const docRef = doc(db, 'instructor_profiles', currentUser.uid);
      
      await updateDoc(docRef, {
        'settings.availability': profileData.settings.availability,
      });

      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-10">
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information visible to clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.profile.displayName}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      profile: {
                        ...profileData.profile,
                        displayName: e.target.value
                      }
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.profile.bio}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      profile: {
                        ...profileData.profile,
                        bio: e.target.value
                      }
                    })}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="specialties">Specialties</Label>
                  <Input
                    id="specialties"
                    value={profileData.profile.specialties.join(", ")}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      profile: {
                        ...profileData.profile,
                        specialties: e.target.value.split(",").map(s => s.trim())
                      }
                    })}
                    placeholder="e.g., Yoga, HIIT, Strength Training"
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Fees</CardTitle>
              <CardDescription>
                Set your rates for different services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFeesUpdate} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="baseRate">Base Rate (per hour)</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    value={profileData.fees.baseRate}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      fees: {
                        ...profileData.fees,
                        baseRate: parseFloat(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="sessionFee">Session Fee</Label>
                  <Input
                    id="sessionFee"
                    type="number"
                    value={profileData.fees.sessionFee}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      fees: {
                        ...profileData.fees,
                        sessionFee: parseFloat(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="planFee">Workout Plan Fee</Label>
                  <Input
                    id="planFee"
                    type="number"
                    value={profileData.fees.planFee}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      fees: {
                        ...profileData.fees,
                        planFee: parseFloat(e.target.value)
                      }
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={profileData.fees.currency}
                    onValueChange={(value) => setProfileData({
                      ...profileData,
                      fees: {
                        ...profileData.fees,
                        currency: value
                      }
                    })}
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

                <Button type="submit" disabled={loading}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Availability</CardTitle>
              <CardDescription>
                Set your weekly availability schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAvailabilityUpdate} className="space-y-4">
                {Object.entries(profileData.settings.availability).map(([day, slots]) => (
                  <div key={day} className="grid gap-2">
                    <Label className="capitalize">{day}</Label>
                    {slots.map((slot, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const newSlots = [...slots];
                            newSlots[index] = { ...slot, start: e.target.value };
                            setProfileData({
                              ...profileData,
                              settings: {
                                ...profileData.settings,
                                availability: {
                                  ...profileData.settings.availability,
                                  [day]: newSlots
                                }
                              }
                            });
                          }}
                        />
                        <Input
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const newSlots = [...slots];
                            newSlots[index] = { ...slot, end: e.target.value };
                            setProfileData({
                              ...profileData,
                              settings: {
                                ...profileData.settings,
                                availability: {
                                  ...profileData.settings.availability,
                                  [day]: newSlots
                                }
                              }
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            const newSlots = slots.filter((_, i) => i !== index);
                            setProfileData({
                              ...profileData,
                              settings: {
                                ...profileData.settings,
                                availability: {
                                  ...profileData.settings.availability,
                                  [day]: newSlots
                                }
                              }
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newSlots = [...slots, { start: "09:00", end: "17:00" }];
                        setProfileData({
                          ...profileData,
                          settings: {
                            ...profileData.settings,
                            availability: {
                              ...profileData.settings.availability,
                              [day]: newSlots
                            }
                          }
                        });
                      }}
                    >
                      Add Time Slot
                    </Button>
                  </div>
                ))}

                <Button type="submit" disabled={loading}>
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

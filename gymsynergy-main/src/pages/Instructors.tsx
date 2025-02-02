import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UserRound, Mail, Calendar, Star } from "lucide-react";

const instructors = [
  {
    id: 1,
    name: "Sarah Johnson",
    specialty: "Yoga & Meditation",
    rating: 4.9,
    availability: "Mon-Fri",
    image: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 2,
    name: "Mike Thompson",
    specialty: "Strength Training",
    rating: 4.8,
    availability: "Tue-Sat",
    image: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: 3,
    name: "Emma Davis",
    specialty: "HIIT & Cardio",
    rating: 4.7,
    availability: "Mon-Thu",
    image: "https://i.pravatar.cc/150?img=3",
  },
];

const Instructors = () => {
  const { toast } = useToast();
  console.log("Instructors page rendered");

  const handleContact = (instructorName: string) => {
    console.log("Contact clicked for:", instructorName);
    toast({
      title: "Contact Request Sent",
      description: `Your message to ${instructorName} has been sent.`,
    });
  };

  const handleSchedule = (instructorName: string) => {
    console.log("Schedule clicked for:", instructorName);
    toast({
      title: "Scheduling Session",
      description: `Opening scheduler for ${instructorName}...`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Instructors</h1>
          <p className="text-gray-400">Connect with our expert fitness instructors</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors.map((instructor) => (
            <Card key={instructor.id} className="p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={instructor.image}
                  alt={instructor.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">{instructor.name}</h3>
                  <p className="text-gray-400">{instructor.specialty}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-400">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{instructor.rating}</span>
                <span className="mx-2">•</span>
                <Calendar className="w-4 h-4" />
                <span>{instructor.availability}</span>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleContact(instructor.name)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleSchedule(instructor.name)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Instructors;
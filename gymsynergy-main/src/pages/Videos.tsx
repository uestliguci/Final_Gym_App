import { DashboardLayout } from "../components/DashboardLayout";
import { VideoCard } from "../components/VideoCard";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/use-toast";
import { Plus, Filter } from "lucide-react";
import { useState } from "react";

const mockVideos = [
  {
    id: 1,
    title: "Full Body HIIT Workout",
    instructor: "Sarah Johnson",
    duration: "30 mins",
    thumbnail: "/placeholder.svg",
    likes: 245,
    views: 1200,
  },
  {
    id: 2,
    title: "Core Strength Basics",
    instructor: "Mike Chen",
    duration: "20 mins",
    thumbnail: "/placeholder.svg",
    likes: 180,
    views: 890,
  },
  {
    id: 3,
    title: "Yoga for Beginners",
    instructor: "Emma Wilson",
    duration: "45 mins",
    thumbnail: "/placeholder.svg",
    likes: 320,
    views: 1500,
  },
];

const Videos = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");

  const handleUpload = () => {
    toast({
      title: "Upload Video",
      description: "Video upload functionality coming soon!",
    });
    console.log("Upload video clicked");
  };

  const handleFilter = () => {
    toast({
      title: "Filter Applied",
      description: `Filtered videos by: ${filter}`,
    });
    console.log("Filter clicked", { filter });
  };

  return (
    <DashboardLayout>
      <div className="animate-fadeIn">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Workout Videos</h1>
          <div className="flex gap-4">
            <Button onClick={handleFilter} variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button onClick={handleUpload} className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Video
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Videos;

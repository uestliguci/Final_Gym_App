import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Heart, Share2, Play } from "lucide-react";

interface VideoCardProps {
  video: {
    id: number;
    title: string;
    instructor: string;
    duration: string;
    thumbnail: string;
    likes: number;
    views: number;
  };
}

export const VideoCard = ({ video }: VideoCardProps) => {
  const { toast } = useToast();

  const handlePlay = () => {
    toast({
      title: "Playing Video",
      description: `Now playing: ${video.title}`,
    });
    console.log("Play clicked", { videoId: video.id });
  };

  const handleLike = () => {
    toast({
      title: "Video Liked",
      description: "Thanks for liking this video!",
    });
    console.log("Like clicked", { videoId: video.id });
  };

  const handleShare = () => {
    toast({
      title: "Share Video",
      description: "Sharing options coming soon!",
    });
    console.log("Share clicked", { videoId: video.id });
  };

  return (
    <Card className="overflow-hidden bg-card hover:bg-gray-800 transition-colors">
      <div className="relative aspect-video bg-gray-800">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <Button
          variant="default"
          size="icon"
          className="absolute inset-0 m-auto bg-primary/80 hover:bg-primary"
          onClick={handlePlay}
        >
          <Play className="h-6 w-6" />
        </Button>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1">{video.title}</h3>
        <p className="text-sm text-gray-400 mb-2">
          {video.instructor} • {video.duration}
        </p>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex gap-4">
            <span>{video.views} views</span>
            <span>{video.likes} likes</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-primary"
              onClick={handleLike}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-primary"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
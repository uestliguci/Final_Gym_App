import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, collection, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../components/ui/use-toast";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Loader2, Video, X } from "lucide-react";

interface VideoContent {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  category: string;
  tags: string[];
  accessLevel: 'free' | 'premium' | 'subscription';
  price: number;
  currency: string;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  instructorId: string;
}

export default function InstructorVideos() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    category: "",
    tags: "",
    accessLevel: "free",
    price: 0,
    currency: "USD",
  });

  useEffect(() => {
    fetchVideos();
  }, [currentUser]);

  const fetchVideos = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const videosQuery = query(
        collection(db, 'videos'),
        where('instructorId', '==', currentUser.uid)
      );
      const videosSnapshot = await getDocs(videosQuery);
      const videosData = videosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as VideoContent[];

      setVideos(videosData);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load videos",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('video/')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a video file",
        });
        return;
      }
      setSelectedVideo(file);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select an image file",
        });
        return;
      }
      setSelectedThumbnail(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedVideo) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload video
      const storageVideoRef = ref(storage, `videos/${currentUser.uid}/${selectedVideo.name}`);
      await uploadBytes(storageVideoRef, selectedVideo);
      const videoUrl = await getDownloadURL(storageVideoRef);

      // Upload thumbnail if provided
      let thumbnailUrl = "";
      if (selectedThumbnail) {
        const storageThumbnailRef = ref(storage, `thumbnails/${currentUser.uid}/${selectedThumbnail.name}`);
        await uploadBytes(storageThumbnailRef, selectedThumbnail);
        thumbnailUrl = await getDownloadURL(storageThumbnailRef);
      }

      // Create video document
      const firestoreVideoRef = doc(collection(db, 'videos'));
      await setDoc(firestoreVideoRef, {
        ...newVideo,
        videoUrl,
        thumbnailUrl,
        tags: newVideo.tags.split(',').map(tag => tag.trim()),
        duration: 0, // This would be calculated from the actual video
        views: 0,
        likes: 0,
        instructorId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      // Reset form
      setNewVideo({
        title: "",
        description: "",
        category: "",
        tags: "",
        accessLevel: "free",
        price: 0,
        currency: "USD",
      });
      setSelectedVideo(null);
      setSelectedThumbnail(null);
      
      // Refresh videos list
      fetchVideos();
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload video",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (video: VideoContent) => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Delete video from Storage
      const videoRef = ref(storage, video.videoUrl);
      await deleteObject(videoRef);

      // Delete thumbnail if exists
      if (video.thumbnailUrl) {
        const thumbnailRef = ref(storage, video.thumbnailUrl);
        await deleteObject(thumbnailRef);
      }

      // Delete document from Firestore
      await deleteDoc(doc(db, 'videos', video.id));

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });

      // Refresh videos list
      fetchVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete video",
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          <p className="text-muted-foreground">
            Upload and manage your video content
          </p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
          <CardDescription>
            Share your expertise with your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  className="min-h-[100px]"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="video">Video File</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newVideo.category}
                  onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
                  placeholder="e.g., Strength Training"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={newVideo.tags}
                  onChange={(e) => setNewVideo({ ...newVideo, tags: e.target.value })}
                  placeholder="e.g., beginner, chest, workout"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="accessLevel">Access Level</Label>
                  <Select
                    value={newVideo.accessLevel}
                    onValueChange={(value) => setNewVideo({ ...newVideo, accessLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="subscription">Subscription Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newVideo.price}
                    onChange={(e) => setNewVideo({
                      ...newVideo,
                      price: parseFloat(e.target.value)
                    })}
                    disabled={newVideo.accessLevel === 'free'}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={newVideo.currency}
                    onValueChange={(value) => setNewVideo({ ...newVideo, currency: value })}
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

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}

            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                'Upload Video'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id}>
            <CardHeader>
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Badge
                  className="absolute top-2 right-2"
                  variant={video.accessLevel === 'free' ? 'secondary' : 'default'}
                >
                  {video.accessLevel}
                </Badge>
              </div>
              <CardTitle className="line-clamp-1">{video.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {video.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    {video.views.toLocaleString()} views
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {video.likes.toLocaleString()} likes
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(video)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

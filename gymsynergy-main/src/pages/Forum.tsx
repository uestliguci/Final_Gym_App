import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../components/ui/use-toast";
import { Label } from "../components/ui/label";
import { Icons } from "../components/ui/icons";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatDistanceToNow } from "date-fns";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes: number;
  comments: number;
  tags: string[];
}

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "No Internet Connection",
        description: "Please check your internet connection to view forum posts.",
      });
      return;
    }

    const q = query(
      collection(db, "forum_posts"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts: ForumPost[] = [];
      snapshot.forEach((doc) => {
        newPosts.push({ id: doc.id, ...doc.data() } as ForumPost);
      });
      setPosts(newPosts);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleCreatePost = async () => {
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "No Internet Connection",
        description: "Please check your internet connection and try again.",
      });
      return;
    }

    if (!currentUser || !userProfile) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a post.",
      });
      return;
    }

    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in both title and content.",
      });
      return;
    }

    try {
      setLoading(true);
      const now = Timestamp.now();
      const tags = newPostTags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag);

      await addDoc(collection(db, "forum_posts"), {
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        authorId: currentUser.uid,
        authorName: userProfile.displayName || "Anonymous",
        createdAt: now,
        updatedAt: now,
        likes: 0,
        comments: 0,
        tags,
      });

      setNewPostTitle("");
      setNewPostContent("");
      setNewPostTags("");
      setIsDialogOpen(false);

      toast({
        title: "Success",
        description: "Your post has been created.",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create post. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!navigator.onLine) {
      toast({
        variant: "destructive",
        title: "No Internet Connection",
        description: "Please check your internet connection and try again.",
      });
      return;
    }

    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to like posts.",
      });
      return;
    }

    try {
      const postRef = doc(db, "forum_posts", postId);
      const likesRef = collection(db, "forum_post_likes");
      
      // Check if user already liked the post
      const q = query(
        likesRef,
        where("postId", "==", postId),
        where("userId", "==", currentUser.uid)
      );
      const likeSnapshot = await getDocs(q);

      if (likeSnapshot.empty) {
        // User hasn't liked the post yet
        await addDoc(likesRef, {
          postId,
          userId: currentUser.uid,
          createdAt: Timestamp.now(),
        });

        const post = posts.find(p => p.id === postId);
        if (post) {
          await updateDoc(postRef, {
            likes: post.likes + 1,
          });
        }

        toast({
          title: "Success",
          description: "Post liked!",
        });
      } else {
        // User already liked the post
        toast({
          variant: "destructive",
          title: "Error",
          description: "You've already liked this post.",
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to like post. Please try again.",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Forum</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Post</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share your thoughts, questions, or experiences with the community.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="Enter your post title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Write your post content here..."
                  className="min-h-[200px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  placeholder="e.g., workout, nutrition, motivation"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreatePost} disabled={loading}>
                {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Posted by {post.authorName} •{" "}
                    {formatDistanceToNow(post.createdAt.toDate(), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLikePost(post.id)}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {post.likes}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{post.content}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

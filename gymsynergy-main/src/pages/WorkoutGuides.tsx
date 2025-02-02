import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { doc, collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../components/ui/use-toast";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, FileText, Trash2, Download } from "lucide-react";

interface WorkoutGuide {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  accessLevel: 'free' | 'premium' | 'subscription';
  price: number;
  currency: string;
  downloads: number;
  instructorId: string;
  instructorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function WorkoutGuides() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<WorkoutGuide[]>([]);
  const [showNewGuideDialog, setShowNewGuideDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newGuide, setNewGuide] = useState<{
    title: string;
    description: string;
    accessLevel: WorkoutGuide['accessLevel'];
    price: number;
    currency: string;
  }>({
    title: "",
    description: "",
    accessLevel: "free",
    price: 0,
    currency: "USD",
  });

  useEffect(() => {
    fetchGuides();
  }, [currentUser]);

  const fetchGuides = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const guidesQuery = query(
        collection(db, 'workout_guides'),
        where('instructorId', '==', currentUser.uid)
      );
      const guidesSnapshot = await getDocs(guidesQuery);
      const guidesData = guidesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as WorkoutGuide[];

      setGuides(guidesData);
    } catch (error) {
      console.error("Error fetching guides:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load workout guides",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.includes('pdf')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a PDF file",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedFile) return;

    try {
      setLoading(true);

      // Upload PDF file
      const fileRef = ref(storage, `guides/${currentUser.uid}/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      const fileUrl = await getDownloadURL(fileRef);

      // Create guide document
      const guideRef = await addDoc(collection(db, 'workout_guides'), {
        ...newGuide,
        fileUrl,
        fileName: selectedFile.name,
        downloads: 0,
        instructorId: currentUser.uid,
        instructorName: currentUser.displayName || 'Unknown Instructor',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast({
        title: "Success",
        description: "Workout guide uploaded successfully",
      });

      setShowNewGuideDialog(false);
      setSelectedFile(null);
      setNewGuide({
        title: "",
        description: "",
        accessLevel: "free",
        price: 0,
        currency: "USD",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchGuides();
    } catch (error) {
      console.error("Error uploading guide:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload workout guide",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (guide: WorkoutGuide) => {
    if (!confirm("Are you sure you want to delete this workout guide?")) return;

    try {
      setLoading(true);

      // Delete file from Storage
      const fileRef = ref(storage, guide.fileUrl);
      await deleteObject(fileRef);

      // Delete document from Firestore
      await deleteDoc(doc(db, 'workout_guides', guide.id));

      toast({
        title: "Success",
        description: "Workout guide deleted successfully",
      });
      fetchGuides();
    } catch (error) {
      console.error("Error deleting guide:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete workout guide",
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
          <h1 className="text-3xl font-bold tracking-tight">Workout Guides</h1>
          <p className="text-muted-foreground">
            Upload and manage your PDF workout guides
          </p>
        </div>
        <Button onClick={() => setShowNewGuideDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Guide
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <Card key={guide.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant={guide.accessLevel === 'free' ? 'secondary' : 'default'}>
                  {guide.accessLevel}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(guide)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle>{guide.title}</CardTitle>
              <CardDescription>{guide.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {guide.fileName}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={guide.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {guide.downloads} downloads
                  </div>
                  {guide.accessLevel !== 'free' && (
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {guide.price} {guide.currency}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showNewGuideDialog} onOpenChange={setShowNewGuideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Workout Guide</DialogTitle>
            <DialogDescription>
              Upload a PDF workout guide for your clients
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newGuide.title}
                  onChange={(e) => setNewGuide({ ...newGuide, title: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGuide.description}
                  onChange={(e) => setNewGuide({ ...newGuide, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accessLevel">Access Level</Label>
                <Select
                  value={newGuide.accessLevel}
                  onValueChange={(value: 'free' | 'premium' | 'subscription') => setNewGuide({ ...newGuide, accessLevel: value })}
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

              {newGuide.accessLevel !== 'free' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newGuide.price}
                      onChange={(e) => setNewGuide({
                        ...newGuide,
                        price: parseFloat(e.target.value)
                      })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={newGuide.currency}
                      onValueChange={(value) => setNewGuide({ ...newGuide, currency: value })}
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
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewGuideDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Upload Guide
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

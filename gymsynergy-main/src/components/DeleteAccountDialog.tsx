import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { deleteUser } from "firebase/auth";

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDeleteAccount = async () => {
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
        description: "No user is currently logged in.",
      });
      return;
    }

    try {
      setLoading(true);

      // Delete user data based on role
      if (userProfile?.role === 'instructor') {
        await deleteDoc(doc(db, 'instructor_profiles', currentUser.uid));
      } else {
        await deleteDoc(doc(db, 'client_profiles', currentUser.uid));
      }

      // Delete user profile
      await deleteDoc(doc(db, 'users', currentUser.uid));

      // Delete Firebase Auth user
      await deleteUser(currentUser);

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });

      // Navigate to home page
      navigate("/");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      let errorMessage = "Failed to delete account.";

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "For security reasons, please log out and log back in before deleting your account.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="password">
              Type "DELETE" to confirm
            </Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={password !== "DELETE" || loading}
          >
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

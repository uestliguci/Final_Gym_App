import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

interface UploadProgressCallback {
  (progress: number): void;
}

export const uploadFile = async (
  file: File,
  path: string,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create storage reference
    const storageRef = ref(storage, path);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Listen for state changes, errors, and completion
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Get upload progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        // Handle errors
        console.error("Upload error:", error);
        reject(error);
      },
      async () => {
        try {
          // Get download URL on completion
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error("Error getting download URL:", error);
          reject(error);
        }
      }
    );
  });
};

export const generateFilePath = (
  userId: string,
  workoutPlanId: string,
  fileName: string
): string => {
  // Sanitize filename
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
  
  // Generate timestamp
  const timestamp = new Date().getTime();
  
  // Return path: workout-guides/userId/workoutPlanId/timestamp_filename
  return `workout-guides/${userId}/${workoutPlanId}/${timestamp}_${sanitizedFileName}`;
};

// stores/profiles.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/supabase";
import { useAuthStore } from "./auth";

export const useProfilesStore = defineStore("profiles", () => {
  // State
  const profileImageUrl = ref("");
  const previewImageUrl = ref("");
  const selectedFile = ref(null);
  const imageUploading = ref(false);
  const successMessage = ref("");
  const errorMessage = ref("");

  // Constants
  const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  // Helper function to update profile image in database
  const updateProfileImageInDB = async (imageUrl) => {
    const auth = useAuthStore();

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ profile_picture_url: imageUrl })
        .eq("id", auth.user.id);

      if (error) {
        console.error("Profile image update error:", error);
        throw new Error(`Failed to update profile image: ${error.message}`);
      }

      // Refresh the auth profile to sync with database
      await auth.fetchProfile();

      return true;
    } catch (error) {
      console.error("Error updating profile image:", error);

      // Handle RLS errors specifically
      if (
        error.message.includes("row-level security") ||
        error.message.includes("RLS")
      ) {
        errorMessage.value =
          "Permission denied. Please check your account permissions or contact support.";
      } else {
        errorMessage.value =
          error.message || "Failed to update profile image. Please try again.";
      }

      return false;
    }
  };

  // Actions
  const initializeProfile = (profile) => {
    if (profile) {
      profileImageUrl.value = profile.profile_picture_url || "";
    }
  };

  const handleImageSelect = (file) => {
    if (!file) return;

    // Clear previous messages
    clearMessages();

    // Validate file type
    if (!allowedImageTypes.includes(file.type)) {
      errorMessage.value =
        "Please select a valid image file (JPEG, PNG, WebP, or GIF)";
      return false;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      errorMessage.value = "Image size must be less than 2MB";
      return false;
    }

    // Store the selected file and create preview
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImageUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
    return true;
  };

  const confirmImageUpload = async () => {
    if (!selectedFile.value) return false;

    imageUploading.value = true;
    clearMessages();

    try {
      // Convert image to base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(selectedFile.value);
      });

      // Update the database with the new image
      const success = await updateProfileImageInDB(base64Image);

      if (success) {
        // Update local state
        profileImageUrl.value = base64Image;

        // Clear preview state
        previewImageUrl.value = "";
        selectedFile.value = null;

        successMessage.value = "Profile picture uploaded successfully!";
        setTimeout(() => (successMessage.value = ""), 3000);

        return base64Image;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error processing image:", error);
      errorMessage.value = "Failed to process image. Please try again.";
      return false;
    } finally {
      imageUploading.value = false;
    }
  };

  const cancelImagePreview = () => {
    previewImageUrl.value = "";
    selectedFile.value = null;
    clearMessages();
  };

  const removeProfilePicture = async () => {
    imageUploading.value = true;
    clearMessages();

    try {
      // Update the database to remove the image
      const success = await updateProfileImageInDB("");

      if (success) {
        // Update local state
        profileImageUrl.value = "";

        successMessage.value = "Profile picture removed successfully!";
        setTimeout(() => (successMessage.value = ""), 3000);

        return "";
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error removing profile picture:", error);
      errorMessage.value =
        "Failed to remove profile picture. Please try again.";
      return false;
    } finally {
      imageUploading.value = false;
    }
  };

  const updateProfile = async (profileData) => {
    const auth = useAuthStore();

    try {
      const updateData = {
        first_name: profileData.first_name?.trim(),
        last_name: profileData.last_name?.trim(),
        profile_picture_url: profileImageUrl.value,
      };

      // Only include role if user is admin
      if (auth.isAdmin && profileData.role) {
        updateData.role = profileData.role;
      }

      // Remove undefined values
      Object.keys(updateData).forEach(
        (key) => updateData[key] === undefined && delete updateData[key]
      );

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", auth.user.id);

      if (error) {
        console.error("Profile update error:", error);
        throw new Error(`Failed to update profile: ${error.message}`);
      }

      successMessage.value = "Profile updated successfully!";

      // Refresh the auth profile
      await auth.fetchProfile();

      // Update local state with new profile data
      if (auth.profile) {
        profileImageUrl.value = auth.profile.profile_picture_url || "";
      }

      setTimeout(() => (successMessage.value = ""), 3000);
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);

      // Handle RLS errors specifically
      if (
        error.message.includes("row-level security") ||
        error.message.includes("RLS")
      ) {
        errorMessage.value =
          "Permission denied. Please check your account permissions or contact support.";
      } else {
        errorMessage.value =
          error.message || "Failed to update profile. Please try again.";
      }

      return false;
    }
  };

  const resetProfileForm = (originalProfile) => {
    if (originalProfile) {
      profileImageUrl.value = originalProfile.profile_picture_url || "";
    }

    // Clear preview state
    previewImageUrl.value = "";
    selectedFile.value = null;
    clearMessages();
  };

  const clearMessages = () => {
    successMessage.value = "";
    errorMessage.value = "";
  };

  // Computed
  const hasProfileImage = () => {
    const auth = useAuthStore();
    return !!auth.profile?.profile_picture_url;
  };

  const getProfileImageUrl = () => {
    const auth = useAuthStore();
    return auth.profile?.profile_picture_url || "";
  };

  return {
    // State
    profileImageUrl,
    previewImageUrl,
    selectedFile,
    imageUploading,
    successMessage,
    errorMessage,

    // Constants
    allowedImageTypes,
    MAX_FILE_SIZE,

    // Actions
    initializeProfile,
    handleImageSelect,
    confirmImageUpload,
    cancelImagePreview,
    removeProfilePicture,
    updateProfile,
    resetProfileForm,
    clearMessages,

    // Computed/Getters
    hasProfileImage,
    getProfileImageUrl,
  };
});

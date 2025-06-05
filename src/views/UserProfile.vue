<template>
  <div class="profile-container">
    <div class="profile-card">
      <h2 class="profile-title">Update Profile</h2>

      <!-- Profile Picture Section -->
      <div class="profile-picture-section">
        <div class="picture-container">
          <div class="picture-wrapper">
            <img
              v-if="
                profilesStore.previewImageUrl || profilesStore.profileImageUrl
              "
              :src="
                profilesStore.previewImageUrl || profilesStore.profileImageUrl
              "
              alt="Profile Picture"
              :class="{ 'preview-image': profilesStore.previewImageUrl }"
            />
            <div v-else class="placeholder">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                />
              </svg>
            </div>

            <!-- Upload Progress Overlay -->
            <div v-if="profilesStore.imageUploading" class="upload-overlay">
              <div class="upload-progress">
                <svg class="spinner" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Processing...</span>
              </div>
            </div>
          </div>

          <!-- Upload Button -->
          <label
            class="upload-button"
            :class="{ disabled: profilesStore.imageUploading }"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              @change="handleImageSelect"
              :disabled="profilesStore.imageUploading"
            />
          </label>
        </div>

        <!-- Preview Actions -->
        <div
          v-if="profilesStore.previewImageUrl && !profilesStore.imageUploading"
          class="preview-actions"
        >
          <button @click="confirmImageUpload" class="confirm-button">
            Confirm Upload
          </button>
          <button @click="cancelImagePreview" class="cancel-button">
            Cancel
          </button>
        </div>

        <!-- Remove Button -->
        <button
          v-if="profilesStore.profileImageUrl && !profilesStore.previewImageUrl"
          @click="removeProfilePicture"
          class="remove-button"
        >
          Remove Picture
        </button>

        <!-- File Type Info -->
        <p class="file-info">
          Supported formats: JPEG, PNG, WebP, GIF (max 2MB)
        </p>
      </div>

      <form @submit.prevent="updateProfile" class="profile-form">
        <div class="form-fields">
          <FormField
            v-model="form.first_name"
            type="text"
            label="First Name"
            placeholder="Enter your first name"
            :required="true"
            :error="errors.first_name"
          />

          <FormField
            v-model="form.last_name"
            type="text"
            label="Last Name"
            placeholder="Enter your last name"
            :required="true"
            :error="errors.last_name"
          />

          <!-- <FormField
            v-if="auth.isAdmin"
            v-model="form.role"
            type="select"
            label="Role"
            placeholder="Select a role"
            :options="roleOptions"
            :required="true"
            :error="errors.role"
          /> -->
        </div>

        <div class="button-group">
          <button type="submit" :disabled="loading" class="primary-button">
            <span v-if="loading" class="load-spinner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </span>
            <span v-else>Update Profile</span>
          </button>

          <button type="button" @click="resetForm" class="secondary-button">
            Reset
          </button>
        </div>
      </form>

      <!-- Success/Error Messages -->
      <div v-if="profilesStore.successMessage" class="message success">
        {{ profilesStore.successMessage }}
      </div>

      <div v-if="profilesStore.errorMessage" class="message error">
        {{ profilesStore.errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
// Updated script section for your Vue component
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useProfilesStore } from "@/stores/profiles";
import FormField from "../components/FormField.vue";

const auth = useAuthStore();
const profilesStore = useProfilesStore();

const form = ref({
  first_name: "",
  last_name: "",
  role: "",
});

const loading = ref(false);
const errors = ref({});
const fileInputRef = ref(null);

// Role options for the select dropdown
const roleOptions = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
];

onMounted(() => {
  if (auth.profile) {
    form.value.first_name = auth.profile.first_name || "";
    form.value.last_name = auth.profile.last_name || "";
    form.value.role = auth.profile.role || "user";

    // Initialize profile store with current profile
    profilesStore.initializeProfile(auth.profile);
  }
});

const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const success = profilesStore.handleImageSelect(file);
  if (!success) {
    // Clear the input if validation failed
    event.target.value = "";
  }
};

const confirmImageUpload = async () => {
  await profilesStore.confirmImageUpload();
  // Clear the file input
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

const cancelImagePreview = () => {
  profilesStore.cancelImagePreview();
  // Clear the file input
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};

// Updated to be async
const removeProfilePicture = async () => {
  await profilesStore.removeProfilePicture();
};

const validateForm = () => {
  errors.value = {};

  if (!form.value.first_name.trim()) {
    errors.value.first_name = "First name is required";
  } else if (form.value.first_name.length < 2) {
    errors.value.first_name = "First name must be at least 2 characters";
  }

  if (!form.value.last_name.trim()) {
    errors.value.last_name = "Last name is required";
  } else if (form.value.last_name.length < 2) {
    errors.value.last_name = "Last name must be at least 2 characters";
  }

  if (auth.isAdmin && !form.value.role) {
    errors.value.role = "Role is required";
  }

  return Object.keys(errors.value).length === 0;
};

const updateProfile = async () => {
  if (!validateForm()) return;

  loading.value = true;
  profilesStore.clearMessages();

  const success = await profilesStore.updateProfile({
    first_name: form.value.first_name,
    last_name: form.value.last_name,
    role: form.value.role,
  });

  loading.value = false;
};

const resetForm = () => {
  if (auth.profile) {
    form.value.first_name = auth.profile.first_name || "";
    form.value.last_name = auth.profile.last_name || "";
    form.value.role = auth.profile.role || "user";
  }

  // Reset profile store state
  profilesStore.resetProfileForm(auth.profile);

  errors.value = {};

  // Clear file input
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
};
</script>

<style lang="scss" scoped>
.profile-container {
  max-width: 32rem;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
}

.profile-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.profile-picture-section {
  margin-bottom: 1.5rem;
  text-align: center;

  .picture-container {
    position: relative;
    display: inline-block;

    .picture-wrapper {
      width: 6rem;
      height: 6rem;
      border-radius: 50%;
      overflow: hidden;
      background-color: #f3f4f6;
      margin: 0 auto 1rem;
      position: relative;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;

        &.preview-image {
          border: 2px solid #10b981;
          box-sizing: border-box;
        }
      }

      .placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;

        svg {
          width: 2rem;
          height: 2rem;
        }
      }

      .upload-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;

        .upload-progress {
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;

          .spinner {
            width: 1.5rem;
            height: 1.5rem;
            animation: spin 1s linear infinite;
          }

          span {
            font-size: 0.75rem;
          }
        }
      }
    }

    .upload-button {
      position: absolute;
      bottom: 0;
      right: 0;
      background-color: #10b981;
      color: white;
      border-radius: 50%;
      padding: 0.5rem;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover:not(.disabled) {
        background-color: #059669;
      }

      &.disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
      }

      svg {
        width: 1rem;
        height: 1rem;
      }

      input {
        display: none;
      }
    }
  }

  .preview-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1rem;

    .confirm-button {
      background-color: #10b981;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #059669;
      }
    }

    .cancel-button {
      background-color: #ef4444;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #dc2626;
      }
    }
  }

  .remove-button {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    cursor: pointer;
    transition: color 0.2s ease;
    background: none;
    border: none;

    &:hover {
      color: #dc2626;
    }
  }

  .file-info {
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }
}

.profile-form {
  .button-group {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;

    .primary-button {
      flex: 1;
      background-color: #10b981;
      color: white;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 3rem;
      height: 3rem;

      &:hover:not(:disabled) {
        background-color: #059669;
      }

      &:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
      }

      .load-spinner {
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
          animation: spin 1s linear infinite;
          margin-right: 0.75rem;
          height: 1.25rem;
          width: 1.25rem;
          color: white;
          flex-shrink: 0;
        }
      }
    }

    .secondary-button {
      padding: 0.75rem 1.5rem;
      border: 1px solid #d1d5db;
      color: #374151;
      border-radius: 0.5rem;
      background: white;
      cursor: pointer;
      transition: background-color 0.2s ease;
      min-height: 3rem;
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background-color: #f9fafb;
      }
    }
  }
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;

  &.success {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }

  &.error {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Responsive design
@media (max-width: 640px) {
  .profile-container {
    padding: 1rem;
  }

  .profile-card {
    padding: 1rem;
  }

  .profile-form {
    .button-group {
      flex-direction: column;

      .primary-button,
      .secondary-button {
        height: 2.75rem;
        min-height: 2.75rem;
      }

      .secondary-button {
        order: 2;
      }
    }
  }

  .profile-picture-section {
    .picture-container .picture-wrapper {
      width: 5rem;
      height: 5rem;
    }

    .preview-actions {
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>

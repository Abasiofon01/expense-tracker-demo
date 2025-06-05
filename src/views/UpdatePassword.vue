<template>
  <AuthForm
    :loading="loading"
    :error="error"
    :successMessage="successMessage"
    @submit="onSubmit"
    novalidate
  >
    <template #header> Reset Password </template>

    <PasswordInput
      id="newPassword"
      v-model="newPassword"
      type="password"
      name="newPassword"
      required
      :disabled="loading"
      placeholder="Enter new password"
    />

    <PasswordInput
      id="confirmPassword"
      v-model="confirmPassword"
      name="newPassword"
      required
      :disabled="loading"
      placeholder="Confirm new password"
    />

    <template #button-text> Update Password </template>
    <template #footer>
      Remembered? Back to <router-link to="/login">Login</router-link>
    </template>
  </AuthForm>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import AuthForm from "../components/AuthForm.vue";
import PasswordInput from "../components/PasswordInput.vue";

const router = useRouter();
const auth = useAuthStore();

const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const successMessage = ref("");

const onSubmit = async () => {
  // Clear previous errors
  error.value = "";

  // 1) Validate
  if (newPassword.value !== confirmPassword.value) {
    error.value = "Passwords do not match.";
    return;
  }
  if (newPassword.value.length < 6) {
    error.value = "Password must be at least 6 characters.";
    return;
  }

  loading.value = true;
  try {
    // 2) Update via Supabase (uses the “recovery” session under the hood)
    await auth.updatePassword(newPassword.value);

    successMessage.value =
      "Password updated successfully! Redirecting to login…";

    // 3) After 1.5 seconds, send them to /login
    setTimeout(() => {
      router.push({ name: "login" });
    }, 1500);
  } catch (err: any) {
    error.value = err.message || "Failed to update password.";
    console.error("Password update error:", err);
  } finally {
    loading.value = false;
  }
};
</script>

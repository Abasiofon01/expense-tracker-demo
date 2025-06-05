<template>
  <AuthForm
    :loading="loading"
    :error="error"
    :successMessage="successMessage"
    @submit="onSubmit"
  >
    <template #header>Forgot Password</template>
    <input
      v-model="email"
      autocomplete="email"
      type="email"
      placeholder="Your email"
    />
    <template #buttonText>Send Reset Link</template>
    <template #footer>
      Remembered? <router-link to="/login">Login</router-link>
    </template>
  </AuthForm>
</template>

<script setup>
import { ref } from "vue";
import AuthForm from "../components/AuthForm.vue";
import { useAuthStore } from "@/stores/auth";

const email = ref("");
const loading = ref(false);
const error = ref(null);
const successMessage = ref("");
const auth = useAuthStore();

async function onSubmit() {
  error.value = null;
  loading.value = true;
  try {
    await auth.forgotPassword(email.value);
    successMessage.value = "Reset link sent to your email.";
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

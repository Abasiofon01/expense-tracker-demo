<template>
  <AuthForm
    :loading="loading"
    :error="error"
    @submit="onSubmit"
    autocomplete="on"
    novalidate
  >
    <template #header>Login</template>

    <input
      v-model="email"
      type="email"
      placeholder="Email"
      autocomplete="email"
    />

    <PasswordInput
      id="password"
      name="currentPassword"
      v-model="password"
      placeholder="Password"
    />

    <template #buttonText>Login</template>

    <template #extra>
      <div v-if="isDemo" class="banner">
        <strong>Demo Login:</strong>
        <p><strong>Email:</strong> demouser@demo.com</p>
        <p><strong>Password:</strong> Demouser1</p>
      </div>
    </template>

    <template #footer>
      <router-link to="/forgot-password">Forgot password?</router-link>
      <p>
        Don't have an account?
        <router-link to="/signup">Signup</router-link>
      </p>
    </template>
  </AuthForm>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
import AuthForm from "../components/AuthForm.vue";
import PasswordInput from "../components/PasswordInput.vue";

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref(null);
const auth = useAuthStore();
const router = useRouter();

// This will be true only if VITE_DEMO_MODE is set to 'true'
const isDemo = import.meta.env.VITE_DEMO_MODE === "true";

async function onSubmit() {
  error.value = null;
  loading.value = true;
  try {
    await auth.signInWithPassword(email.value, password.value);
    router.push("/admin");
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

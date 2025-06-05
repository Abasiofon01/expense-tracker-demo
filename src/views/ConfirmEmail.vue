<template>
  <div class="confirm-email">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>Confirming your email...</p>
    </div>
    <div v-else-if="error" class="error">
      <div class="status-icon error-icon">✕</div>
      <h2>Email Confirmation Failed</h2>
      <p>{{ error }}</p>
      <router-link to="/login" class="btn btn-primary">Go to Login</router-link>
    </div>
    <div v-else class="success">
      <div class="status-icon success-icon">✓</div>
      <h2>Email Confirmed Successfully!</h2>
      <p>
        Your email has been verified. You will be automatically redirected to
        login in {{ countdown }} seconds.
      </p>
      <router-link to="/login" class="btn btn-primary"
        >Go to Login Now</router-link
      >
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { supabase } from "@/supabase";

const loading = ref(true);
const error = ref(null);
const countdown = ref(5);
const router = useRouter();
const route = useRoute();
let countdownInterval = null;

onMounted(async () => {
  try {
    // Check if there are URL fragments (hash) containing the confirmation tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      // Set the session with the tokens from the URL
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      // Email is now confirmed, start countdown and redirect
      countdownInterval = setInterval(() => {
        countdown.value--;
        if (countdown.value <= 0) {
          clearInterval(countdownInterval);
          router.push("/login");
        }
      }, 1000);
    } else {
      throw new Error("Invalid confirmation link");
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped>
.confirm-email {
  max-width: 450px;
  margin: 3rem auto;
  padding: 3rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.loading {
  color: #495057;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top: 4px solid #6c757d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.status-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  margin: 0 auto 1.5rem;
  color: white;
}

.success-icon {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
}

.error-icon {
  background: linear-gradient(135deg, #dc3545 0%, #e83e8c 100%);
  box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
}

.error {
  color: #721c24;
}

.success {
  color: #155724;
}

.error h2,
.success h2 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.error p,
.success p {
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #6c757d;
}

.loading p {
  font-size: 1.1rem;
  margin-top: 1rem;
}
</style>

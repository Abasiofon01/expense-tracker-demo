import "./style.scss";
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { supabase } from "./supabase";
import VueToast from "vue-toast-notification";
import "vue-toast-notification/dist/theme-sugar.css";

// TODO use toasters everywhwere

const pinia = createPinia();
const app = createApp(App);

app.use(VueToast, { position: "top-right" });
app.use(pinia);
app.use(router);

// Listen for Supabase auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  // console.log("Auth event:", event, session);

  if (event === "PASSWORD_RECOVERY") {
    // User clicked password recovery link and has a valid session
    // Redirect to update-password page if not already there
    if (router.currentRoute.value.name !== "update_password") {
      router.replace({ name: "update_password" });
    }
  }

  if (event === "SIGNED_OUT") {
    // Redirect to login when user signs out
    if (
      !["login", "signup", "forgot_password"].includes(
        router.currentRoute.value.name
      )
    ) {
      router.replace({ name: "login" });
    }
  }
});

app.mount("#app");
// Demo update

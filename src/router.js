import { createRouter, createWebHistory } from "vue-router";

// Layouts
import MainLayout from "./layouts/MainLayout.vue";
import AuthLayout from "./layouts/AuthLayout.vue";
import { useAuthStore } from "./stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: MainLayout,
      children: [
        {
          path: "",
          name: "financial_overview",
          component: () => import("./views/FinancialOverview.vue"),
        },
        {
          path: "balance-dashboard",
          name: "balance_dashboard",
          component: () => import("./views/BalanceDashboard.vue"),
        },
        {
          path: "admin",
          name: "admin_dashboard",
          component: () => import("./views/AdminDashboard.vue"),
          meta: { requiresAuth: true, requiresAdmin: true },
        },
        {
          path: "transactions",
          name: "transactions",
          component: () => import("./views/Transactions.vue"),
          meta: { requiresAuth: true },
        },
        {
          path: "profile",
          name: "UserProfile",
          component: () => import("./views/UserProfile.vue"),
          meta: { requiresAuth: true },
        },
        // TODO Add users management
        {
          path: "transaction-purposes",
          name: "transactipn_purposes",
          component: () => import("./views/TransactionPurposes.vue"),
          meta: { requiresAuth: true },
        },
      ],
    },
    {
      path: "/",
      component: AuthLayout,
      children: [
        {
          path: "login",
          name: "login",
          component: () => import("./views/Login.vue"),
        },
        {
          path: "signup",
          name: "signup",
          component: () => import("./views/Signup.vue"),
        },
        {
          path: "forgot-password",
          name: "forgot_password",
          component: () => import("./views/ForgotPassword.vue"),
        },
        {
          path: "update-password",
          name: "update_password",
          component: () => import("./views/UpdatePassword.vue"),
        },
        {
          path: "confirm-email",
          name: "confirm_email",
          component: () => import("./views/ConfirmEmail.vue"),
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: () => import("./views/NotFound.vue"),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore();

  // Handle protected routes
  if (to.meta.requiresAuth) {
    const user = await auth.fetchUser();
    if (!user) {
      return next({ name: "login" });
    }

    if (to.meta.requiresAdmin && !auth.isAdmin) {
      return next({ path: "/" });
    }
  }

  next();
});

export default router;

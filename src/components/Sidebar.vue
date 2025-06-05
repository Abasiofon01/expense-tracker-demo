<template>
  <div :class="['sidebar', isOpen ? 'open' : '']">
    <div class="sidebar-header" :style="{ height: `${topbarHeight}px` }">
      <h1 class="sidebar-title">Expense Tracker</h1>
      <button
        @click="$emit('close')"
        class="sidebar-close-btn"
        aria-label="Close sidebar"
      >
        <svg
          class="close-icon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div class="sidebar-content">
      <!-- Navigation -->
      <nav class="nav-links">
        <router-link
          v-for="item in menuItems"
          :key="item.route"
          :to="item.route"
          class="nav-link"
          active-class="nav-link-active"
          @click="$emit('close')"
        >
          <component :is="item.icon" class="nav-icon" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";

// SVG Icon Components
const DashboardIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
    </svg>
  `,
};

const BalanceIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
    </svg>
  `,
};

const AdminIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11.5C15.4,12.3 16,13.4 16,15C16,17.2 14.2,19 12,19C9.8,19 8,17.2 8,15C8,13.4 8.6,12.3 9.2,11.5V10.5C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,9.5V10H13.5V9.5C13.5,8.7 12.8,8.2 12,8.2Z" fill="currentColor"/>
    </svg>
  `,
};

const TransactionIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" fill="currentColor"/>
    </svg>
  `,
};

const PurposeIcon = {
  template: `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-5H19V4c0-.55-.45-1-1-1s-1 .45-1 1v2H8V4c0-.55-.45-1-1-1s-1 .45-1 1v2H4.5C3.67 6 3 6.67 3 7.5S3.67 9 4.5 9H6v8c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V9h1.5c.83 0 1.5-.67 1.5-1.5S20.33 6 19.5 6z" fill="currentColor"/>
    </svg>
  `,
};

const auth = useAuthStore();

const props = defineProps({
  isOpen: Boolean,
  topbarHeight: {
    type: Number,
    default: 72, // fallback height
  },
});
defineEmits(["close"]);

// Computed properties that react to auth store changes
const isAdmin = computed(() => auth.isAdmin);

const menuItems = computed(() => [
  { name: "Financial Overview", icon: DashboardIcon, route: "/" },
  {
    name: "Balance Dashboard",
    icon: BalanceIcon,
    route: "/balance-dashboard",
  },

  ...(isAdmin.value
    ? [
        {
          name: "Transactions",
          icon: TransactionIcon,
          route: "/transactions",
        },
        { name: "Admin Panel", icon: AdminIcon, route: "/admin" },
        {
          name: "Transaction Purposes",
          icon: PurposeIcon,
          route: "/transaction-purposes",
        },
      ]
    : []),
]);
</script>

<style scoped>
.sidebar {
  width: 16rem;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
}

/* Desktop (sticky sidebar) */
@media (min-width: 1024px) {
  .sidebar {
    width: 20rem;
    position: sticky;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 50;
    transform: translateX(0);
    height: 100dvh;
  }

  .sidebar-close-btn {
    display: none;
  }
}

/* Mobile (overlay sidebar) */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 50;
    transform: translateX(-100%);
  }

  .sidebar-header {
    padding: 1rem;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-close-btn {
    display: block;
    background: none;
    border: none;
    color: #374151;
    font-size: 1.25rem;
    cursor: pointer;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 1rem 1.5rem;
  border-bottom: 1px solid #dadcdf;
  /* Remove fixed min-height since we're using dynamic height */
  transition: height 0.3s ease;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: bold;
}

.sidebar-content {
  padding: 1rem;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  color: #374151;
  text-decoration: none;
  transition: background-color 0.2s ease-in-out;
  border-left: 2px solid transparent;
}

.nav-link:hover {
  border-radius: 0.5rem;
  background-color: #f3f4f6;
}

.router-link-exact-active:hover {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.router-link-exact-active {
  background-color: #f3f4f6;
  border-color: black;
  border-top-right-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>

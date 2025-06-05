<template>
  <div class="page-layout">
    <!-- Overlay for mobile -->
    <div v-if="sidebarOpen" @click="closeSidebar" class="mobile-overlay"></div>

    <!-- Sidebar -->
    <Sidebar
      :is-open="sidebarOpen"
      @close="closeSidebar"
      :topbarHeight="topbarHeight"
    />

    <!-- Main Content -->
    <main class="main">
      <!-- Top bar -->
      <nav ref="topbarRef" class="topbar">
        <div class="topbar-inner">
          <button @click="toggleSidebar" class="mobile-menu-btn">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <div class="topbar-icons">
            <div ref="profileMenuRef" class="relative">
              <button
                @click="toggleProfileMenu"
                class="icon-button profile circular"
              >
                <!-- User Avatar or Default Icon -->
                <div class="avatar-container">
                  <img
                    v-if="userAvatar"
                    :src="userAvatar"
                    :alt="`${displayName || 'User'} Avatar`"
                    class="avatar-image"
                  />
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    class="icon"
                  >
                    <path
                      d="M15.71,12.71a6,6,0,1,0-7.42,0,10,10,0,0,0-6.22,8.18,1,1,0,0,0,2,.22,8,8,0,0,1,15.9,0,1,1,0,0,0,1,.89h.11a1,1,0,0,0,.88-1.1A10,10,0,0,0,15.71,12.71ZM12,12a4,4,0,1,1,4-4A4,4,0,0,1,12,12Z"
                    />
                  </svg>
                </div>
              </button>

              <!-- Dropdown menu -->
              <div v-if="showProfileMenu" class="user-dropdown-menu">
                <div v-if="isAuthenticated" class="dropdown-header">
                  <div class="user-avatar">
                    <img
                      v-if="userAvatar"
                      :src="userAvatar"
                      :alt="`${displayName || 'User'} Avatar`"
                      class="dropdown-avatar"
                    />
                    <div v-else class="dropdown-avatar-placeholder">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M15.71,12.71a6,6,0,1,0-7.42,0,10,10,0,0,0-6.22,8.18,1,1,0,0,0,2,.22,8,8,0,0,1,15.9,0,1,1,0,0,0,1,.89h.11a1,1,0,0,0,.88-1.1A10,10,0,0,0,15.71,12.71ZM12,12a4,4,0,1,1,4-4A4,4,0,0,1,12,12Z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ fullName || "User" }}</div>
                    <div v-if="auth.profile?.role" class="user-role">
                      {{
                        auth.profile.role.charAt(0).toUpperCase() +
                        auth.profile.role.slice(1)
                      }}
                    </div>
                  </div>
                </div>
                <router-link
                  v-if="isAuthenticated"
                  :to="isAuthenticated ? '/profile' : '/login'"
                  class="user-dropdown-item"
                  @click="showProfileMenu = false"
                  >Profile</router-link
                >
                <button class="user-dropdown-item" @click="logout">
                  {{ isAuthenticated ? "Logout" : "Login" }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p class="username" v-if="displayName">Hello, {{ displayName }}</p>
      </nav>

      <!-- Page content -->
      <div class="page-content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import Sidebar from "../components/Sidebar.vue";
import { useAuthStore } from "../stores/auth";
import { useProfilesStore } from "../stores/profiles";
import { onClickOutside } from "@vueuse/core";

const router = useRouter();
const auth = useAuthStore();
const profilesStore = useProfilesStore();

const displayName = computed(() => {
  return auth.profile?.first_name;
});

const fullName = computed(() => {
  if (auth.profile?.first_name && auth.profile?.last_name) {
    return `${auth.profile.first_name} ${auth.profile.last_name}`;
  }
  return auth.profile?.first_name || auth.profile?.last_name || "";
});

const userAvatar = computed(() => {
  return auth.profile?.profile_picture_url || "";
});

const isAuthenticated = computed(() => {
  return auth.isAuthenticated;
});

const sidebarOpen = ref(false);
const showProfileMenu = ref(false);
const profileMenuRef = ref(null);
const topbarRef = ref(null);
const topbarHeight = ref(0);

const toggleSidebar = () => (sidebarOpen.value = !sidebarOpen.value);
const closeSidebar = () => (sidebarOpen.value = false);

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value;
};

onClickOutside(profileMenuRef, () => {
  showProfileMenu.value = false;
});

const logout = async () => {
  try {
    await auth.signOut();
    showProfileMenu.value = false;
    router.push({ name: "login" });
  } catch (error) {
    if (error.name !== "AuthSessionMissingError") {
      console.error("Logout error:", error);
    }

    showProfileMenu.value = false;
    router.push({ name: "login" });
  }
};

// Function to update topbar height
const updateTopbarHeight = async () => {
  await nextTick();
  if (topbarRef.value) {
    topbarHeight.value = topbarRef.value.offsetHeight;
  }
};

// Watch for authentication state changes
watch(isAuthenticated, updateTopbarHeight);
watch(displayName, updateTopbarHeight);

// Initialize auth state and height on component mount
onMounted(async () => {
  await auth.fetchUser();
  updateTopbarHeight();

  // Also update on window resize
  window.addEventListener("resize", updateTopbarHeight);
});
</script>

<style lang="scss" scoped>
.page-layout {
  min-height: 100vh;
  display: flex;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
  display: none;

  @media (max-width: 1023.98px) {
    display: block;
  }
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.5rem 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 30;

  @media (max-width: 1023.98px) {
    padding: 1rem;
    align-items: center;
  }

  .topbar-inner {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: space-between;
  }

  .mobile-menu-btn {
    display: none;
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #6b7280;

    @media (max-width: 1023.98px) {
      display: block;
    }

    .icon {
      width: 1.5rem;
      height: 1.5rem;
    }
  }

  .topbar-icons {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
  }

  .icon-button {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    color: #6b7280;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    border: 1px solid #e5e7eb;

    &:hover {
      background-color: #f3f4f6;
      color: #374151;
    }

    &.circular {
      border-radius: 50%;
      width: 2.5rem;
      height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      width: 1.25rem;
      height: 1.25rem;
    }
  }

  .avatar-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    overflow: hidden;

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .icon {
      width: 1.25rem;
      height: 1.25rem;
    }
  }

  .username {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }
}

.relative {
  position: relative;
}

.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 12rem;
  z-index: 50;
  overflow: hidden;

  .dropdown-header {
    padding: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .user-avatar {
      flex-shrink: 0;

      .dropdown-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        object-fit: cover;
      }

      .dropdown-avatar-placeholder {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background-color: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;

        svg {
          width: 1.25rem;
          height: 1.25rem;
        }
      }
    }

    .user-info {
      flex: 1;
      min-width: 0;

      .user-name {
        font-weight: 500;
        font-size: 0.875rem;
        color: #111827;
      }

      .user-role {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: capitalize;
      }
    }
  }

  .user-dropdown-item {
    display: block;
    width: 100%;
    padding: 0.75rem;
    color: #374151;
    text-decoration: none;
    font-size: 0.875rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f9fafb;
    }

    &:focus {
      outline: none;
      background-color: #f9fafb;
    }
  }
}

.page-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;

  @media (max-width: 1023.98px) {
    padding: 1rem;
  }
}

// Responsive adjustments
@media (max-width: 1023.98px) {
  .user-dropdown-menu {
    right: -0.5rem;
    min-width: 10rem;

    .dropdown-header {
      padding: 0.5rem;

      .user-avatar {
        .dropdown-avatar,
        .dropdown-avatar-placeholder {
          width: 2rem;
          height: 2rem;
        }
      }

      .user-info {
        .user-name {
          font-size: 0.8125rem;
        }
      }
    }
  }
}
</style>

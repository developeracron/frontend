<template>
  <div
    class="sidebar-container"
    v-bind="$attrs"
    :class="{ 'sidebar-inactive': !isMenuOpen && isMobileView }"
  >
    <div
      v-if="isMenuOpen && $route.name !== 'Login' && isMobileView"
      class="sidebar-overlay"
      @click="isMenuOpen = false"
    ></div>

    <div
      ref="sidebarRef"
      class="left-bar p-4"
      :class="{
        'menu-w': isMenuOpen || !isMobileView,
        'hidden-sidebar': !isMenuOpen && isMobileView,
      }"
      v-if="$route.name !== 'Login'"
    >
      <div
        id="leftBar"
        class="bg-surface-100 text-surface-900 rounded-xl py-4 px-4 h-full overflow-auto flex flex-col justify-content-between"
      >
        <div class="menu-content h-full flex flex-col justify-between">
          <div>
            <ul class="menu space-y-2">
              <a
                href="/dashboard"
                class="logo flex text-3xl font-bold mb-6 ml-4 text-surface-700 w-full"
              >
                <Logo class="w-52" />
              </a>
              <li
                v-for="item in filteredTopMenuItems"
                :key="item.label"
                class="menu-item w-full p-1 rounded-lg flex flex-col items-start justify-center transition-all text-surface-600 cursor-pointer hover:bg-surface-700 hover:text-surface-50 select-none"
                :class="{
                  'bg-surface-800 text-surface-50': $route.path.startsWith(
                    item.to
                  ),
                }"
                :aria-haspopup="item.haspopup"
                :aria-controls="item.controls"
                @click="item.command"
                :title="item.label"
                data-pd-tooltip="true"
              >
                <div
                  class="icon-item pl-3 pr-20 py-1 flex items-center gap-3"
                  :class="{
                    'text-surface-50': $route.path.startsWith(item.to),
                  }"
                >
                  <i :class="item.icon"></i>
                  <div>{{ item.label }}</div>
                </div>
              </li>
            </ul>
          </div>

          <div class="mt-auto">
            <ul class="menu space-y-2">
              <li
                v-for="item in bottomMenuItems"
                :key="item.label"
                class="menu-item w-full p-1 rounded-lg flex flex-col items-start justify-center transition-all text-surface-600 cursor-pointer hover:bg-surface-700 hover:text-surface-50 select-none"
                :class="{
                  'bg-surface-800 text-surface-50': $route.path.startsWith(
                    item.to
                  ),
                }"
                @click="item.command"
                :title="item.label"
                data-pd-tooltip="true"
              >
                <div
                  class="icon-item pl-3 pr-20 py-1 flex items-center gap-3"
                  :class="{
                    'text-surface-50': $route.path.startsWith(item.to),
                  }"
                >
                  <i :class="item.icon"></i>
                  <div>{{ item.label }}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="fixed inset-0 flex items-center justify-center z-50"
    >
      <ProgressSpinner />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import Logo from "./Logo.vue";
import { useConfirm } from "primevue/useconfirm";
import { useStore } from "@/store";
import { useToast } from "primevue/usetoast";
import ProgressSpinner from "primevue/progressspinner";

// Add this to handle attribute inheritance properly
defineOptions({
  inheritAttrs: false,
});

const confirm = useConfirm();
const toast = useToast();
const isMenuOpen = ref(false);
const sidebarRef = ref(null);
const menuButtonRef = ref(null);
const isMobileView = ref(window.innerWidth <= 990);
const isSmallMobileView = ref(window.innerWidth <= 500); // New ref for small screens
const isLoading = ref(false);

const menu = ref();
const store = useStore();

const userPermissions = computed(() => {
  const p =
    store?.me?.permissions ||
    store?.user?.permissions ||
    store?.permissions ||
    [];
  return Array.isArray(p) ? p : [];
});

const can = (permissionName) => userPermissions.value.includes(permissionName);

const canViewUsers = computed(() => can("users.manage"));
const canManageWorkflows = computed(
  () => can("workflows.manage") || can("workflows.full")
);

const router = useRouter();
const topMenuItems = ref([
  {
    label: "Dashboard",
    icon: "pi pi-home",
    command: () => {
      router.push("/dashboard");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/dashboard",
  },
  {
    label: "Pratica",
    icon: "pi pi-chart-line",
    command: () => {
      router.push("/allocations");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/allocations",
  },
  {
    label: "Anagrafica",
    icon: "pi pi-users",
    command: () => {
      router.push("/clients");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/clients",
  },
  {
    label: "Bando",
    icon: "pi pi-briefcase",
    command: () => {
      router.push("/tenders");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/tenders",
  },
  {
    label: "Fasi",
    icon: "pi pi-list",
    visible: () => canManageWorkflows.value,
    command: () => {
      router.push("/phases");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/phases",
  },
  {
    label: "Utenti",
    icon: "pi pi-user",
    visible: canViewUsers.value,
    command: () => {
      router.push("/users");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/users",
  },
  {
    label: "Calendario",
    icon: "pi pi-calendar",
    visible: () => isSmallMobileView.value,
    command: () => {
      router.push("/calendar");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/calendar",
  },
  {
    label: "Notifiche",
    icon: "pi pi-bell",
    visible: () => isSmallMobileView.value,
    command: () => {
      router.push("/notifications");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/notifications",
  },
  {
    label: "Ricerca",
    icon: "pi pi-search",
    visible: () => isSmallMobileView.value,
    command: () => {
      router.push("/search");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/search",
  },
]);

const bottomMenuItems = ref([
  {
    label: "Impostazioni",
    icon: "pi pi-cog",
    command: () => {
      router.push("/settings");
      if (isMobileView.value) {
        isMenuOpen.value = false;
      }
    },
    to: "/settings",
  },
  {
    label: "Logout",
    icon: "pi pi-sign-out",
    command: () => {
      confirm.require({
        message: "Sei sicuro di voler uscire?",
        header: "Conferma",
        icon: "pi pi-exclamation-triangle",
        acceptLabel: "Sì",
        acceptClass: "p-button-danger",
        rejectClass: "p-button-secondary",
        rejectLabel: "No",
        defaultFocus: "none",
        accept: async () => {
          try {
            isLoading.value = true;
            await store.logout();
            await router.push("/login");
          } catch (error) {
            toast.add({
              severity: "error",
              summary: "Errore",
              detail: error.response?.data?.message || "Logout fallito",
              life: 3000,
            });
          } finally {
            isLoading.value = false;
          }
        },
      });
    },
  },
]);

const filteredTopMenuItems = computed(() => {
  return topMenuItems.value.filter(
    (item) =>
      item.visible === undefined ||
      (typeof item.visible === "function" ? item.visible() : item.visible)
  );
});

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;

  window.dispatchEvent(
    new CustomEvent("sidebar-state-changed", {
      detail: { isOpen: isMenuOpen.value },
    })
  );
};

function isAdmin() {
  return true;
}

const handleClickOutside = (event) => {
  const confirmDialogEl = document.querySelector(".p-confirm-dialog");
  if (
    (confirmDialogEl && confirmDialogEl.contains(event.target)) ||
    event.target.closest(".p-confirm-dialog")
  ) {
    return;
  }

  let target = event.target;
  let isHamburgerMenu = false;

  while (target && !isHamburgerMenu) {
    if (target.classList && target.classList.contains("hamburger-menu")) {
      isHamburgerMenu = true;
      break;
    }
    target = target.parentElement;
  }

  if (isHamburgerMenu) {
    return;
  }

  if (
    isMenuOpen.value &&
    sidebarRef.value &&
    menuButtonRef.value &&
    !sidebarRef.value.contains(event.target) &&
    !menuButtonRef.value.contains(event.target)
  ) {
    isMenuOpen.value = false;

    window.dispatchEvent(
      new CustomEvent("sidebar-state-changed", {
        detail: { isOpen: isMenuOpen.value },
      })
    );
  }
};

const closeSidebar = () => {
  if (isMobileView.value && isMenuOpen.value) {
    isMenuOpen.value = false;

    window.dispatchEvent(
      new CustomEvent("sidebar-state-changed", {
        detail: { isOpen: false },
      })
    );
  }
};

onMounted(() => {
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
  }, 100);

  isMobileView.value = window.innerWidth <= 990;
  isSmallMobileView.value = window.innerWidth <= 500;

  window.addEventListener("resize", () => {
    isMobileView.value = window.innerWidth <= 990;
    isSmallMobileView.value = window.innerWidth <= 500;
  });

  window.addEventListener("toggle-sidebar", () => {
    toggleMenu();
  });

  router.afterEach(() => {
    closeSidebar();
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", () => {});
  window.removeEventListener("toggle-sidebar", () => {});
});

defineExpose({
  toggleMenu,
  isMenuOpen,
});
</script>

<style scoped>
.sidebar-container {
  position: relative;
  z-index: 2000; /* Set this high to ensure sidebar is on top */
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
  transition: opacity 0.3s ease;
}

.left-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 288px;
}

.hidden-sidebar {
  transform: translateX(-100%);
}

.menu-w {
  transform: translateX(0);
}

.floating-menu-button {
  position: fixed;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: var(--surface-800);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  bottom: 2rem;
  left: 2rem;
  z-index: 1001;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.floating-menu-button:hover {
  transform: scale(1.1);
  background-color: var(--surface-900);
}

.floating-menu-button i {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.floating-menu-button i.pi-times {
  transform: rotate(90deg);
}

.menu-item {
  transition: background-color 0.3s, color 0.3s;
}

.menu-item:hover {
  background-color: gray;
  color: white;
}

#leftBar {
  display: flex;
  flex-direction: column;
  height: 100%;
  transform-origin: left center;
  will-change: transform;
  box-shadow: 4px 0 8px rgba(0, 0, 0, 0.1);
}

@media (min-width: 991px) {
  .floating-menu-button {
    display: none;
  }
}

:deep(.app-content) {
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 990px) {
  .sidebar-overlay {
    display: block;
  }
}

.menu-w {
  transform: translateX(0) !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.sidebar-inactive {
  pointer-events: none;
}

.hidden-sidebar {
  transform: translateX(-100%) !important;
  pointer-events: none !important;
}
</style>

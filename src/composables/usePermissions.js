import { computed } from "vue";
import { useStore } from "@/store";

export function usePermissions() {
  const store = useStore();

  const permissions = computed(() => {
    const p = store?.me?.permissions || store?.user?.permissions || store?.permissions || [];
    return Array.isArray(p) ? p : [];
  });

  const can = (permissionName) => permissions.value.includes(permissionName);

  const canAny = (permissionList) => permissionList.some(can);

  return {
    permissions,
    can,
    canAny,
  };
}

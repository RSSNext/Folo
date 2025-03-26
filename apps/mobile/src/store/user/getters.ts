import { useUserStore } from "./store"

export const whoami = () => {
  return useUserStore.getState().whoami
}

export const role = () => {
  return useUserStore.getState().role
}

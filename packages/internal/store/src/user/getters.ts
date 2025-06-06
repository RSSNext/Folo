import { useUserStore } from "./store"

export const whoami = () => {
  return useUserStore.getState().whoami
}

export const role = () => {
  return useUserStore.getState().role
}

export const getUserList = (userIds: string[]) => {
  return userIds.map((id) => useUserStore.getState().users[id]).filter((i) => !!i)
}

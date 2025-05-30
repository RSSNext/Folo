export const removeAppSkeleton = () => {
  try {
    document.querySelector("#app-skeleton")?.remove()
  } catch {
    // ignore
  }
}

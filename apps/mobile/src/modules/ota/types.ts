export type OtaStatus = "idle" | "checking" | "downloading" | "ready" | "error"

export interface OtaState {
  status: OtaStatus
  pendingVersion: string | null
  errorMessage: string | null
}

export type OtaAction =
  | { type: "checking" }
  | { type: "downloading" }
  | { type: "downloaded"; version: string }
  | { type: "reset" }
  | { type: "failed"; message: string }

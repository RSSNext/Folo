import type { OtaAction, OtaState } from "./types"

export const initialOtaState: OtaState = {
  status: "idle",
  pendingVersion: null,
  errorMessage: null,
}

export const reduceOtaState = (state: OtaState, action: OtaAction): OtaState => {
  switch (action.type) {
    case "checking": {
      return {
        ...state,
        status: "checking",
        errorMessage: null,
      }
    }
    case "downloading": {
      return {
        ...state,
        status: "downloading",
        errorMessage: null,
      }
    }
    case "downloaded": {
      return {
        status: "ready",
        pendingVersion: action.version,
        errorMessage: null,
      }
    }
    case "failed": {
      return {
        ...state,
        status: "error",
        errorMessage: action.message,
      }
    }
    case "reset": {
      return initialOtaState
    }
    default: {
      return state
    }
  }
}

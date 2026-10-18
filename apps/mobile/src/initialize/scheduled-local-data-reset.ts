import { applyScheduledLocalDataReset } from "../lib/local-data-reset"

// Imported by main.tsx before anything else that may load the database, which opens it
applyScheduledLocalDataReset()

import path from "node:path"

import { DEV } from "@follow/shared"
import { app } from "electron"

if (DEV) app.setPath("userData", path.join(app.getPath("appData"), "Folo(dev)"))

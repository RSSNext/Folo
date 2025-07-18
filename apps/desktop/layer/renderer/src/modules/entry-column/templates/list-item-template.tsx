import { withFeature } from "~/lib/features"

import { ListItem as ListItemAI } from "./list-item-template.ai"
import { ListItem as ListItemLegacy } from "./list-item-template.legacy"

export const ListItem = withFeature("ai")(ListItemAI, ListItemLegacy)

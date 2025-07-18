import { withFeature } from "~/lib/features"

import { ListItem as ListItemAI } from "./list-item-template.ai"
import { ListItem as ListItemNormal } from "./list-item-template.normal"

export const ListItem = withFeature("ai")(ListItemAI, ListItemNormal)

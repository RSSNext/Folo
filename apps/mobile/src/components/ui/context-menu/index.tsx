// import { composeEventHandlers } from "@follow/utils"
// import { Vibration } from "react-native"
// import * as ZeegoContextMenu from "zeego/context-menu"

import { Fragment } from "react"

// import { isAndroid } from "@/src/lib/platform"

// export * as DropdownMenu from "zeego/dropdown-menu"

// const handleContextMenuOpenWithVibration = (open: boolean) => {
//   if (!isAndroid) return
//   if (open) {
//     Vibration.vibrate(10)
//   }
// }

// const ContextMenuRoot: typeof ZeegoContextMenu.Root = (props) => {
//   return (
//     <ZeegoContextMenu.Root
//       {...props}
//       onOpenChange={composeEventHandlers(props.onOpenChange, handleContextMenuOpenWithVibration)}
//     >
//       {/* Add your context menu items here */}
//     </ZeegoContextMenu.Root>
//   )
// }

// const ContextMenu = {
//   ...ZeegoContextMenu,
//   Root: ContextMenuRoot,
// }

// export { ContextMenu }

export const ContextMenu = {
  Root: Fragment,
  Trigger: Fragment,
  Content: () => null,
  Item: () => null,
  ItemTitle: () => null,
  ItemIcon: () => null,
  ItemSeparator: () => null,
  ItemCheckbox: () => null,
  ItemRadio: () => null,
  ItemSub: () => null,
  Portal: Fragment,
  Preview: () => null,
  Sub: () => null,
  SubTrigger: () => null,
  SubContent: () => null,
  CheckboxItem: () => null,
}

export const DropdownMenu = {
  Root: Fragment,
  Trigger: Fragment,
  Content: () => null,
  CheckboxItem: () => null,
  Item: () => null,
  ItemTitle: () => null,
  ItemIcon: () => null,
}

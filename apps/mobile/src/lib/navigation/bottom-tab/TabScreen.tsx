import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import type { FC, PropsWithChildren } from "react"
import { use, useEffect, useMemo } from "react"
import { StyleSheet } from "react-native"

import { IconNativeNameMap, IconNodeMap } from "@/src/constants/native-images"

import { isIOS } from "../../platform"
import { WrappedScreenItem } from "../WrappedScreenItem"
import { BottomTabContext } from "./BottomTabContext"
import { TabScreenWrapper } from "./native"
import { LifecycleEvents, ScreenNameRegister } from "./shared"
import type { TabScreenContextType } from "./TabScreenContext"
import { TabScreenContext } from "./TabScreenContext"
import type { ResolvedTabScreenProps, TabScreenComponent, TabScreenProps } from "./types"

export const TabScreen: FC<PropsWithChildren<Omit<TabScreenProps, "tabScreenIndex">>> = ({
  children,
  icon,
  activeIcon,
  ...props
}) => {
  const { tabScreenIndex } = props as any as TabScreenProps

  const {
    loadedableIndexAtom,
    currentIndexAtom,
    tabScreensAtom: tabScreens,
  } = use(BottomTabContext)

  const setTabScreens = useSetAtom(tabScreens)

  const mergedProps = useMemo((): ResolvedTabScreenProps => {
    const propsFromChildren: Partial<ResolvedTabScreenProps> = {}
    if (children && typeof children === "object") {
      const childType = (children as any).type as TabScreenComponent

      if ("lazy" in childType) {
        propsFromChildren.lazy = childType.lazy
      }
      if ("identifier" in childType && typeof childType.identifier === "string") {
        propsFromChildren.identifier = childType.identifier
      }
    }
    return {
      ...propsFromChildren,
      ...props,
      title: props.title,
      tabScreenIndex,
      icon: ({ focused, color }) => {
        const Icon = !focused ? icon : activeIcon

        const ResolvedIcon = IconNodeMap[Icon]

        return <ResolvedIcon color={color} height={24} width={24} />
      },
    }
  }, [activeIcon, children, icon, props, tabScreenIndex])
  useEffect(() => {
    setTabScreens((prev) => [
      ...prev,
      {
        ...mergedProps,
        tabScreenIndex,
      },
    ])

    return () => {
      setTabScreens((prev) =>
        prev.filter((tabScreen) => tabScreen.tabScreenIndex !== tabScreenIndex),
      )
    }
  }, [mergedProps, setTabScreens, tabScreenIndex])

  const currentSelectedIndex = useAtomValue(currentIndexAtom)

  const isSelected = useMemo(
    () => currentSelectedIndex === tabScreenIndex,
    [currentSelectedIndex, tabScreenIndex],
  )

  const [loadedableIndexSet, setLoadedableIndex] = useAtom(loadedableIndexAtom)

  const isLoadedBefore = loadedableIndexSet.has(tabScreenIndex)
  useEffect(() => {
    if (isSelected) {
      setLoadedableIndex((prev) => {
        prev.add(tabScreenIndex)
        return new Set(prev)
      })
    }
  }, [setLoadedableIndex, tabScreenIndex, isSelected])

  const ctxValue = useMemo<TabScreenContextType>(
    () => ({
      tabScreenIndex,
      identifierAtom: atom(mergedProps.identifier ?? ""),
      titleAtom: atom(mergedProps.title),
    }),
    [tabScreenIndex, mergedProps.identifier, mergedProps.title],
  )
  const shouldLoadReact = mergedProps.lazy ? isSelected || isLoadedBefore : true

  const render = !__DEV__ && isIOS ? true : isSelected
  return (
    <TabScreenWrapper
      style={StyleSheet.absoluteFill}
      title={mergedProps.title}
      icon={IconNativeNameMap[icon]}
      activeIcon={IconNativeNameMap[activeIcon]}
    >
      <TabScreenContext value={ctxValue}>
        {shouldLoadReact && render && (
          <WrappedScreenItem screenId={`tab-screen-${tabScreenIndex}`}>
            {children}
            <ScreenNameRegister />
            <LifecycleEvents isSelected={isSelected} />
          </WrappedScreenItem>
        )}
      </TabScreenContext>
    </TabScreenWrapper>
  )
}

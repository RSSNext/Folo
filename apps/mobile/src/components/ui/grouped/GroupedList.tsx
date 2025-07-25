import { cn } from "@follow/utils"
import { SymbolView } from "expo-symbols"
import type { FC, PropsWithChildren } from "react"
import * as React from "react"
import { Fragment } from "react"
import type { PressableProps, ViewProps } from "react-native"
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import type { SFSymbol } from "sf-symbols-typescript"
import { titleCase } from "title-case"

import { Text } from "@/src/components/ui/typography/Text"
import { CheckFilledIcon } from "@/src/icons/check_filled"
import { MingcuteRightLine } from "@/src/icons/mingcute_right_line"
import { accentColor, useColor } from "@/src/theme/colors"

import { PlatformActivityIndicator } from "../loading/PlatformActivityIndicator"
import {
  GROUPED_ICON_TEXT_GAP,
  GROUPED_LIST_ITEM_PADDING,
  GROUPED_LIST_MARGIN,
  GROUPED_SECTION_BOTTOM_MARGIN,
  GROUPED_SECTION_TOP_MARGIN,
} from "./constants"
import { GroupedInsetListCardItemStyle } from "./GroupedInsetListCardItemStyle"

interface GroupedInsetListCardProps {
  showSeparator?: boolean
  SeparatorComponent?: FC
  SeparatorElement?: React.ReactNode
}
interface BaseCellClassNames {
  className?: string
  leftClassName?: string
  rightClassName?: string
}
export const GroupedOutlineDescription: FC<{
  description: string
}> = ({ description }) => {
  return <Text className="text-secondary-label mx-9 mt-2 text-sm">{description}</Text>
}
export const GroupedInsetListCard: FC<
  PropsWithChildren & ViewProps & GroupedInsetListCardProps
> = ({
  children,
  className,
  showSeparator = true,
  SeparatorComponent,
  SeparatorElement,
  ...props
}) => {
  const nextChildren = React.useMemo(
    () => React.Children.toArray(children).filter(Boolean),
    [children],
  )
  return (
    <View
      {...props}
      style={[
        {
          marginHorizontal: GROUPED_LIST_MARGIN,
        },
        props.style,
      ]}
      className={cn(
        "bg-secondary-system-grouped-background flex flex-1 flex-col overflow-hidden rounded-[10px]",
        className,
      )}
    >
      {showSeparator
        ? nextChildren.map((child, index) => {
            const isLast = index === nextChildren.length - 1
            if (child === null) return null
            const isNavigationLink =
              React.isValidElement(child) &&
              // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
              ((child.type as Function).name === GroupedInsetListNavigationLink.name ||
                (child.type as any).itemStyle === GroupedInsetListCardItemStyle.NavigationLink)
            const NextSeparatorComponent =
              typeof SeparatorComponent === "function" ? <SeparatorComponent /> : undefined
            const NextSeparatorElement = SeparatorElement
              ? React.isValidElement(SeparatorElement)
                ? SeparatorElement
                : NextSeparatorComponent
              : NextSeparatorComponent
            return (
              <Fragment key={typeof child === "object" && "key" in child ? child.key : index}>
                {child}
                {!isLast &&
                  (NextSeparatorElement ?? (
                    <View
                      className={cn("bg-opaque-separator/70", isNavigationLink ? "ml-16" : "ml-4")}
                      style={{
                        height: StyleSheet.hairlineWidth,
                      }}
                    />
                  ))}
              </Fragment>
            )
          })
        : children}
    </View>
  )
}
export const GroupedInsetListSectionHeader: FC<{
  label: string
  marginSize?: "normal" | "small"
}> = ({ label, marginSize = "normal" }) => {
  return (
    <View
      style={{
        paddingHorizontal: GROUPED_LIST_ITEM_PADDING,
        marginHorizontal: GROUPED_LIST_MARGIN,
        marginTop:
          marginSize === "normal" ? GROUPED_SECTION_TOP_MARGIN : GROUPED_SECTION_TOP_MARGIN / 2,
        marginBottom: GROUPED_SECTION_BOTTOM_MARGIN,
      }}
    >
      <Text className="text-secondary-label" ellipsizeMode="tail" numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}
export const GroupedInsetListBaseCell: FC<
  PropsWithChildren &
    ViewProps & {
      as?: FC<any>
    }
> = ({ children, as, ...props }) => {
  const Component = as ?? View
  return (
    <Component
      {...props}
      className={cn("flex-row items-center justify-between py-4", props.className)}
      style={[
        {
          paddingHorizontal: GROUPED_LIST_ITEM_PADDING,
        },
        props.style,
      ]}
    >
      {children}
    </Component>
  )
}
export const GroupedInsetListNavigationLink: FC<
  {
    label: string
    icon?: React.ReactNode
    onPress: () => void
    disabled?: boolean
    postfix?: React.ReactNode
  } & BaseCellClassNames
> = ({ label, icon, onPress, disabled, className, leftClassName, rightClassName, postfix }) => {
  const rightIconColor = useColor("tertiaryLabel")
  return (
    <Pressable onPress={onPress} disabled={disabled} className={className}>
      {({ pressed }) => (
        <GroupedInsetListBaseCell
          className={cn(pressed ? "bg-system-fill" : undefined, disabled && "opacity-40")}
        >
          <View className={cn("flex-1 flex-row items-center justify-between", leftClassName)}>
            <View className="flex-row items-center">
              {icon}
              <Text className={"text-label"}>{label}</Text>
            </View>
            <View className={cn("-mr-2 ml-4 flex-row", rightClassName)}>
              {postfix}
              <MingcuteRightLine height={18} width={18} color={rightIconColor} />
            </View>
          </View>
        </GroupedInsetListBaseCell>
      )}
    </Pressable>
  )
}
export const GroupedInsetListNavigationLinkIcon: FC<
  {
    backgroundColor: string
  } & PropsWithChildren
> = ({ backgroundColor, children }) => {
  return (
    <View
      className="items-center justify-center rounded-[5px] p-1"
      style={{
        marginRight: GROUPED_ICON_TEXT_GAP,
        backgroundColor,
      }}
    >
      {children}
    </View>
  )
}
export const GroupedInsetListCell: FC<
  {
    label: string
    description?: string
    children?: React.ReactNode
    icon?: SFSymbol
    onPress?: () => void
  } & BaseCellClassNames
> = ({ label, description, children, className, leftClassName, rightClassName, icon, onPress }) => {
  return (
    <GroupedInsetListBaseCell
      className={cn("bg-secondary-system-grouped-background flex flex-1", className)}
      as={onPress ? TouchableOpacity : undefined}
      {...(onPress
        ? {
            onPress,
          }
        : {})}
    >
      <View className={cn("flex-1 gap-1", leftClassName)}>
        <View className="flex-row items-center gap-2">
          {!!icon && <SymbolView name={icon} size={20} tintColor="black" />}
          <Text className="text-label">{titleCase(label)}</Text>
        </View>
        {!!description && (
          <Text className="text-secondary-label text-sm leading-tight">{description}</Text>
        )}
      </View>

      <View className={cn("mb-auto ml-4 shrink-0", rightClassName)}>{children}</View>
    </GroupedInsetListBaseCell>
  )
}
export const GroupedInsetListActionCellRadio: FC<{
  label: string
  description?: string
  onPress?: () => void
  disabled?: boolean
  selected?: boolean
}> = ({ label, description, onPress, disabled, selected }) => {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <GroupedInsetListBaseCell
          className={cn(pressed ? "bg-system-fill" : undefined, disabled && "opacity-40")}
        >
          <View className="flex-1">
            <Text className="text-label">{label}</Text>
            {!!description && (
              <Text className="text-secondary-label text-sm leading-tight">{description}</Text>
            )}
          </View>

          <View className="ml-4 size-[18px]">
            {selected && <CheckFilledIcon height={18} width={18} color={accentColor} />}
          </View>
        </GroupedInsetListBaseCell>
      )}
    </Pressable>
  )
}
const OverlayInterectionPressable = ({
  children,
  ...props
}: PropsWithChildren & PressableProps) => {
  return (
    <Pressable {...props} className={cn("flex-1", props.className)}>
      {({ pressed }) => {
        return (
          <>
            {/* Pressed Overlay Effect */}
            {pressed && (
              <Animated.View
                className="bg-system-fill absolute inset-0"
                entering={FadeIn.duration(100)}
                exiting={FadeOut.duration(100)}
              />
            )}

            {children}
          </>
        )
      }}
    </Pressable>
  )
}
export const GroupedInsetListActionCell: FC<{
  label: string
  description?: string
  onPress?: () => void
  disabled?: boolean
  icon?: SFSymbol
}> = ({ label, description, onPress, disabled, icon }) => {
  const rightIconColor = useColor("tertiaryLabel")
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="bg-secondary-system-grouped-background"
    >
      {({ pressed }) => (
        <GroupedInsetListBaseCell
          className={cn(pressed ? "bg-system-fill" : undefined, disabled && "opacity-40")}
        >
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              {!!icon && <SymbolView name={icon} size={20} tintColor="black" />}
              <Text className="text-label">{label}</Text>
            </View>
            {!!description && (
              <Text className="text-secondary-label text-sm leading-tight">{description}</Text>
            )}
          </View>

          <View className="-mr-2 ml-4">
            <MingcuteRightLine height={18} width={18} color={rightIconColor} />
          </View>
        </GroupedInsetListBaseCell>
      )}
    </Pressable>
  )
}
export const GroupedInsetButtonCell: FC<{
  label: string
  onPress?: () => void
  disabled?: boolean
  style?: "destructive" | "primary"
}> = ({ label, onPress, disabled, style = "primary" }) => {
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      {({ pressed }) => (
        <GroupedInsetListBaseCell
          className={cn(pressed ? "bg-system-fill" : undefined, disabled && "opacity-40")}
        >
          <View className="flex-1 items-center justify-center">
            <Text className={`${style === "destructive" ? "text-red" : "text-label"}`}>
              {label}
            </Text>
          </View>
        </GroupedInsetListBaseCell>
      )}
    </Pressable>
  )
}
export const GroupedInformationCell: FC<{
  title: string
  description?: string
  icon?: React.ReactNode
  iconBackgroundColor?: string
  children?: React.ReactNode
}> = ({ title, description, icon, iconBackgroundColor, children }) => {
  return (
    <GroupedInsetListBaseCell className="flex-1 flex-col items-center justify-center rounded-[16px] p-6">
      {!!icon && (
        <View
          className="mb-3 size-[64px] items-center justify-center rounded-xl p-1"
          style={{
            backgroundColor: iconBackgroundColor,
          }}
        >
          {icon}
        </View>
      )}
      <Text className="text-label text-3xl font-bold">{title}</Text>
      {!!description && (
        <Text className="text-label mt-3 text-balance text-center text-base leading-tight">
          {description}
        </Text>
      )}
      {children}
    </GroupedInsetListBaseCell>
  )
}
export const GroupedPlainButtonCell: FC<
  {
    label: string
    textClassName?: string
  } & PressableProps
> = ({ label, textClassName, ...props }) => {
  return (
    <GroupedInsetListBaseCell as={OverlayInterectionPressable} {...(props as any)}>
      <Text className={cn("text-accent text-center", textClassName)}>{label}</Text>
    </GroupedInsetListBaseCell>
  )
}
export const GroupedInsetActivityIndicatorCell: FC = () => {
  return (
    <GroupedInsetListBaseCell className="flex-1 items-center justify-center py-4">
      <PlatformActivityIndicator />
    </GroupedInsetListBaseCell>
  )
}

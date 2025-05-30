import { jotaiStore } from "@follow/utils"
import { atom, Provider } from "jotai"
import RootSiblings from "react-native-root-siblings"

import { FullWindowOverlay } from "../../common/FullWindowOverlay"
import { ToastActionContext, ToastContainerContext } from "./ctx"
import { ToastContainer } from "./ToastContainer"
import type { BottomToastProps, CenterToastProps, ToastProps, ToastRef } from "./types"

export class ToastManager {
  private stackAtom = atom<ToastProps[]>([])
  private portal: RootSiblings | null = null

  private propsMap = {} as Record<number, ToastProps>
  private currentIndex = 0

  private defaultProps: Omit<ToastProps, "currentIndex"> = {
    duration: 3000,
    action: [],
    type: "info",
    variant: "bottom-stack",
    message: "",
    render: null,
    icon: null,
    canClose: true,
  }

  private toastRefs = {} as Record<number, ToastRef>

  private register(currentIndex: number, ref: ToastRef) {
    if (currentIndex in this.toastRefs) {
      console.warn("Conflict toast ref", currentIndex, this.toastRefs[currentIndex], ref)
    }
    this.toastRefs[currentIndex] = ref
    return () => {
      delete this.toastRefs[currentIndex]
    }
  }

  mount() {
    this.portal = new RootSiblings(
      (
        <FullWindowOverlay>
          <Provider store={jotaiStore}>
            <ToastContainerContext value={this.stackAtom}>
              <ToastActionContext value={{ register: this.register.bind(this) }}>
                <ToastContainer />
              </ToastActionContext>
            </ToastContainerContext>
          </Provider>
        </FullWindowOverlay>
      ),
    )
  }

  private push(props: ToastProps) {
    this.propsMap[props.currentIndex] = props
    jotaiStore.set(this.stackAtom, [...jotaiStore.get(this.stackAtom), props])
  }

  private remove(index: number) {
    delete this.propsMap[index]
    jotaiStore.set(
      this.stackAtom,
      jotaiStore.get(this.stackAtom).filter((toast) => toast.currentIndex !== index),
    )
  }

  private scheduleDismiss(index: number) {
    const props = this.propsMap[index]!

    if (props.duration === Infinity) {
      return
    }

    setTimeout(async () => {
      await this.toastRefs[index]?.dismiss()
      this.remove(index)
    }, props.duration)
  }

  // @ts-expect-error
  show(props: CenterToastProps): Promise<() => void>
  show(props: BottomToastProps): Promise<() => void>
  show(props: Omit<Partial<ToastProps>, "currentIndex">) {
    if (!this.portal) {
      this.mount()
    }

    const nextProps = { ...this.defaultProps, ...props }

    if (nextProps.canClose === false) {
      nextProps.duration = Infinity
    }

    if (nextProps.variant === "center-replace") {
      // Find and remove the toast if it exists
      const index = jotaiStore
        .get(this.stackAtom)
        .findIndex((toast) => toast.variant === "center-replace")
      if (index !== -1) {
        this.remove(index)
      }
    }

    const currentIndex = ++this.currentIndex
    this.push({ ...nextProps, currentIndex })
    this.scheduleDismiss(currentIndex)
    return () => this.remove(currentIndex)
  }
}

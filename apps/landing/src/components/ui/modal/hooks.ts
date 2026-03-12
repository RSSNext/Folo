import { createContext, use } from 'react'

export const ModalContext = createContext({
  dismiss: () => {},
})

export const useModal = () => {
  return use(ModalContext)
}

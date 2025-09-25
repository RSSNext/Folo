import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { RssosGenerator } from "./RssosGenerator"

export const RssosModal: React.FC = () => {
  return <RssosGenerator />
}

export const useRssosModal = () => {
  const { present } = useModalStack()

  return {
    openRssosModal: () => {
      present({
        title: "RSSOS Generator",
        content: RssosModal,
        resizeable: false,
        modalClassName: "max-w-[600px]",
      })
    },
  }
}
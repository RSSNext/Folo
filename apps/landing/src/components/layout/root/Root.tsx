import { Footer } from '~/components/layout/footer/Footer'

import { Content } from '../content/Content'

export const Root: Component = ({ children }) => {
  return (
    <>
      <header />
      <Content>{children}</Content>
      <Footer />
    </>
  )
}

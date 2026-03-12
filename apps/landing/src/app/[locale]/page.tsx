import * as React from 'react'

import { BuiltOpen } from '~/components/widgets/landing/BuiltOpen'
import { Features } from '~/components/widgets/landing/Features'
import { LandingHero } from '~/components/widgets/landing/Hero'
import { SocialProof } from '~/components/widgets/landing/SocialProof'

export default async function Home() {
  return (
    <>
      <LandingHero />
      <Features />
      {/* <ViewsShowcase /> */}
      {/* <Audience /> */}
      <SocialProof />
      <BuiltOpen />
    </>
  )
}

import { Geist } from 'next/font/google'

const sansFont = Geist({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
})

export { sansFont }

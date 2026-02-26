'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import { NormalContainer } from '~/components/layout/container/Normal'
import { Button } from '~/components/ui/button'

export default ({ error, reset }: any) => {
  const errorT = useTranslations('common.error')
  useEffect(() => {
    console.error(error)
    // captureException(error)
  }, [error])

  return (
    <NormalContainer>
      <div className="center flex min-h-[calc(100vh-10rem)] flex-col">
        <h2 className="mb-5">{errorT('title')}</h2>
        <Button variant="primary" onClick={reset}>
          {errorT('action')}
        </Button>
      </div>
    </NormalContainer>
  )
}

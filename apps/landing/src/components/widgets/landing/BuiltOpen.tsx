import { useTranslations } from 'next-intl'

import GithubTrending from '~/components/common/GithubTrending'

import { RepoStats } from './RepoStats'

export const BuiltOpen: Component = () => {
  const builtOpenT = useTranslations('landing.builtOpen')

  return (
    <section
      id="open"
      className="mx-auto mt-24 w-full max-w-[var(--container-max-width-2xl)] px-4 md:mt-28 lg:mt-32"
    >
      <div className="flex flex-col gap-8">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent/90">
            {builtOpenT('title')}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {builtOpenT('body')}
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            {builtOpenT('note')}
          </p>

          <div className="mt-5">
            <GithubTrending />
          </div>
        </div>

        <RepoStats />
      </div>
    </section>
  )
}

BuiltOpen.displayName = 'BuiltOpen'

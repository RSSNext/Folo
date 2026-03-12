import { APPLE_APP_SITE_ASSOCIATION } from '~/lib/apple-app-site-association'

export function GET() {
  return Response.json(APPLE_APP_SITE_ASSOCIATION, {
    headers: {
      'Cache-Control': 'public, max-age=300',
    },
  })
}

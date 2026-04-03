export const resolveCliSessionToken = ({
  preferredToken,
  cookieToken,
}: {
  preferredToken?: string
  cookieToken?: string
}) => cookieToken || preferredToken

const DEFAULT_DEV_SECRET = 'change-me'

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim()
  const isProduction = process.env.NODE_ENV === 'production'

  if (secret) {
    if (isProduction && secret === DEFAULT_DEV_SECRET) {
      throw new Error('JWT_SECRET cannot use the default value in production.')
    }
    return secret
  }

  if (isProduction) {
    throw new Error('JWT_SECRET is required in production environment.')
  }

  return DEFAULT_DEV_SECRET
}

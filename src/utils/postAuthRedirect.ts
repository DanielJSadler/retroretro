const POST_AUTH_REDIRECT_KEY = 'retro:post-auth-redirect'

function isSafeLocalPath(path: string) {
  return path.startsWith('/') && !path.startsWith('//')
}

export function rememberPostAuthRedirect(path: string) {
  if (typeof window === 'undefined' || !isSafeLocalPath(path)) return
  window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path)
}

export function consumePostAuthRedirect() {
  if (typeof window === 'undefined') return null

  const path = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)
  window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY)
  return path && isSafeLocalPath(path) ? path : null
}

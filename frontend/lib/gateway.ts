export const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080'


export const SESSION_COOKIE = 'qt_token'


export function extractSessionToken(res: Response): string | null {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] }
  const list = headers.getSetCookie?.() ?? []
  for (const raw of list) {
    const m = /(?:^|;\s*)session=([^;]+)/.exec(raw)
    if (m) return decodeURIComponent(m[1])
  }

  const single = res.headers.get('set-cookie')
  if (single) {
    const m = /session=([^;]+)/.exec(single)
    if (m) return decodeURIComponent(m[1])
  }
  return null
}

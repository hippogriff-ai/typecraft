import * as amplitude from '@amplitude/analytics-browser'

let initialized = false

export function initAnalytics(): void {
  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY
  if (!apiKey) return

  amplitude.init(apiKey, { defaultTracking: { sessions: true } })
  initialized = true
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (!initialized) return
  amplitude.track(name, properties)
}

export function setUserProperty(key: string, value: unknown): void {
  if (!initialized) return
  const identify = new amplitude.Identify()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identify.set(key, value as any)
  amplitude.identify(identify)
}

/** Reset module state (for testing) */
export function _resetForTesting(): void {
  initialized = false
}

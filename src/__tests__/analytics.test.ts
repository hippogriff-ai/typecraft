import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@amplitude/analytics-browser', () => {
  const setFn = vi.fn()
  class MockIdentify {
    set = setFn
  }
  return {
    init: vi.fn(),
    track: vi.fn(),
    Identify: MockIdentify,
    identify: vi.fn(),
    __mockSetFn: setFn,
  }
})

import * as amplitudeMock from '@amplitude/analytics-browser'
import { initAnalytics, trackEvent, setUserProperty, _resetForTesting } from '../lib/analytics'

// Access the mock set function via the module export
const mod = amplitudeMock as unknown as typeof amplitudeMock & { __mockSetFn: ReturnType<typeof vi.fn> }

beforeEach(() => {
  vi.clearAllMocks()
  _resetForTesting()
})

describe('initAnalytics', () => {
  it('calls amplitude.init when VITE_AMPLITUDE_API_KEY is set', () => {
    vi.stubEnv('VITE_AMPLITUDE_API_KEY', 'test-key-123')
    initAnalytics()
    expect(amplitudeMock.init).toHaveBeenCalledWith('test-key-123', { defaultTracking: { sessions: true } })
    vi.unstubAllEnvs()
  })

  it('does not call amplitude.init when API key is empty', () => {
    vi.stubEnv('VITE_AMPLITUDE_API_KEY', '')
    initAnalytics()
    expect(amplitudeMock.init).not.toHaveBeenCalled()
    vi.unstubAllEnvs()
  })
})

describe('trackEvent', () => {
  it('passes through when initialized', () => {
    vi.stubEnv('VITE_AMPLITUDE_API_KEY', 'test-key')
    initAnalytics()
    trackEvent('screen_viewed', { screen: 'menu' })
    expect(amplitudeMock.track).toHaveBeenCalledWith('screen_viewed', { screen: 'menu' })
    vi.unstubAllEnvs()
  })

  it('no-ops when not initialized', () => {
    trackEvent('screen_viewed', { screen: 'menu' })
    expect(amplitudeMock.track).not.toHaveBeenCalled()
  })

  it('works without properties', () => {
    vi.stubEnv('VITE_AMPLITUDE_API_KEY', 'test-key')
    initAnalytics()
    trackEvent('demo_completed')
    expect(amplitudeMock.track).toHaveBeenCalledWith('demo_completed', undefined)
    vi.unstubAllEnvs()
  })
})

describe('setUserProperty', () => {
  it('passes through when initialized', () => {
    vi.stubEnv('VITE_AMPLITUDE_API_KEY', 'test-key')
    initAnalytics()
    setUserProperty('total_rounds', 42)
    expect(mod.__mockSetFn).toHaveBeenCalledWith('total_rounds', 42)
    expect(amplitudeMock.identify).toHaveBeenCalled()
    vi.unstubAllEnvs()
  })

  it('no-ops when not initialized', () => {
    setUserProperty('total_rounds', 42)
    expect(amplitudeMock.identify).not.toHaveBeenCalled()
  })
})

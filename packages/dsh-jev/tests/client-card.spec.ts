// @vitest-environment jsdom
/**
 * Browser-half coverage for the Jev configuration card.
 *
 * Note: the published `@deepseek-ai/dsh-client-test-runtime@0.1.7-rc.2`
 * imports `dsh-client-ui-renderer/src/...` paths that the published renderer
 * does not ship, so the slot bench still cannot be loaded from npm at this
 * version (recorded in docs/upstream-compatibility.md). The test therefore
 * exercises the same layers directly: `apply()` against a recording fake
 * context for the registration wiring, and the real component with the real
 * controller for the interactions.
 */

import { act } from '@testing-library/react'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// 0.1.7-rc.2 renamed the client settings read/write face: `SettingsScope` /
// `SettingsScopeSnapshot` are no longer exported; `ConfigForm` /
// `ConfigFormSnapshot` are their published replacements, and the write methods
// now report acceptance as `Promise<boolean>`.
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import * as client from '../src/client/index.js'
import { JevCardController, type JevSettings } from '../src/client/jev-card-controller.js'
import { JevCard } from '../src/client/JevCard.js'
import { en } from '../src/client/locales.js'

interface RegisteredCard {
  readonly options: { name: string; key: string; locale?: string; inject?: () => unknown }
  readonly component: unknown
}

/** The ordered path ops the shared configuration form accepts (the real `mutate` argument). */
type JevWriteOps = Parameters<ConfigForm<JevSettings>['mutate']>[0]

/**
 * Write one JSON value at a dotted path, creating intermediate objects — the
 * documented `SettingsPathOpView` `set` semantics, "creating intermediate
 * objects" (`@deepseek-ai/dsh-settings/lib/types/types.d.ts:44–54`).
 */
function writeAtPath(target: Record<string, unknown>, path: readonly string[], value: unknown): void {
  let cursor = target
  for (const segment of path.slice(0, -1)) {
    const existing = cursor[segment]
    if (typeof existing !== 'object' || existing === null) {
      const created: Record<string, unknown> = {}
      cursor[segment] = created
      cursor = created
    } else {
      cursor = existing as Record<string, unknown>
    }
  }
  const last = path[path.length - 1]
  if (last !== undefined) cursor[last] = value
}

/** Remove the value at a path; a missing intermediate is a no-op. */
function removeAtPath(target: Record<string, unknown>, path: readonly string[]): void {
  let cursor: Record<string, unknown> | undefined = target
  for (const segment of path.slice(0, -1)) {
    if (cursor === undefined) return
    const existing: unknown = cursor[segment]
    if (typeof existing !== 'object' || existing === null) return
    cursor = existing as Record<string, unknown>
  }
  const last = path[path.length - 1]
  if (cursor !== undefined && last !== undefined) delete cursor[last]
}

/**
 * A faithful in-memory `ConfigForm<JevSettings>`.
 *
 * `mutate` applies the real path ops; `set`/`unset` address exactly ONE path
 * segment and delegate to the same write, mirroring the shipped implementation
 * (`@deepseek-ai/dsh-client-ui-settings/lib/client.js:1152–1170`:
 * `set(field, value) { return this.mutate([{ op: "set", path: [field], value }]) }`).
 * Deliberately NOT dotted-tolerant: a caller that writes a nested field with a
 * single dotted `set('skills.enabled', …)` writes a literal top-level
 * `"skills.enabled"` key, and the assertions below must fail when that happens.
 */
function fakeScope(initial: JevSettings): {
  scope: ConfigForm<JevSettings>
  mutate: ReturnType<typeof vi.fn>
} {
  let snapshot: ConfigFormSnapshot<JevSettings> = {
    status: 'ready',
    value: initial,
    base: initial,
    user: {},
    revision: 1,
    writable: true,
    mode: 'host',
  }
  const commit = (apply: (draft: Record<string, unknown>) => void): boolean => {
    const draft = structuredClone(snapshot.value ?? {}) as Record<string, unknown>
    apply(draft)
    snapshot = { ...snapshot, value: draft as JevSettings, revision: (snapshot.revision ?? 0) + 1 }
    return true
  }
  const mutate = vi.fn(async (ops: JevWriteOps): Promise<boolean> => {
    return commit(draft => {
      for (const op of ops) {
        if (op.op === 'unset') removeAtPath(draft, op.path)
        else writeAtPath(draft, op.path, op.value)
      }
    })
  })
  return {
    scope: {
      getSnapshot: () => snapshot,
      subscribe: () => () => {},
      mutate,
      set: async (field, value) => commit(draft => writeAtPath(draft, [field], value)),
      unset: async (field) => commit(draft => removeAtPath(draft, [field])),
    },
    mutate,
  }
}

function fakeClientContext(form: ConfigForm<JevSettings>, registered: RegisteredCard[]) {
  return {
    configForms: { get: () => form },
    locale: { register: () => () => {} },
    slots: {
      inject: (_key: string, register: () => unknown) => register(),
      register: (options: RegisteredCard['options'], component: unknown) => {
        registered.push({ options, component })
        return () => {}
      },
    },
    effect: (callback: () => unknown, _label?: string) => callback(),
  }
}

let view: ReturnType<typeof render> | undefined
afterEach(() => {
  view?.unmount()
  view = undefined
})

describe('jev client card', () => {
  it('registers the bundle page under the package name with locale and inject face', () => {
    const { scope } = fakeScope({ provider: 'mock', mode: 'shadow' })
    const registered: RegisteredCard[] = []
    client.apply(fakeClientContext(scope, registered) as never)

    expect(registered).toHaveLength(1)
    expect(registered[0]?.options.name).toBe('plugins.bundle.config')
    expect(registered[0]?.options.key).toBe('@buberlo/dsh-jev')
    expect(registered[0]?.options.locale).toBe('settings.jev')
    // 0.1.7-rc.2 delivers the card's face through the registration's `inject`
    // hook rather than binding a scope at apply() time.
    expect(typeof registered[0]?.options.inject).toBe('function')
    expect(typeof registered[0]?.component).toBe('function')
  })

  it('renders the page and writes a mode change through the controller', async () => {
    const { scope, mutate } = fakeScope({ provider: 'mock', mode: 'shadow' })
    const face = new JevCardController(scope).inject()
    view = render(createElement(JevCard, {
      view: 'page',
      t: (key: keyof typeof en) => en[key],
      ...face,
    } as never))

    expect(view.container.textContent).toContain('DeepSeek Harness plans, calls tools, and runs them.')
    expect(view.container.textContent).toContain('mock')
    const enforce = view.getByRole('button', { name: 'Enforce' })
    await act(async () => { enforce.click() })
    expect(mutate).toHaveBeenCalledWith([{ op: 'set', path: ['mode'], value: 'enforce' }])
    expect(scope.getSnapshot().value?.mode).toBe('enforce')
  })

  it('renders feature state and writes a toggle', async () => {
    const { scope, mutate } = fakeScope({
      provider: 'mock',
      mode: 'shadow',
      skills: { enabled: false },
    })
    const face = new JevCardController(scope).inject()
    view = render(createElement(JevCard, {
      view: 'page',
      t: (key: keyof typeof en) => en[key],
      ...face,
    } as never))

    const skills = view.getByRole('checkbox', { name: /Skill routing/ })
    expect((skills as HTMLInputElement).checked).toBe(false)
    await act(async () => { skills.click() })
    // A nested field must travel as ONE path mutation: a dotted single-segment
    // write would land as a literal top-level "skills.enabled" key instead.
    expect(mutate).toHaveBeenCalledWith([{ op: 'set', path: ['skills', 'enabled'], value: true }])
    expect(scope.getSnapshot().value?.skills?.enabled).toBe(true)
  })

  it('switches the provider and writes a write-only API key', async () => {
    const { scope, mutate } = fakeScope({ provider: 'mock', mode: 'shadow' })
    const face = new JevCardController(scope).inject()
    view = render(createElement(JevCard, {
      view: 'page',
      t: (key: keyof typeof en) => en[key],
      ...face,
    } as never))

    const live = view.getByRole('button', { name: 'live' })
    await act(async () => { live.click() })
    expect(mutate).toHaveBeenCalledWith([{ op: 'set', path: ['provider'], value: 'live' }])
    expect(scope.getSnapshot().value?.provider).toBe('live')

    const key = view.getByPlaceholderText('Paste a TypeSafe API key')
    await act(async () => {
      key.setAttribute('value', 'ts-test-key')
      key.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const save = view.getByRole('button', { name: 'Save key' })
    await act(async () => { save.click() })
    expect(mutate).toHaveBeenCalledWith([{ op: 'set', path: ['apiKey'], value: 'ts-test-key' }])
    // The value never stays in the DOM after saving.
    expect((view.getByPlaceholderText('Paste a TypeSafe API key') as HTMLInputElement).value).toBe('')
  })

  it('renders the one-line summary for the bundle page', () => {
    const { scope } = fakeScope({ provider: 'mock', mode: 'shadow' })
    const face = new JevCardController(scope).inject()
    view = render(createElement(JevCard, {
      view: 'summary',
      t: (key: keyof typeof en) => en[key],
      ...face,
    } as never))
    expect(view.container.textContent).toContain('Fast structured decisions along the DSH agent loop.')
  })

  it('shows the unavailable state without controls', () => {
    const unavailable: ConfigForm<JevSettings> = {
      getSnapshot: () => ({
        status: 'unavailable',
        value: undefined,
        base: undefined,
        user: undefined,
        revision: undefined,
        writable: false,
        mode: 'host',
      }),
      subscribe: () => () => {},
      mutate: async () => false,
      set: async () => false,
      unset: async () => false,
    }
    const face = new JevCardController(unavailable).inject()
    view = render(createElement(JevCard, {
      view: 'page',
      t: (key: keyof typeof en) => en[key],
      ...face,
    } as never))
    expect(view.container.textContent).toContain('Settings are not available in this deployment')
    expect(view.container.querySelector('button[type="button"]')).toBeNull()
  })
})

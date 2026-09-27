/**
 * Host-half settings integration against the real 0.1.7-rc.2 settings document.
 *
 * In 0.1.7-rc.2 `ctx.settings` is no longer a per-plugin section registry: the
 * settings document IS the active profile's Cordis patch, and a form exists for
 * every active Loader entry whose Config declares `.volatile()` fields
 * (`@deepseek-ai/dsh-settings`). So this test boots the real stack rather than a
 * double:
 *
 *   real Loader (`@deepseek-ai/cordis-plugin-loader`)
 *   + a real on-disk profile (`@deepseek-ai/dsh-app-boot`'s `initProfile` and
 *     `mountRootInclude`, in a temporary directory)
 *   + the real profile patch writer (`@deepseek-ai/dsh-config-editor`)
 *   + the real settings service (`@deepseek-ai/dsh-settings`)
 *   + this package's real `JevRuntime`.
 *
 * Only two things are stand-ins, both for module resolution and neither inside
 * the code under test: the row's module is registered in the Loader's own
 * `builtins` map under the `cordis:` scheme (the same mechanism the product uses
 * for `cordis:include`), so no build output is required; and the profile lives
 * in a temp directory, so the user's real DSH profile is never touched.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { initProfile, mountRootInclude, readProfilePatches, type ProfileContext } from '@deepseek-ai/dsh-app-boot'
import ConfigEditor from '@deepseek-ai/dsh-config-editor'
import SettingsForms from '@deepseek-ai/dsh-settings'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import JevPlugin from '../src/index.js'

const contexts: Context[] = []
const dirs: string[] = []
afterEach(async () => {
  vi.unstubAllEnvs()
  for (const ctx of contexts.splice(0)) {
    try {
      await ctx.fiber.dispose()
    } catch {
      // Already disposed.
    }
  }
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

/** Settle any Loader work a committed write left pending. */
const settle = (ctx: Context): Promise<void> => ctx.loader.await()

/**
 * The bundle-style layer that inserts the `jev` row, exactly as this package's
 * `cordis.patch.yml` does in a real profile (a deployed profile reaches the row
 * through a bundle patch, never through the leaf config).
 * @param extra - additional row-config lines, indented by the caller.
 * @returns the profile patch document.
 */
function patchYml(extra: readonly string[] = []): string {
  return [
    '- insert:',
    '    - id: jev',
    '      name: cordis:jev',
    '      config:',
    '        provider: mock',
    '        mode: shadow',
    '        selection:',
    '          enabled: true',
    '        assessment:',
    '          enabled: true',
    '        loopDetection:',
    '          enabled: true',
    ...extra.map(line => `        ${line}`),
    '',
  ].join('\n')
}

/**
 * Boot a temporary DSH profile whose only row is this plugin, then settle the
 * whole Loader tree so the assertions see a mounted plugin.
 * @param extra - additional row-config lines, indented by the caller.
 * @returns the root context; the settings document serves the `jev` entry on it.
 */
async function mountProfile(extra: readonly string[] = []): Promise<Context> {
  const root = mkdtempSync(join(tmpdir(), 'dsh-jev-settings-'))
  dirs.push(root)
  const home = join(root, 'home')
  const profileDir = join(root, 'profile')
  mkdirSync(home, { recursive: true })
  // DSH home resolution is process-global and does not read the profile context
  // (`@deepseek-ai/dsh-home-paths`: configured ?? `$DSH_HOME` ?? `~/.dsh`), so the
  // environment is pinned to this test's temp home for the fixture's lifetime and
  // restored by `afterEach`. Without this the test would read the machine's live
  // harness home, and its result would depend on that machine's layers.
  vi.stubEnv('DSH_HOME', home)
  initProfile(profileDir, [])
  writeFileSync(join(profileDir, 'cordis.patch.yml'), patchYml(extra))
  const configPath = join(profileDir, 'cordis.yml')
  writeFileSync(configPath, '[]\n')

  const ctx = new Context()
  contexts.push(ctx)
  await mountAgentLoopTestDependencies(ctx)
  await ctx.plugin(Loader, {})
  // The row names `cordis:jev`; the Loader's own builtin map is how a host mounts a
  // module it already holds (the product mounts `cordis:include` the same way).
  ctx.loader.builtins.jev = { default: JevPlugin }
  const profileContext: ProfileContext = {
    name: 'jev-test',
    dir: profileDir,
    patchPath: join(profileDir, 'cordis.patch.yml'),
    installAnchor: join(process.cwd(), 'package.json'),
    cwd: root,
    home,
    startedBundles: [],
    overlays: [],
    telemetryDisabledEnv: undefined,
  }
  ctx.effect(() => ctx.provide('profileContext', profileContext), 'dsh-jev test: temporary profile context')
  await mountRootInclude(ctx, configPath, readProfilePatches('dsh-jev-test', profileContext), undefined, 'dsh-jev-test')
  await ctx.plugin(ConfigEditor)
  await ctx.plugin(SettingsForms)
  await ctx.loader.await()
  if (ctx.get('jev') === undefined) {
    throw new Error('dsh-jev test harness: the jev entry did not mount from the temporary profile')
  }
  return ctx
}

describe('jev settings section', () => {
  it('projects the jev profile entry with the composed entry as its value', async () => {
    const ctx = await mountProfile()
    const rows = ctx.settings.describe({ redactSecrets: true })
    const row = rows.find(candidate => candidate.ns === 'jev')
    expect(row).toBeDefined()
    const value = row?.value as { mode?: string; provider?: string } | undefined
    expect(value?.mode).toBe('shadow')
    expect(value?.provider).toBe('mock')
    // `apiKey` carries role('secret'): the wire view never carries the value,
    // it reports only whether the slot is set.
    expect(row?.secrets?.some(secret => secret.path.join('.') === 'apiKey')).toBe(true)
    expect(JSON.stringify(row?.value)).not.toContain('apiKey')
  })

  it('reconfigures the running service on a committed write', async () => {
    const ctx = await mountProfile()
    expect(ctx.jev.mode).toBe('shadow')

    await ctx.settings.update('jev', { mode: 'enforce' })
    await settle(ctx)
    expect(ctx.jev.mode).toBe('enforce')

    await ctx.settings.update('jev', { selection: { enabled: false } })
    await settle(ctx)
    expect(ctx.jev.settings.selection.enabled).toBe(false)
    // The rest of the configuration stays as composed.
    expect(ctx.jev.settings.assessment.enabled).toBe(true)
  })

  it('rejects an invalid value and keeps the last good configuration', async () => {
    const ctx = await mountProfile()
    await expect(ctx.settings.update('jev', { mode: 'bogus' })).rejects.toThrow()
    await settle(ctx)
    expect(ctx.jev.mode).toBe('shadow')
  })

  it('switches to the live provider only with a key, and keeps the runtime consistent', async () => {
    const ctx = await mountProfile()
    await expect(ctx.settings.update('jev', { provider: 'live' })).rejects.toThrow(/apiKey/)
    await settle(ctx)
    expect(ctx.jev.settings.provider).toBe('mock')

    await ctx.settings.update('jev', { provider: 'live', apiKey: 'test-key-not-real' })
    await settle(ctx)
    expect(ctx.jev.settings.provider).toBe('live')
    expect(ctx.jev.core.config.provider.kind).toBe('live')

    await ctx.settings.update('jev', { provider: 'mock' })
    await settle(ctx)
    expect(ctx.jev.settings.provider).toBe('mock')
  })

  it('keeps running when the settings provider is absent', async () => {
    const ctx = new Context()
    contexts.push(ctx)
    await mountAgentLoopTestDependencies(ctx)
    await ctx.plugin(JevPlugin, { provider: 'mock', mode: 'shadow' })
    expect(ctx.jev.mode).toBe('shadow')
    expect(ctx.get('settings')).toBeUndefined()
  })

  it('aborts in-flight assessments when the configuration changes', async () => {
    const ctx = await mountProfile(['mock:', '  delayMs: 5000'])

    const started = ctx.jev.assess({
      task: 'Task',
      toolId: 'read_file',
      arguments: { path: '/a' },
      mode: 'shadow',
    })
    await settle(ctx)
    expect(ctx.jev.core.activeRequests).toBe(1)

    await ctx.settings.update('jev', { mode: 'off' })
    const assessment = await started
    expect(assessment.failure?.code).toBe('ABORTED')
    expect(ctx.jev.core.activeRequests).toBe(0)
  })
})

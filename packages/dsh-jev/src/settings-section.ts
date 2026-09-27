/**
 * Host half of the plugin's settings surface.
 *
 * In DSH 0.1.7-rc.2 the settings document is the active profile's Cordis patch
 * and `@deepseek-ai/dsh-settings` projects it: every active Loader entry whose
 * Config declares `.volatile()` fields becomes a form keyed by that entry's
 * profile id, and an accepted change is committed into the parsed config's live
 * references without remounting the plugin. This module is the plugin's whole
 * contribution to that contract:
 *
 * - the page policy (`configure`), so the automatic schema page never competes
 *   with the configuration card this package ships;
 * - the write gate (`internal/config`), which refuses a value the running
 *   runtime could not honor *before* anything is persisted or committed;
 * - adopting a committed change (`loader/volatile-update`), which re-reads the
 *   live references and rebuilds the runtime.
 *
 * `apiKey` carries `role('secret')` in the schema, so settings responses never
 * contain it, while the card can still write one.
 *
 * @module dsh-jev/settings-section
 */

import type { Context } from '@deepseek-ai/cordis'
// Type-only: declares the `loader/volatile-update` event this module listens to.
import type {} from '@deepseek-ai/cordis-plugin-loader'
import type {} from '@deepseek-ai/dsh-settings'
import type { Config } from './config.js'
import type { JevRuntime } from './service.js'

/**
 * Profile entry id of this plugin's Loader row (`cordis.patch.yml`).
 *
 * The settings document keys a form by the entry id, and the shipped web card
 * binds this same id, so the two halves of the surface agree on it. It is not a
 * namespace the plugin registers: nothing passes it to the settings service.
 */
export const JEV_SETTINGS_NS = 'jev'

/**
 * Refuse a candidate the running runtime could not honor.
 *
 * A `live` provider with no explicit key and an enabled mode is the one
 * cross-field rule the schema cannot express, and it must be refused on the
 * write path rather than after it: the settings document and the running
 * runtime would otherwise disagree — the patch would hold `provider: live`
 * while `reconfigure` left the previous provider in place.
 *
 * `mode !== 'off'` also covers an omitted mode, which resolves to the schema
 * default (`shadow`) and therefore still enables the provider. Only a non-empty
 * literal string counts as a key: `apiKey` carries `role('secret')`, so a value
 * the form never receives — including an unevaluated `!!js` expression — cannot
 * be read here, and refusing it keeps the document honest instead of guessing.
 *
 * @param candidate - the raw config the Loader is about to parse.
 * @throws When the candidate selects `live` without a usable key.
 */
function assertLiveProviderUsable(candidate: unknown): void {
  if (typeof candidate !== 'object' || candidate === null) return
  const { provider, mode, apiKey } = candidate as { provider?: unknown; mode?: unknown; apiKey?: unknown }
  if (provider !== 'live') return
  if (mode === 'off') return
  if (typeof apiKey === 'string' && apiKey.trim().length > 0) return
  throw new Error('dsh-jev: provider "live" requires an apiKey — enter one in the card or keep provider "mock"')
}

/**
 * Install the settings contribution when a provider is present.
 *
 * Without a settings service the plugin keeps running from its `cordis.yml`
 * entry; with one, the three registrations below install themselves as effects
 * owned by this fiber.
 *
 * @param ctx - plugin context.
 * @param runtime - the service to reconfigure.
 * @param entry - the parsed `cordis.yml` configuration, whose live references
 *   the Loader commits into (the composition layer).
 */
export function installSettingsSection(ctx: Context, runtime: JevRuntime, entry: Config): void {
  ctx.inject(['settings'], (settingsCtx) => {
    // This package ships its own card, so no client should also auto-generate a
    // schema page for this entry. The policy is registered against this fiber.
    settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber))
  })

  // Replaces the removed `validate` hook. The Loader runs this waterfall on the
  // complete candidate before every settings write and before every volatile
  // commit, so throwing here is what keeps the document and the runtime in
  // agreement. `next()` runs first: a later listener stays in the chain.
  ctx.on('internal/config', function (_config, next) {
    const candidate = next()
    if (this !== ctx.fiber) return candidate
    assertLiveProviderUsable(candidate)
    return candidate
  })

  // Replaces the removed `setSource`/`onChange` pair. The Loader has already
  // committed the accepted values into the references inside `entry` by the
  // time this fires, so re-reading them adopts exactly the stored document.
  ctx.on('loader/volatile-update', () => {
    runtime.reconfigure(entry)
  })
}

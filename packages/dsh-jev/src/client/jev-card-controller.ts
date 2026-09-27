/**
 * Controller for the Jev configuration page: derives the `jev` profile entry
 * through the client settings provider's shared configuration form and
 * projects it into the plain data + callbacks face the card component
 * receives. The component owns its local draft state; this controller owns
 * every write.
 *
 * @module dsh-jev/client/jev-card-controller
 */

import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'

/** The subset of the `jev` section this card reads and edits. */
export interface JevSettings {
  provider?: 'mock' | 'live'
  mode?: 'off' | 'shadow' | 'enforce'
  selection?: { enabled?: boolean }
  assessment?: { enabled?: boolean }
  loopDetection?: { enabled?: boolean }
  skills?: { enabled?: boolean }
  modelRouting?: { enabled?: boolean }
}

/** One feature toggle the card renders. */
export interface JevFeatureState {
  /** Settings field path, e.g. `selection.enabled`. */
  readonly field: string
  readonly enabled: boolean
}

/**
 * A value the card may write into one field.
 *
 * The settings write contract carries JSON data, so this is deliberately a
 * scalar union rather than `unknown`: it is checked against the transport's own
 * `SettingsPathOpView.value` type, which is what keeps a wrong write shape from
 * reaching the Host.
 */
export type JevSettingValue = string | number | boolean | null

/** What the card renders. Plain JSON-compatible data and callbacks only. */
export interface JevCardFace {
  readonly snapshot: {
    readonly status: 'loading' | 'ready' | 'unavailable'
    readonly writable: boolean
    readonly provider: 'mock' | 'live'
    readonly mode: 'off' | 'shadow' | 'enforce'
    readonly features: readonly JevFeatureState[]
  }
  /** Store one field value through the shared configuration form. */
  readonly setField: (field: string, value: JevSettingValue) => Promise<void>
}

const FEATURE_FIELDS: readonly string[] = [
  'selection.enabled',
  'assessment.enabled',
  'loopDetection.enabled',
  'skills.enabled',
  'modelRouting.enabled',
]

/** Read a dotted path from the settings section. */
function readBoolean(value: unknown, path: string, fallback: boolean): boolean {
  let current: unknown = value
  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null) return fallback
    current = (current as Record<string, unknown>)[segment]
  }
  return typeof current === 'boolean' ? current : fallback
}

/** Bridges the `jev` shared configuration form onto the card's inject face. */
export class JevCardController {
  readonly #form: ConfigForm<JevSettings>

  /** @param form - the configuration form bound to the `jev` profile entry. */
  constructor(form: ConfigForm<JevSettings>) {
    this.#form = form
  }

  /**
   * Build the face the card's slot registration injects.
   * @returns the current snapshot projection and the write callback.
   */
  inject(): JevCardFace {
    const snapshot = this.#form.getSnapshot()
    const value = snapshot.value
    return {
      snapshot: {
        status: snapshot.status,
        writable: snapshot.writable,
        provider: value?.provider ?? 'mock',
        mode: value?.mode ?? 'shadow',
        features: FEATURE_FIELDS.map((field): JevFeatureState => ({
          field,
          enabled: readBoolean(value, field, true),
        })),
      },
      setField: async (field, next) => {
        // The write face addresses ONE path segment per call, and a scalar
        // `set` cannot reach a nested field: a dotted field such as
        // `selection.enabled` must travel as one ordered path mutation.
        const accepted = await this.#form.mutate([{
          op: 'set',
          path: field.split('.'),
          value: next,
        }])
        // A refused write is a Host decision, not a transport failure: the
        // form resolves `false` and re-reads the document. Rejecting keeps the
        // card from reporting a change the settings document never took.
        if (!accepted) throw new Error(`dsh-jev: the settings document refused "${field}"`)
      },
    }
  }
}

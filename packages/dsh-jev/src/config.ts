/**
 * Plugin configuration schema and normalization.
 *
 * Two settings are deliberately independent: `provider` selects where answers
 * come from, `mode` selects whether answers change harness behavior.
 * `mock + shadow` is the default: nothing leaves the process and nothing is
 * enforced.
 *
 * @module dsh-jev/config
 */

import z from '@deepseek-ai/schemastery'
import type { Volatile } from '@deepseek-ai/cordis'
import type { JevThresholds, MockScenario, ToolCandidateInfo, ToolCategoryInfo } from '@buberlo/jev-core'

/** One configured model route target. */
export interface ModelRouteConfig {
  provider: string
  model: string
}

/** Plugin configuration. */
export interface Config {
  /** Answer source: deterministic mock or the live TypeSafe API. */
  provider?: 'mock' | 'live'
  /** Behavior mode: no requests, log-only, or apply decisions. */
  mode?: 'off' | 'shadow' | 'enforce'
  /** Model override for the live provider; omitted uses `jev-latest`. */
  model?: string
  /**
   * TypeSafe API key. Required for `provider: live`; never read implicitly
   * from the environment. Use `!!js process.env.TYPESAFE_API_KEY` to wire an
   * environment value explicitly.
   */
  apiKey?: string
  /** API root override for proxies/gateways. */
  baseURL?: string
  /** Per-attempt timeout in milliseconds (SDK-owned retry attempts). */
  timeoutMs?: number
  /** Whole-evaluation time budget in milliseconds. */
  budgetMs?: number
  /** SDK-owned retries after the first attempt; no plugin-level retries are added. */
  maxRetries?: number
  /** Maximum concurrent provider requests. */
  maxConcurrent?: number
  /** Maximum characters of task/step state transmitted. */
  maxStateChars?: number
  /** Maximum characters kept from one serialized argument value. */
  maxArgumentChars?: number
  /** Maximum categories per selection batch. */
  maxCategories?: number
  /** Maximum candidates per choice question. */
  maxCandidatesPerQuestion?: number
  /** Maximum selected tools per selection. */
  maxSelectedTools?: number
  /** Maximum skills considered by skill routing. */
  maxSkills?: number
  /** Additional redaction field-name fragments on top of the core defaults. */
  redactKeys?: string[]
  /** Emit structured decision logs through the harness logger. */
  logDecisions?: boolean
  /** Decision thresholds (uncalibrated defaults; tune per deployment). */
  thresholds?: Partial<JevThresholds>
  /** Dynamic tool selection. */
  selection?: {
    enabled?: boolean
    /** Tool ids that must never be hidden by a selection restriction. */
    alwaysAllow?: string[]
    /** Category id to description map. */
    categories?: Record<string, string>
    /** Tool id to category ids map. */
    toolCategories?: Record<string, string[]>
  }
  /** Semantic pre-execution assessment. */
  assessment?: {
    enabled?: boolean
    /** Failure action: request approval or withhold. Never allows. */
    onFailure?: 'ask' | 'hold'
    /** Include the optional ordinal risk score question. */
    includeRiskScore?: boolean
    /** Explicitly stated restrictions handed to the assessment. */
    restrictions?: string[]
  }
  /** Bounded deterministic loop detection (no Jev involved). */
  loopDetection?: {
    enabled?: boolean
    /** Identical completed calls allowed before the next identical call is held. */
    maxRepeats?: number
    /** Maximum tracked agents. */
    maxSubjects?: number
  }
  /** Skill routing: choose at most one skill and inject a one-line hint. */
  skills?: {
    enabled?: boolean
    /** Inject the bounded hint in enforce mode (shadow only logs). */
    injectHint?: boolean
    /**
     * Extra routing guidance per skill name, appended to the skill's own
     * `whenToUse`. Use it to sharpen routing without editing the vendored
     * skill file.
     */
    routingHints?: Record<string, string>
    /** Maximum characters per skill metadata part (description and when-to-use) sent to Jev. */
    maxDescriptionChars?: number
  }
  /** Model routing to configured, verified-available targets. */
  modelRouting?: {
    enabled?: boolean
    /** Route class to real provider/model target. */
    routes?: {
      fast?: ModelRouteConfig
      balanced?: ModelRouteConfig
      reasoning?: ModelRouteConfig
    }
  }
  /** Deterministic mock scenarios (examples/tests). */
  mock?: {
    /** Question-id keyed answers, see `MockScenario`. */
    answers?: MockScenario['answers']
    /** Artificial latency in milliseconds. */
    delayMs?: number
  }
}

/** One configured model route target behind its live references. */
export interface ParsedModelRouteConfig {
  provider: Volatile<string | undefined>
  model: Volatile<string | undefined>
}

/**
 * The configuration Cordis hands a plugin instance: every field the settings
 * document may edit is a live reference rather than a value.
 *
 * This is the schema's declared OUTPUT type. Naming it here is what makes the
 * schema's type portable (an inferred type would have to reference cosmokit's
 * `Dict` through `z.dict`), and annotating with it also makes the compiler check
 * that the schema really produces this shape. Read it through
 * {@link plainConfig}; never read a field directly, because a reference is not
 * the value it carries.
 */
export interface ParsedConfig {
  provider: Volatile<'mock' | 'live'>
  mode: Volatile<'off' | 'shadow' | 'enforce'>
  model: Volatile<string | undefined>
  apiKey: Volatile<string | undefined>
  baseURL: Volatile<string | undefined>
  timeoutMs: Volatile<number>
  budgetMs: Volatile<number>
  maxRetries: Volatile<number>
  maxConcurrent: Volatile<number>
  maxStateChars: Volatile<number>
  maxArgumentChars: Volatile<number>
  maxCategories: Volatile<number>
  maxCandidatesPerQuestion: Volatile<number>
  maxSelectedTools: Volatile<number>
  maxSkills: Volatile<number>
  redactKeys: Volatile<string[]>
  logDecisions: Volatile<boolean>
  thresholds: {
    relevance: Volatile<number>
    selection: Volatile<number>
    confidence: Volatile<number>
    restriction: Volatile<number>
    missingInformation: Volatile<number>
    taskMatch: Volatile<number>
    skill: Volatile<number>
    modelRoute: Volatile<number>
  }
  selection: {
    enabled: Volatile<boolean>
    alwaysAllow: Volatile<string[]>
    categories: Volatile<Record<string, string>>
    toolCategories: Volatile<Record<string, string[]>>
  }
  assessment: {
    enabled: Volatile<boolean>
    onFailure: Volatile<'ask' | 'hold'>
    includeRiskScore: Volatile<boolean>
    restrictions: Volatile<string[]>
  }
  loopDetection: {
    enabled: Volatile<boolean>
    maxRepeats: Volatile<number>
    maxSubjects: Volatile<number>
  }
  skills: {
    enabled: Volatile<boolean>
    injectHint: Volatile<boolean>
    routingHints: Volatile<Record<string, string>>
    maxDescriptionChars: Volatile<number>
  }
  modelRouting: {
    enabled: Volatile<boolean>
    routes: {
      fast?: ParsedModelRouteConfig
      balanced?: ParsedModelRouteConfig
      reasoning?: ParsedModelRouteConfig
    }
  }
  /** Ordinary configuration: parsed as supplied, not as a reference. */
  mock: {
    answers?: MockScenario['answers']
    delayMs?: number
  }
}

const routeSchema = z.object({
  provider: z.string().volatile(),
  model: z.string().volatile(),
})

const thresholdsSchema = z.object({
  relevance: z.number().default(0.5).volatile(),
  selection: z.number().default(0.35).volatile(),
  confidence: z.number().default(0.3).volatile(),
  restriction: z.number().default(0.5).volatile(),
  missingInformation: z.number().default(0.5).volatile(),
  taskMatch: z.number().default(0.35).volatile(),
  skill: z.number().default(0.5).volatile(),
  modelRoute: z.number().default(0.4).volatile(),
})

/**
 * Schemastery schema for the plugin config.
 *
 * Every field the settings document may edit carries `.volatile()`: the Loader
 * parses such a field into a stable reference it can commit in place, and the
 * settings document exposes exactly the volatile fields as a form
 * (`@deepseek-ai/dsh-settings`' `volatileForm`/`isVolatilePath`). A field left
 * ordinary stays out of every form and is preserved verbatim by a form write.
 *
 * Constraints schemastery enforces (measured, not assumed): a volatile node
 * must sit at a fixed object path, so array and dict fields are marked on the
 * node itself and never on their element type, and a volatile node may not
 * nest inside another volatile node. Nested objects therefore stay plain and
 * carry volatile leaves.
 */
export const Config: z<Config, ParsedConfig> = z.object({
  provider: z.union(['mock', 'live'] as const).default('mock').volatile(),
  mode: z.union(['off', 'shadow', 'enforce'] as const).default('shadow').volatile(),
  model: z.string().volatile(),
  apiKey: z.string().role('secret').volatile(),
  baseURL: z.string().volatile(),
  timeoutMs: z.natural().default(5000).volatile(),
  budgetMs: z.natural().default(8000).volatile(),
  maxRetries: z.natural().default(1).volatile(),
  maxConcurrent: z.natural().min(1).default(2).volatile(),
  maxStateChars: z.natural().default(4000).volatile(),
  maxArgumentChars: z.natural().default(1200).volatile(),
  maxCategories: z.natural().default(8).volatile(),
  maxCandidatesPerQuestion: z.natural().default(40).volatile(),
  maxSelectedTools: z.natural().default(12).volatile(),
  maxSkills: z.natural().default(20).volatile(),
  redactKeys: z.array(z.string()).default([]).volatile(),
  logDecisions: z.boolean().default(true).volatile(),
  thresholds: thresholdsSchema,
  selection: z.object({
    enabled: z.boolean().default(true).volatile(),
    alwaysAllow: z.array(z.string()).default([]).volatile(),
    categories: z.dict(z.string()).default({}).volatile(),
    toolCategories: z.dict(z.array(z.string())).default({}).volatile(),
  }),
  assessment: z.object({
    enabled: z.boolean().default(true).volatile(),
    onFailure: z.union(['ask', 'hold'] as const).default('ask').volatile(),
    includeRiskScore: z.boolean().default(false).volatile(),
    restrictions: z.array(z.string()).default([]).volatile(),
  }),
  loopDetection: z.object({
    enabled: z.boolean().default(true).volatile(),
    maxRepeats: z.natural().min(2).default(2).volatile(),
    maxSubjects: z.natural().min(1).default(64).volatile(),
  }),
  skills: z.object({
    enabled: z.boolean().default(false).volatile(),
    injectHint: z.boolean().default(true).volatile(),
    routingHints: z.dict(z.string()).default({}).volatile(),
    maxDescriptionChars: z.natural().min(1).default(240).volatile(),
  }),
  modelRouting: z.object({
    enabled: z.boolean().default(false).volatile(),
    routes: z.object({
      fast: routeSchema,
      balanced: routeSchema,
      reasoning: routeSchema,
    }),
  }),
  // Ordinary configuration: scenario data no settings form edits, kept intact
  // by every form write (`SettingsForms.write` strips only volatile fields).
  mock: z.object({
    answers: z.any(),
    delayMs: z.natural().default(0),
  }),
})

/** Fully resolved, non-optional settings used at runtime. */
export interface ResolvedSettings {
  provider: 'mock' | 'live'
  mode: 'off' | 'shadow' | 'enforce'
  model?: string
  apiKey?: string
  baseURL?: string
  timeoutMs: number
  budgetMs: number
  maxRetries: number
  maxConcurrent: number
  maxStateChars: number
  maxArgumentChars: number
  maxCategories: number
  maxCandidatesPerQuestion: number
  maxSelectedTools: number
  maxSkills: number
  redactKeys: string[]
  logDecisions: boolean
  thresholds: JevThresholds
  selection: {
    enabled: boolean
    alwaysAllow: string[]
    categories: Record<string, string>
    toolCategories: Record<string, string[]>
  }
  assessment: {
    enabled: boolean
    onFailure: 'ask' | 'hold'
    includeRiskScore: boolean
    restrictions: string[]
  }
  loopDetection: {
    enabled: boolean
    maxRepeats: number
    maxSubjects: number
  }
  skills: {
    enabled: boolean
    injectHint: boolean
    routingHints: Record<string, string>
    maxDescriptionChars: number
  }
  modelRouting: {
    enabled: boolean
    routes: {
      fast?: ModelRouteConfig
      balanced?: ModelRouteConfig
      reasoning?: ModelRouteConfig
    }
  }
  mock: {
    answers: NonNullable<MockScenario['answers']>
    delayMs: number
  }
}

/**
 * Read the plain values behind Cordis's live config references.
 *
 * A field this schema marks `.volatile()` is parsed into a `Volatile`
 * reference rather than a value, so `resolveSettings` must be handed the
 * reference contents instead of the parsed object. `Schema.simplify` is the
 * schemastery operation for exactly that: it resolves every reference and drops
 * values equal to their schema default. Dropping those is safe here because
 * {@link resolveSettings} re-applies the identical default for every field, so
 * the resolved settings never depend on which side supplied it. The document's
 * whole-config default makes `simplify` return `null` for an unconfigured
 * entry; a plugin with no config fields at all is the same as `{}` here.
 *
 * The input is the object Cordis parsed for this fiber, which is reachable both
 * as the constructor's `config` argument and as `ctx.fiber.config`, because the
 * Loader commits a committed change into those very references.
 *
 * @param config - parsed plugin config (form-editable fields are references).
 * @returns the same fields as plain data.
 */
export function plainConfig(config: Config): Config {
  return Config.simplify(config) ?? {}
}

/**
 * Normalize a validated config into the runtime settings shape.
 * @param config - validated plugin config.
 * @returns fully populated settings.
 */
export function resolveSettings(config: Config): ResolvedSettings {
  return {
    provider: config.provider ?? 'mock',
    mode: config.mode ?? 'shadow',
    ...(config.model === undefined ? {} : { model: config.model }),
    ...(config.apiKey === undefined ? {} : { apiKey: config.apiKey }),
    ...(config.baseURL === undefined ? {} : { baseURL: config.baseURL }),
    timeoutMs: config.timeoutMs ?? 5000,
    budgetMs: config.budgetMs ?? 8000,
    maxRetries: config.maxRetries ?? 1,
    maxConcurrent: config.maxConcurrent ?? 2,
    maxStateChars: config.maxStateChars ?? 4000,
    maxArgumentChars: config.maxArgumentChars ?? 1200,
    maxCategories: config.maxCategories ?? 8,
    maxCandidatesPerQuestion: config.maxCandidatesPerQuestion ?? 40,
    maxSelectedTools: config.maxSelectedTools ?? 12,
    maxSkills: config.maxSkills ?? 20,
    redactKeys: config.redactKeys ?? [],
    logDecisions: config.logDecisions ?? true,
    thresholds: {
      relevance: config.thresholds?.relevance ?? 0.5,
      selection: config.thresholds?.selection ?? 0.35,
      confidence: config.thresholds?.confidence ?? 0.3,
      restriction: config.thresholds?.restriction ?? 0.5,
      missingInformation: config.thresholds?.missingInformation ?? 0.5,
      taskMatch: config.thresholds?.taskMatch ?? 0.35,
      skill: config.thresholds?.skill ?? 0.5,
      modelRoute: config.thresholds?.modelRoute ?? 0.4,
    },
    selection: {
      enabled: config.selection?.enabled ?? true,
      alwaysAllow: config.selection?.alwaysAllow ?? [],
      categories: config.selection?.categories ?? {},
      toolCategories: config.selection?.toolCategories ?? {},
    },
    assessment: {
      enabled: config.assessment?.enabled ?? true,
      onFailure: config.assessment?.onFailure ?? 'ask',
      includeRiskScore: config.assessment?.includeRiskScore ?? false,
      restrictions: config.assessment?.restrictions ?? [],
    },
    loopDetection: {
      enabled: config.loopDetection?.enabled ?? true,
      maxRepeats: config.loopDetection?.maxRepeats ?? 2,
      maxSubjects: config.loopDetection?.maxSubjects ?? 64,
    },
    skills: {
      enabled: config.skills?.enabled ?? false,
      injectHint: config.skills?.injectHint ?? true,
      routingHints: config.skills?.routingHints ?? {},
      maxDescriptionChars: config.skills?.maxDescriptionChars ?? 240,
    },
    modelRouting: {
      enabled: config.modelRouting?.enabled ?? false,
      routes: {
        ...(config.modelRouting?.routes?.fast === undefined ? {} : { fast: config.modelRouting.routes.fast }),
        ...(config.modelRouting?.routes?.balanced === undefined ? {} : { balanced: config.modelRouting.routes.balanced }),
        ...(config.modelRouting?.routes?.reasoning === undefined ? {} : { reasoning: config.modelRouting.routes.reasoning }),
      },
    },
    mock: {
      answers: config.mock?.answers ?? {},
      delayMs: config.mock?.delayMs ?? 0,
    },
  }
}

/**
 * Build selection candidates from the currently visible tool schemas.
 *
 * Tools with a configured `toolCategories` entry use those categories.
 * Unconfigured tools fall back to their own id as a single category with the
 * tool description as category description: that keeps the relevance
 * questions independent without inventing a taxonomy.
 * @param tools - visible tool schemas (name + description).
 * @param settings - resolved settings.
 * @returns candidates plus the category description map.
 */
export function buildSelectionCatalog(
  tools: readonly { name: string; description: string }[],
  settings: ResolvedSettings,
): { candidates: ToolCandidateInfo[]; categories: ToolCategoryInfo[] } {
  const categories = new Map<string, ToolCategoryInfo>()
  const candidates = tools.map((tool): ToolCandidateInfo => {
    const configured = settings.selection.toolCategories[tool.name]
    const ids = configured !== undefined && configured.length > 0 ? configured : [tool.name]
    for (const id of ids) {
      if (!categories.has(id)) {
        const description = settings.selection.categories[id] ?? (id === tool.name ? tool.description : undefined)
        categories.set(id, description === undefined ? { id } : { id, description })
      }
    }
    return {
      id: tool.name,
      categories: ids,
      description: tool.description,
    }
  })
  return { candidates, categories: [...categories.values()] }
}

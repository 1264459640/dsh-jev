# Upstream compatibility

This is the repository's record of **which upstream versions are verified, how,
and what remains unverified**. Three states appear throughout, and they are not
interchangeable:

- **[executed, 0.1.7-rc.2]** — a command was run *in this upgrade* and this is its
  observed outcome. Each such claim names the hand-off that recorded it
  (`docs/adaptation/*.md`).
- **[carried over, 0.1.6-alpha.2]** — a real, previously recorded observation
  made against `0.1.6-alpha.2` (or against the `0.1.4` registry line). It has
  **not** been re-executed at `0.1.7-rc.2`. It is kept as history, labelled with
  the version and the date it was obtained on, and must not be quoted as a
  current result.
- **[not verified]** — asserted nowhere; listed as open.

The consolidated lists are in "What is verified at 0.1.7-rc.2" at the end. Read
that section before quoting any row as current.

> **Workspace vs registry version — read this before quoting a version.** The
> adapted code in this repository is workspace **`0.1.5`**, which has **not been
> published**. Every registry and install instruction in these docs therefore
> still resolves to the published **`0.1.4`** line, whose packages peer the
> `0.1.6-alpha.2`-era DSH ranges ("Demonstrated restrictions"). This document
> makes no claim that `0.1.5` is installable, and no `npm view` date or registry
> fact has been changed by the version bump.

Dates and provenance:

| Material | Obtained | Source |
|---|---|---|
| DSH `0.1.6-alpha.2`, TypeSafe, Node | **2026-09-19** | cloned source + npm |
| `@buberlo/*` registry line `0.1.4` | **2026-09-23** | `npm view` |
| DSH `0.1.7-rc.2` shipped-tarball delta | **2026-09-27** | [`docs/upstream-delta-0.1.7-rc.2.md`](upstream-delta-0.1.7-rc.2.md) |
| This upgrade (install, typechecks, tests, build + artifact load, real-product profile/boot, the full `pnpm verify` gate, bench) | **2026-09-27** | [`docs/adaptation/`](adaptation/) |

Repository HEAD when the upgrade started: `87e29e2` ("Bump workspace to 0.1.4").

## Versions and sources

### Current verified matrix — [executed, 0.1.7-rc.2] unless marked

| Source | Version / commit | How it was obtained |
|---|---|---|
| `@deepseek-ai/dsh-*` npm packages | `0.1.7-rc.2` | resolved and installed in this workspace; `pnpm install --frozen-lockfile --ignore-scripts` exit 0 (`docs/adaptation/01-deps.md` §3.2) |
| `@deepseek-ai/cordis` | `4.0.4` | same lockfile. This plugin declares the peer as `~4.0.4`, matching every `0.1.7-rc.2` DSH package (upstream convention change, delta §2) |
| `@deepseek-ai/schemastery` | `3.18.4` | same lockfile, in `dependencies` **and** `devDependencies` |
| `@deepseek-ai/dsh` (product CLI) | `0.1.7-rc.2` | **present on this machine only**, as the DSH launcher runtime at `%APPDATA%\in.dsh-plug.dsh-launcher\versions\0.1.7-rc.2`; its own lockfile independently confirms `cordis@4.0.4`, `schemastery@3.18.4` and `0.1.7-rc.2` for the DSH packages (`docs/adaptation/01-deps.md` §2.4). **No `dsh --profile … --dump-config` and no profile boot were executed against it in this upgrade** — see "Installation path" below |
| `deepseek-ai/deepseek-harness` source | commit `ddefc45fbc7f8e46dd73185e68295696d1297887` (2026-09-17), root version **`0.1.6-alpha.2`** | the 2026-09-19 `git clone --depth 1`. **No `0.1.7-rc.2` source checkout was made.** Every `0.1.7-rc.2` interface statement here comes from the *shipped tarballs* (delta §1.1) |
| `@typesafe-ai/sdk` | `0.6.0` | npm + published `src/types.ts`, `src/client.ts`, `src/questions.ts` at tag `v0.6.0` — unchanged by this upgrade |
| `@buberlo/jev-core` / `@buberlo/dsh-jev` | workspace **`0.1.5`** (this adaptation, **not published**); registry lists `0.1.0`, `0.1.2`, `0.1.3`, `0.1.4`; `latest` is `0.1.4` | `npm view` **2026-09-23** — [carried over, 0.1.6-alpha.2] era; not re-checked in this upgrade. Workspace version from the three manifests |
| Node.js | tested in this upgrade with `24.16.0`; DSH engines require `^22.19.0 \|\| >=24.0.0` | local. The 2026-09-19 records used `26.9.0` |
| pnpm | `12.4.2` | local, unchanged |

Every direct dependency is pinned to an exact version and `pnpm-lock.yaml` is
committed. After the bump the lockfile contains **zero** references to
`0.1.6-alpha.2`, and `@deepseek-ai/dsh-settings-file` appears nowhere in the
tree — not in any `package.json` and not in `pnpm-lock.yaml`.

**`@deepseek-ai/dsh-settings-file` has no `0.1.7-rc.2` release at all.** The
registry stops at `0.1.6-alpha.2` (dist-tags
`latest=0.0.1-rc.3, next=0.1.5-rc.3, alpha=0.1.6-alpha.2`). Upstream dropped the
package: `dsh-base@0.1.7-rc.2/cordis.patch.yml` no longer mounts it, and it is
absent from the real `0.1.7-rc.2` dependency tree
(`docs/upstream-delta-0.1.7-rc.2.md` §1.3, B-7, §6.4). This repository therefore
**removed** the pin instead of holding a version upstream no longer ships; there
is no "held at an old version" exception left to document.

### Inspected as supporting evidence (not direct dependencies)

`@deepseek-ai/dsh-base`, `dsh-api-remotes`, `dsh` (CLI), `dsh-package-manifest`,
`dsh-client-modules`, `dsh-config-editor`, `dsh-api-gateway` — all at
`0.1.7-rc.2`, compared by whole-tarball SHA-256
(`docs/upstream-delta-0.1.7-rc.2.md` §2).

## Externally verified interfaces

Line references are to the **shipped `0.1.7-rc.2` tarball** declarations
(`lib/types/**/*.d.ts`, `lib/**/*.js`, shipped `README.md`) unless stated
otherwise, as quoted in
[`docs/upstream-delta-0.1.7-rc.2.md`](upstream-delta-0.1.7-rc.2.md). That report
was produced by fetching exact versions and hashing every file; it is not a
source checkout and not memory. Where a `0.1.6-alpha.2` line is mentioned it is
the historical comparison.

### Plugin shape and injection

- A Cordis plugin is `export default class ... extends Service` with
  `static inject` and `static Config` (schemastery). At cordis `4.0.4`
  `lib/types/service.d.ts` and `src/service.ts` are **byte-identical** to
  `4.0.2`, so the plugin shape is unchanged (delta §3.1).
- Services are accessed through a context and are `this`-rebound to the
  accessing context; **private `#field`s do not survive the Cordis service
  proxy**. `src/service.ts`, `src/context.ts`, `src/registry.ts` and
  `src/reflect.ts` are byte-identical between `4.0.2` and `4.0.4`, so the cause
  is unchanged (delta §7.1). The plugin uses TypeScript `private` fields for
  this reason (found by an integration-test failure, not by reading).
- The bundle/profile install path is `dsh.bundle.patch` in `package.json` plus a
  `cordis.patch.yml` row. `DshBundleManifest.patch` is now
  `string | string[]`; our single-string declaration is still valid (delta §3.8,
  §5). Our row is unchanged and still valid (delta §6.2):
  `- insert: [{ id: jev, name: '@buberlo/dsh-jev' }]`.

### Tool lifecycle (the MVP extension points)

All of these are **unchanged** at `0.1.7-rc.2` (delta §3.2, §9):

- `tools/pre-execute` waterfall:
  `(exec: ToolExecution, next) => Promise<PreToolDecision>` —
  `dsh-tools/lib/types/index.d.ts:47` (was `:39` in the 0.1.6 package; same
  text). Decision type at `index.d.ts:445-460`
  (`allow | deny{reason,info?} | cancel | ask{reason?, displayReason?}`). The
  `displayReason?` field is new and optional — it is *localized prompt text*,
  while `reason` remains the audited reason (delta §5).
- `tools/result` observe-only emit: `index.d.ts:92` (was `:84`); result is
  deep-frozen and listener failures are contained (used for loop counting).
- `ctx.tools.restrict(filter)` (`index.d.ts:644`) requires a **scoped** context
  (`agent.ctx`) and fails on empty filters, unknown global names, scope-local
  names, and the reserved `run_code` transport. Restrictions intersect and never
  affect scoped registrations.
- `ctx.tools.guard(guard)` (`index.d.ts:655`) is synchronous and monotonic; no
  guard can turn a denial back into permission.
- `ctx.tools.get(name, scope)` (`:690`) / `ctx.tools.schemas(scope)` (`:711`)
  expose the scope's visible set; a global-only lookup (`get(name)` with no
  scope) is how the adapter filters names that `restrict()` may legally mention.
- The pipeline order is fixed and unchanged:
  `pre-execute → guards → execute → post-execute → finalizeContent → result`
  (`dsh-tools/README.md:105`). The new optional
  `ToolDefinition.projectContent?` (`index.d.ts:138`) runs *before*
  post-execute (`README.md:87`) and is inert unless declared (delta §5).
- `tools/pre-execute` **still cannot rewrite arguments** (upstream limitation,
  `dsh-tools/README.md` "Known Limitations" — text unchanged), so approval
  binding relies on per-call assessment instead of argument rewriting.

### Agent scope, lifecycle, and model config

`dsh-agent/lib/types/runtime-types.d.ts` is **byte-identical** at `0.1.7-rc.2`
(delta §3.3), so every line reference below is unchanged and the whole surface is
confirmed rather than merely carried over:

- `agent.ctx` is the agent-scoped context (`runtime-types.d.ts:149`); the loop
  mints it with `createScope(loopCtx, agent)`.
- `agent/pre-step` waterfall receives `{ agent, messages, turn, step, signal }`
  (`runtime-types.d.ts:304`).
- `agent/request` waterfall receives `{ agent, turn, step, signal }` and its
  `next()` returns an `LlmCallConfig` that may be replaced
  (`runtime-types.d.ts:327`). This remains the verified mechanism for model
  routing. The one relevant change is documentation-only: `listModels` is
  described more tightly as advisory, and the adapter's "absence from the
  catalog → keep the existing model" behaviour is explicitly still legal
  (delta §5).
- `agent.inject(UserMessage)` queues model-facing context for a later step
  (`runtime-types.d.ts:209`) — used for the bounded skill hint. The *type* is
  unchanged, but the `UserMessage` **source vocabulary** it consumes changed:
  see "Messages and injected context" below.
- `agent/disposed` is the teardown notification (`runtime-types.d.ts:240`).
- `agent.session.deriveMessages()` is unchanged
  (`dsh-session/lib/types/index.d.ts:303`).

### Messages and injected context (the one source-vocabulary break)

- `createUserMessage(input)` keeps its signature (`dsh-llm/lib/types/message.d.ts:213`);
  `ContextFormed` keeps its vocabulary (`notice` still requires `summary`).
- `MessageSourceMap` lost the catch-all `plugin` key. `0.1.7-rc.2` declares only
  `user`, `model`, `tool`, `system-prompt` and documents the rule: *"each
  producer declares its own `kind` in its own module; there is no shared
  catch-all `plugin` kind"* (`message.d.ts:101-108`). A plugin-supplied message
  source must therefore be declared by module augmentation, exactly as the
  shipped `tool-registry`, `ptc-mode`, `model-selection`, `user-approval` and
  `runtime-context` kinds do (delta B-3). This repository declares its own
  `'dsh-jev'` kind in `src/adapters/pre-step.ts` and bounds the `notice` summary
  with `boundContextSummary` (120 chars). `[executed, 0.1.7-rc.2]` that file
  typechecks clean and the injected hint still reaches the model request in the
  real agent loop (`docs/adaptation/03-host.md` §1.2, §2.4, §7.1).
  **Documented limit:** the augmentation lives in the module that produces the
  message (matching upstream layout), so a downstream consumer that only imports
  the package root does not see `'dsh-jev'` in its union. That is benign here —
  nothing downstream names the kind, and the union is designed for consumers to
  fall through unknown kinds — but a measured remedy (a small
  `src/message-source.ts` re-exported from `index.ts`) was deliberately not
  taken (`03-host.md` §1.2).
- A tool result is now a first-class **message** (`ToolResultMessage`,
  `role: 'tool'`, `isError?`), not a `tool-result` content block; the
  `ContentBlockMap['tool-result']` member is gone (delta §3.5, and
  `docs/adaptation/05-tests.md` §1.3, which executed the compile-level proof).
- `createSystemMessage(text, plugin)` lost its second parameter and
  `BlockAssembler.message(source?)` now requires a source (delta B-5, B-6).
  Neither is called by this plugin.

### Settings and the web client

The settings subsystem was **redesigned, not renamed**, between
`0.1.6-alpha.2` and `0.1.7-rc.2` (delta §3.4, §3.8, §6.1; see also
`docs/upstream-delta-0.1.7-rc.2.md` B-1/B-2/B-4).

**Host.** `ctx.settings` **is** the settings service: it is typed `SettingsForms`
(`dsh-settings/lib/types/index.d.ts:27`), not a `SettingsProvider`. Forms are
projected from each active Loader entry's `Config` schema instead of being
registered as a namespace. Consequences:

- `ctx.settings.installSection(...)`, `SettingsSectionHooks`,
  `SettingsRegisterOptions`, `SettingsProvider`, `SettingsScope`,
  `SettingsUpdateSource`, the `settings/updated` event and the
  `@deepseek-ai/dsh-settings/invariant` subpath are **removed**. The only
  settings event left is `settings/document-updated(ns, revision)`
  (`types.d.ts:73`).
- The settings document **is** the active profile's Cordis patch; writes go
  through `@deepseek-ai/dsh-config-editor`. A legacy `$DSH_HOME/settings.yaml` is
  imported once (`dsh-settings/lib/types/index.d.ts:71-73`,
  `private importLegacyDocument`).
- A field is form-editable only if the plugin declares it `.volatile()` in its
  `Config` schema (schemastery `3.18.4` gained `Meta.volatile` at
  `lib/types/index.d.ts:103` and `Schema.volatile()` at `:156`). Reading such a
  field requires `.get()` on the value (`Volatile<T>`), not a direct property
  read (delta §7.3, §7.4). `[executed, 0.1.7-rc.2]` the nested-object placement
  this plugin uses — volatile **leaves** inside plain nested objects, with
  `array`/`dict` fields marked on the node itself — passes
  `validateVolatileSchema` at parse time, so the delta's §10.2 open item is
  closed (`docs/adaptation/04-client.md` §3).
- `ctx.settings.update/replace/mutate` take a **profile entry id** (`string`),
  not a settings namespace (`index.d.ts:102`, `:108`, `:114`). For this bundle
  that is the `jev` row id in `packages/dsh-jev/cordis.patch.yml`, and it equals
  the literal the card passes to `configForms.get<…>('jev')`: the descriptors are
  built with `ns: entry.options.id` and `write()` re-finds the row by
  `row.options.id === ns`. `[executed, 0.1.7-rc.2]` —
  `docs/adaptation/04-client.md` §1 (the delta's §10.1 open item, which the
  shipped declarations alone could not settle).
- **Which rows a form can write.** The config editor recomposes only the layers
  it owns (bundle layers + profile patch + home patch + CLI overlays). A row
  installed as a patch-layer `insert` — exactly how `cordis.patch.yml` installs
  this plugin — **is** writable through the form; a row that exists **only** in
  the leaf `cordis.yml` is not. The editor's refusal message ("overridden by a
  home patch or command-line overlay") is misleading in both cases: the home
  layer was never the cause. `[executed, 0.1.7-rc.2]` —
  `docs/adaptation/04-client.md` §7 ("Refuted hypothesis"). The constraint is
  fixture-shape, not a limitation of bundle-installed plugins.
- `ctx.settings.describe({ redactSecrets: true })` still strips
  `role('secret')` fields; `SettingsDescriptor` gained a required
  `autoGenerate: boolean` and `applies` narrowed to `'live'`
  (`index.d.ts:96`). `ctx.settings.configure({ auto: false }, owner)`
  (`index.d.ts:80-84`) is the supported way for a plugin to suppress the
  auto-generated page and ship its own.

**Client.** `ctx.settingsScope` and the `SettingsScope*` exports are **gone**;
the replacement is the config-forms service:

- `ctx.configForms` (`dsh-client-ui-settings/lib/types/client/config-form.d.ts:96`)
  with `describe()` (`:137`), `get<T>(entryId)` (`:142`) and
  `whileServed(namespaces, register)` (`:156`).
- `ConfigForm<T>` (`client/config-form-types.d.ts:36-74`) exposes
  `getSnapshot()`, `subscribe()`, `mutate(ops, expectedRevision?)`,
  `set(field, value)` and `unset(field)`; its snapshot carries
  `status/value/base/user/revision/writable/mode`. `set`/`unset`/`mutate`
  return `Promise<boolean>` — an acceptance signal the old `SettingsScope` had no
  way to report.
- `ConfigForm.set(field, value)` treats `field` as **one path segment**:
  `set` delegates to `mutate` with `path: [field]`
  (`dsh-client-ui-settings/lib/client.js:1152-1158`). A nested write must use
  `mutate([{ op: 'set', path: ['skills', 'enabled'], value: true }])`; a dotted
  string becomes a literal key. `[executed, 0.1.7-rc.2]` —
  `docs/adaptation/05-tests.md` §4.1.
- `ConfigForm`'s op types are imported from
  `@deepseek-ai/dsh-api-remotes/client` (`SettingsPathOpView`). With
  `skipLibCheck: true` an unresolved import degrades to `any` and `mutate`'s
  argument goes unchecked, so that package is an exact (type-only) dependency;
  it appears nowhere in the emitted artifact. `[executed, 0.1.7-rc.2]` —
  `docs/adaptation/04-client.md` §5.
- The keying question ("row id or namespace?") is settled under **Host** above:
  it is the profile entry id, which for this bundle is `jev`.

**Slots are unchanged** (delta §3.8): `plugins.bundle.config` is still keyed by
the bundle package name and rendered on the bundle's page; `plugins.item` and
`plugins.row.config` are unchanged; `plugins.bundle.activation`,
`plugins.detail.actions`, `plugins.detail.badge` and `plugins.detail.section`
are additive. `PluginConfigViewProps` gained `readonly form?: ConfigPageForm`
(`dsh-client-ui-plugin-manager/lib/types/client/slot-contract.d.ts:24,100`).

**Client artifacts are unchanged** (delta §3.8, §6.3): the module system still
serves each enabled Loader row's built `./client` export as a CJS closure
factory for `window.__ModuleLoader__.load({ id, factory })`; `react` and
`react/jsx-runtime` still resolve through the injected require (baseline
`PLATFORM_MODULES` unchanged); cross-plugin value imports are still rejected by
the bundle-purity gate. What changed is loader *robustness* (retry-once, a
one-resource-URL fallback, per-row import/failure recording, `mtime`-derived
revisions), none of which changes the contract this package reproduces in its
own `tsdown.config.ts`. Upstream still publishes **no** tsdown preset for
out-of-tree client plugins.

### Approval and skills

- `ask` runs only after the approval service returns `allowed-once` and fails
  closed when no answerer is composed; `approval/request` is a waterfall and an
  approval is per request (`dsh-user-approval/lib/types/types.d.ts:81`,
  `:26`; `ApprovalRequestEvent` gained an optional `displayReason?` at `:65`).
  This is the verified approval mechanism; no local approval cache exists.
- The new optional `displayReason` is **deliberately not supplied** by this
  plugin. Its approval text is a rule id plus measured values (never generated
  prose, per `AGENTS.md`), there is no host-side locale dictionary for it, and
  the client falls back to `reason`, so omitting the field is not a regression
  (`docs/adaptation/03-host.md` §4).
- `ctx.skills.list({ scope })` returns `SkillSummary` metadata, and
  `isModelInvocable(skill)` honors the invocation policy
  (`dsh-skill/lib/types/index.d.ts:266`, `:107`). `dsh-skill` declarations are
  **byte-identical** at `0.1.7-rc.2` (delta §3.6, §9).
- Local skill discovery (`@deepseek-ai/dsh-skill-filesystem@0.1.7-rc.2`): roots
  are scanned in rank order — `project-dsh` at `<projectRoot>/.dsh/skills` (100),
  `project-agents` at `<projectRoot>/.agents/skills` (200), `customSkillDirs`
  (300), user roots (400/500); the project root is the nearest `.git` ancestor;
  discovery is one level deep (`<name>/SKILL.md` or `<name>.md`). Declarations
  are byte-identical to `0.1.6-alpha.2` (delta §3.6).
- Frontmatter contract verified in `skill-filesystem/src/index.ts`
  (`parseSkillFile`): `name` (kebab-case) and `description` are required,
  `whenToUse`, `metadata`, and the invocation booleans are optional, and
  unknown keys such as `license` are ignored. A malformed entry is skipped with
  a warning and disappears from the catalog.
- The standard `@deepseek-ai/dsh-base` bundle already mounts
  `@deepseek-ai/dsh-skill`, `@deepseek-ai/dsh-skill-filesystem`,
  `@deepseek-ai/dsh-skill-badge`, and `@deepseek-ai/dsh-tool-skill`, so a
  checked-in `.agents/skills` directory needs no configuration. This repository
  vendors the TypeSafe skill there (pinned `typesafe-ai/skills@65a39f3`, see
  `docs/skills.md`), and `packages/dsh-jev/tests/skill-install.spec.ts` proves
  discovery and routing against the real provider.

### TypeSafe Jev (System One)

Unchanged by the DSH upgrade:

- SDK: `new TypeSafeClient(config)`, `client.systemOne(request, options)` with
  `{ state, questions, model }` and options `{ signal, timeout, retry, headers }`
  (`@typesafe-ai/sdk@0.6.0` `src/client.ts`).
- Reply: `{ model, answers, usage }`; the SDK's own retry policy defaults to
  `maxRetries: 2`, per-attempt timeout 10 000 ms, and the SDK redacts known
  credential headers but **not bodies** at `debug`. The plugin therefore
  defaults the SDK log level to `off` and does not add a second retry loop.
- Primitives and answer shapes (`src/types.ts`, docs):
  - Choice: `{ type:'choice', choice, confidence, probabilities }`; option map
    in the request; documented limit 255 options.
  - Score: `{ type:'score', score, confidence, legend, probabilities }`;
    probabilities keyed by level index; 2–10 levels; `score` is a
    probability-weighted mean that may fall between levels.
  - Noul: `{ type:'noul', noul }` — **no confidence field**; the core never
    synthesizes one.
- Documented model limits: 64k context per request, 32k for `state` plus the
  longest question; aliases `jev-latest` / `jev-preview` (currently both
  `jev-1.13.0`).
- `validateQuestions` rejects empty question maps and score criteria that are not
  a list of at least two entries (SDK `src/questions.ts`).

## Installation path

### Executed in this upgrade — [executed, 0.1.7-rc.2]

The workspace dependency path, the test plane, the **real product profile/boot**
and the repository's own gate were all executed:

1. `pnpm install` resolves the full `0.1.7-rc.2` tree; `pnpm install
   --frozen-lockfile --ignore-scripts` then exits **0** ("Lockfile is up to
   date, resolution step is skipped"), proving `pnpm-lock.yaml` matches
   `package.json` exactly (`docs/adaptation/01-deps.md` §3.2).
2. The test plane on `0.1.7-rc.2`: `packages/jev-core` **8 files / 85 tests
   passed** and `packages/dsh-jev` **7 files / 62 tests passed** — zero delta
   from the baseline on both suites (`docs/adaptation/05-tests.md`;
   `docs/adaptation/04-client.md` §0).
3. Both typechecks at `0.1.7-rc.2` exit 0, and `tsdown` builds
   `packages/dsh-jev/lib/client.js`, which was then loaded with stub globals and
   verified to honor the loader contract (`docs/adaptation/04-client.md` §0, §5).
4. **The real 0.1.7-rc.2 product composes and mounts this plugin.**
   `dsh --version` → `0.1.7-rc.2`; a **throwaway** profile was created under
   `%TEMP%\dsh-verify\dsh-cli-home{,2}` (the user's live `DSH_HOME` and `~/.dsh`
   were byte-identical before and after); `dsh plugin --profile … add` and
   `--dump-config` composed the `# == @buberlo/dsh-jev` layer with the `jev`
   row; and a real boot **instantiated `JevRuntime` through `cordis@4.0.4`**,
   failed closed with the exact `provider "live" requires an explicit apiKey`
   error, then stopped at `MISSING_CREDENTIAL: llm-deepseek` at the LLM stage
   (`docs/adaptation/07-verification.md` §2.9). This is the strongest executed
   proof of the upgrade.
5. **The repository's own gate, `pnpm verify`, exits 0** — run twice, both
   `verify: OK`. Stage results: install (frozen lockfile) · build · typecheck ·
   tests 85 + 62 · mock evals 25/25 plus on-prem 9/9 regression and 5/5 held-out ·
   `calibrate` (exit code only — `scripts/verify.sh` redirects its output to
   `/dev/null`, so what ran is proven, its printed output was not observed) ·
   four examples (coding, ops, game, dsh) · `pnpm test:packaging` **PASSED** with
   `smoke: OK (… single cordis …)` and `tsc: no output (clean)`. Raw logs:
   `%TEMP%\jev-adapt\t8-verify{,2}.log`; recorded in
   `docs/adaptation/06-docs.md` §10. Running the gate required a repo
   `.gitattributes` (shell scripts must be checked out LF) and two
   platform-correct spawns in `scripts/packaging-test.mjs` — both pre-existing
   defects, see §10 there.
6. `pnpm bench:compare` exits 0 with the same functional columns as the
   pre-upgrade record (`docs/adaptation/05-tests.md` §6), re-confirmed by the
   verifier (`07-verification.md` §2.10).
7. The lockfile contains **zero** `0.1.6-alpha.2` references and no
   `dsh-settings-file` entry (grep sweep recorded in
   `docs/adaptation/06-docs.md`).

What was **not** executed here: serving and interacting with the **web client**
(no browser), and any in-browser client → Host write round trip. Those remain in
"(c) not verified" below.

### [carried over, 0.1.6-alpha.2] — reproduced registry proof (2026-09-19)

This subsection is the older, equivalent proof of the same path at the previous
release. It is kept as history because the 2026-09-19 run used the **published
registry tarballs and `dsh plugin add`**, while the 0.1.7-rc.2 proof above used
this local checkout; the substance (loader instantiation, fail-closed error,
mount) is verified at `0.1.7-rc.2` by item 4.

1. `pnpm build`, then `pnpm pack` both packages.
2. Fresh consumer project:
   `npm install <core.tgz> <dsh-jev.tgz> <pinned DSH peers>` → plugin loads,
   fails closed, and resolves the **consumer's** Cordis instance (no second
   runtime bundled).
3. `tsc --noEmit` against the installed declarations → clean.
4. Real product CLI: `npm install @deepseek-ai/dsh@0.1.6-alpha.2`, profile
   created with `--from-default-profile headless`, our tarballs placed in the
   profile and the bundle name added to `dsh.profile.bundles`.
   - `dsh --profile <name> --dump-config` printed the
     `# == @buberlo/dsh-jev` layer with the `jev` row.
   - Booting with a `live`-without-key patch failed through
     `cordis-plugin-loader` with our exact config error, proving the real
     loader instantiated `JevRuntime`.
   - Booting with valid config reached the LLM credential/authentication stage,
     i.e. the tree (including this plugin) mounted.

> **The `0.1.6-alpha.2` specifics below are not re-executed.** The `0.1.7-rc.2`
> product tree also needs `@deepseek-ai/dsh-config-editor` and no longer mounts
> `@deepseek-ai/dsh-settings-file` (delta §6.4), so the profile layer this proof
> exercised has changed. Do not quote the *tarball/registry* form as a
> `0.1.7-rc.2` result; use item 4 above for that.

### [carried over, 0.1.6-alpha.2] Web client served proof (2026-09-19)

A `web` profile was created from the shipped `@deepseek-ai/dsh-web-app` bundle,
this repository's tarballs were placed in its dependency tree, and the bundle
was added to `dsh.profile.bundles`. Booting `dsh --profile <name> --no-open`
served the application, and the boot HTML listed
`@buberlo/dsh-jev/client.js` among the client modules. Fetching the composed
module bundle returned our module verbatim:

```text
window.__ModuleLoader__.load({ id: "@buberlo/dsh-jev", factory: (require) => { ... } })
```

The served module also contained the `settings.jev` and `plugins.bundle.config`
strings, i.e. the page the card registered into.

> **Not re-executed at `0.1.7-rc.2`, and the `settings.jev` namespace string no
> longer exists**: the client reads a form through the config-forms service and
> the settings document is the profile patch (see "Settings and the web
> client"). The artifact contract itself is unchanged (delta §6.3).

## Demonstrated restrictions

Each entry records whether it was re-checked in this upgrade.

- **Client live counters are blocked upstream — unchanged at `0.1.7-rc.2`.**
  The web client's Remote capability set is fixed by build-time value imports.
  `dsh-api-remotes@0.1.7-rc.2/README.md:73` states, verbatim: *"The capability
  set is fixed by explicit build-time value imports; the Client does not discover
  the Host's active Services or Remote definitions at runtime."* The README
  changed elsewhere (new account/schedule namespaces and forwarded events), but
  not that line (delta §8(b)). An out-of-tree plugin therefore still cannot add a
  `ctx.remote.<namespace>` status method. The card shows configured state; live
  decision outcomes are visible where they already surface — in the session's
  tool results (`[jev] <rule>`). [verified from shipped tarballs]
- **Published client test runtime unusable from npm — still true at
  `0.1.7-rc.2`, now with an executed proof.**
  `@deepseek-ai/dsh-client-test-runtime@0.1.7-rc.2` cannot be imported from the
  registry. `[executed, 0.1.7-rc.2]` `docs/adaptation/05-tests.md` §5 records the
  failure and its two causes:
  1. `lib/index.js:5-6` imports
     `@deepseek-ai/dsh-client-ui-renderer/src/client/bind.ts` and
     `.../scoped-slots.tsx`, while the published renderer ships only `lib/` (its
     `files` list excludes `src`) yet still advertises
     `exports["./src/*"]`; the direct import fails with `ERR_MODULE_NOT_FOUND`.
  2. `lib/index.js:12` imports
     `@deepseek-ai/dsh-api-session-controller/src/client/scope.ts` — a declared
     peer that is not installed in this workspace **and** whose published tarball
     likewise ships no `src/`. This second cause was marked "not verified" in
     `docs/upstream-delta-0.1.7-rc.2.md` §10.3 and was then closed by execution.
  Additionally the package declares 23 `peerDependencies`, seven of which this
  repository does not supply. The slot test bench therefore still cannot load
  from npm; `packages/dsh-jev/tests/client-card.spec.ts` exercises `apply()`
  against a recording fake context and renders the real component directly
  instead. The `0.1.5-rc.2`/`0.1.6-alpha.2` form of this limitation is
  [carried over] history.
- **PTC / code mode — [carried over, 0.1.6-alpha.2]; not re-checked.**
  `run_code` sub-dispatches traverse the same pipeline and are assessed (tested
  with a nested dispatch at `0.1.6-alpha.2`), but a full PTC runtime was not
  mounted here; `mode: ptc` would additionally require
  `@deepseek-ai/dsh-ptc-runtime-node` or equivalent. Neither the delta report
  nor this upgrade changed or re-ran that conclusion.
- **Model catalog is advisory — [executed, 0.1.7-rc.2, documentation only].**
  `ctx.llm.listModels()` is documented as advisory and does not validate routing;
  the `0.1.7-rc.2` wording is slightly tighter — *"Core routing accepts unlisted
  model ids; catalog-driven entry points such as the GUI may require
  membership"* (`dsh-llm/lib/types/index.d.ts:344-350`). The adapter still treats
  absence from the catalog as "not verified" and falls back to the existing
  model. A route is never invented (delta §5).
- **Live run — [carried over, 0.1.6-alpha.2], 2026-09-19, `jev-1.13.0`.** First
  dataset 15/15 fixture agreement, 0 errors, mean 528 ms; after growth, 25/25
  (see `docs/evaluation.md`). Reproducible with an explicit key; without one the
  runner reports *not executed*, never a pass. **Not re-executed at
  `0.1.7-rc.2`.**
- **Approval requires an open turn upstream — [carried over]; unchanged.**
  Assessments only run inside the tool pipeline, so this is satisfied by
  construction.
- **Desktop stable (`0.1.5-rc.2`) is below the verified range.** DSH Desktop
  2.0.13 bundles `@deepseek-ai/dsh*` at `0.1.5-rc.2`; the verified matrix is now
  `0.1.7-rc.2`, so both `0.1.5-rc.2` and `0.1.6-alpha.2` are older bundles and
  are not supported selection targets. Selection may no-op when the tool catalog
  for the agent resolves empty — `ctx.tools.schemas(agent)` filtered to names
  `ctx.tools.get(name)` resolves globally — while assessment and loop detection
  still run; the turn stays on the existing tool set. With selection enabled,
  that path logs one warning per agent session:
  `tool selection skipped: tool catalog resolved empty for this agent`.
- **Registry line is `0.1.4` — [carried over, 0.1.6-alpha.2 era, 2026-09-23].**
  `npm view` lists `0.1.0`, `0.1.2`, `0.1.3`, and `0.1.4` for
  `@buberlo/jev-core` and `@buberlo/dsh-jev`. There is **no `0.1.1`**. Dist-tag
  `latest` is `0.1.4` for both. The workspace is now **`0.1.5`** (unpublished,
  see the note at the top), so this published line is what every install
  instruction still resolves to. The end-to-end
  profile install was verified on 2026-09-19, when `0.1.0` was the only version:
  `dsh plugin add @buberlo/dsh-jev` installed both packages transitively into a
  fresh profile, `--dump-config` composed the bundle layer, a headless boot
  loaded the host plugin, and a running web profile served
  `@buberlo/dsh-jev/client.js`. That profile boot has not been repeated for
  `0.1.4`. `npm install @buberlo/dsh-jev@0.1.4` does succeed and resolves
  `@buberlo/jev-core@0.1.4` (`^0.1.4`). Local `0.1.1` was a README-only bump that
  was never published. `@buberlo/dsh-jev@0.1.2` was packed with npm, not pnpm, so
  it still depends on `@buberlo/jev-core` with a literal `workspace:^`;
  `npm install` fails with `EUNSUPPORTEDPROTOCOL`. Do not recommend it. The
  `@buberlo/dsh-jev@0.1.3` tarball has the same `workspace:^` break and fails the
  same way. `0.1.3` was abandoned after a granular bypass-2FA token staged it
  (E409, cannot publish over a previously staged version); `0.1.4` is the version
  that was published instead. Future releases are manual and must be pnpm packs
  (`docs/publishing.md`). Both packages still publish the `0.1.6-alpha.2`-era DSH
  ranges; the current workspace (`0.1.5`) declares `0.1.7-rc.2`, so publishing
  `0.1.5` would be the first release to carry the new matrix.
- **The repo's own `pnpm typecheck` gate does not compile `tests/**` —
  pre-existing, not upgrade fallout.** `tsconfig.json` / `tsconfig.client.json`
  include only `src/**`, so a stale type-only import inside a test file is
  invisible to `pnpm typecheck`. This upgrade caused exactly one such import
  (`tests/client-card.spec.ts`, `SettingsScope` → `ConfigForm`); further
  pre-existing occurrences in three test files are byte-identical on the
  pre-upgrade HEAD — `agent-loop.spec.ts:210` and `:347`,
  `onprem-support.spec.ts:19` and `:126`, `selection-empty-catalog.spec.ts:119`
  (`docs/adaptation/05-tests.md` §4.2).
  They are pinned down there, not fixed here, and they do **not** indicate an
  upstream incompatibility.

## What is verified at 0.1.7-rc.2

Added by this upgrade. Keep this section editable: the independent verifier
(task-7) reconciles it with its own report.

### (a) Executed in this upgrade, at `0.1.7-rc.2`

| Path | Result | Evidence |
|---|---|---|
| Dependency resolution + lockfile self-consistency | `pnpm install --frozen-lockfile --ignore-scripts` exit 0; lockfile has zero `0.1.6-alpha.2` refs, zero `dsh-settings-file` entries | `docs/adaptation/01-deps.md` §3.2; grep sweep in `docs/adaptation/06-docs.md` |
| Pre-bump baseline — **executed at the `0.1.6-alpha.2` pins, immediately before the bump** | build, typecheck and tests green: core 85 / dsh-jev 62 | `docs/adaptation/01-deps.md` §1 |
| `packages/jev-core` test suite at `0.1.7-rc.2` | 8 files / 85 tests passed | `docs/adaptation/05-tests.md` |
| `packages/dsh-jev` test suite at `0.1.7-rc.2` | 7 files / 62 tests passed — **zero delta** from the `0.1.6-alpha.2` baseline | `docs/adaptation/05-tests.md`, `docs/adaptation/04-client.md` §0 |
| `tests/settings-section.spec.ts` at `0.1.7-rc.2` | 6 cases pass against the real Loader + real profile patch + real settings service; hermetic — `vi.stubEnv('DSH_HOME')`/`vi.unstubAllEnvs()`, identical result with a decoy, an unset and the ambient home | `docs/adaptation/04-client.md` §7 |
| `pnpm bench:compare` at `0.1.7-rc.2` | exit 0; functional columns identical to the pre-upgrade record | `docs/adaptation/05-tests.md` §6; re-run in `docs/adaptation/07-verification.md` §2.10 |
| `dsh-client-test-runtime@0.1.7-rc.2` importability | `ERR_MODULE_NOT_FOUND` (two causes) | `docs/adaptation/05-tests.md` §5 |
| Typecheck at `0.1.7-rc.2` | `tsc -p tsconfig.json --noEmit` **and** `tsc -p tsconfig.client.json --noEmit` both exit 0 | `docs/adaptation/04-client.md` §0; re-run as gate stage 3, `06-docs.md` §10 |
| Build + artifact load at `0.1.7-rc.2` | `tsdown` exit 0; the emitted `lib/client.js` evaluated with stub globals: `loaded.id="@buberlo/dsh-jev"`, `require()` calls `["react","react/jsx-runtime"]`, `exports=["apply","inject"]`, `inject` sorted `["configForms","locale","slots"]`, cross-plugin value import **false** | `docs/adaptation/04-client.md` §5; independently reproduced in `07-verification.md` §2.6 |
| Real-pipeline test subset (tool-runtime, agent-loop, onprem, selection, skill-install) | 5 files / 50 tests passed against the real ToolRuntime + real agent loop | `docs/adaptation/03-host.md` §7.1 |
| **Real 0.1.7-rc.2 product: profile composition + boot** | `dsh --version` → `0.1.7-rc.2`; a **throwaway** profile composed the `# == @buberlo/dsh-jev` layer with the `jev` row; a real boot instantiated `JevRuntime` through `cordis@4.0.4`, failed closed with the exact apiKey error, then reached `MISSING_CREDENTIAL: llm-deepseek`. Live `DSH_HOME` and `~/.dsh` byte-identical before/after | `docs/adaptation/07-verification.md` §2.9 |
| **The repository gate `pnpm verify`** | **exit 0, twice**, `verify: OK`; stages: install (frozen lockfile) · build · typecheck · tests 85 + 62 · mock evals 25/25 + on-prem 9/9 regression, 5/5 held-out · `calibrate` (exit only — output is redirected to `/dev/null`, so its printed output was not observed) · examples (coding, ops, game, dsh) · packaging | `docs/adaptation/06-docs.md` §10; raw logs `%TEMP%\jev-adapt\t8-verify{,2}.log` |
| **`pnpm test:packaging`** | **PASSED**: `smoke: OK (standalone core, real plugin load, fail-closed enforcement, single cordis, client artifact)` and `tsc: no output (clean)` | `docs/adaptation/06-docs.md` §10 |

### (b) Carried over from `0.1.6-alpha.2` — not re-executed

- `npm install @deepseek-ai/dsh@0.1.6-alpha.2` in a temporary directory.
- `dsh --profile <name> --dump-config` composing the `# == @buberlo/dsh-jev`
  layer, and the headless boot proofs (loader instantiation, config error,
  mount to the credential stage) — 2026-09-19.
- The web-profile served-artifact proof — 2026-09-19.
- The `@buberlo/*` registry/install check (`latest` `0.1.4`) — 2026-09-23.
- The PTC "runtime not mounted" conclusion.
- The live TypeSafe measurement (`jev-1.13.0`, 25/25, 2026-09-19).
- The `0.1.5-rc.2`/`0.1.6-alpha.2` form of the client-test-runtime limitation.

### (c) Not verified

1. **Serving and interacting with the web client at `0.1.7-rc.2`.** No browser is
   available here. The real product boot above proves the **host** half mounts;
   the client half served by a running `web` profile is **not** verified (the
   served-module proof in (b) is the `0.1.6-alpha.2` one).
2. **The browser → Host write round trip.** The settings write path is proven on
   the **host** side (real Loader + real profile patch + real settings service,
   `04-client.md` §7) and on the **artifact** side (the emitted `lib/client.js`
   loads and exports `apply`/`inject`, `04-client.md` §5), and the card's ops are
   asserted against a strict one-segment/path-op double; the real in-browser call
   is not executed (`04-client.md` §9.2).
3. **Behavioural equivalence of the changed `lib/*.js` files** for `dsh-tools`,
   `dsh-agent`, `dsh-agent-loop`, `dsh-settings`, `dsh-session` and the
   `dsh-client-*` packages: declarations and shipped READMEs were read in depth;
   a per-package runtime diff was not attempted (delta §10.4).
4. **`pnpm calibrate`'s printed output.** Under the gate it runs with its output
   redirected to `/dev/null`; only its exit code (0) is observable. It was not
   run unredirected.
5. **A non-string `apiKey` on a `live` + enabled write is refused** rather than
   judged (e.g. an unevaluated `!!js` expression in the profile document). The
   0.1.6 hook saw a resolved section and could judge it; this is a deliberate,
   safety-weighted deviation (`04-client.md` §9.1).
6. **The `@deepseek-ai/cordis-plugin-loader` `loader/volatile-update` DSH-side
   wiring** (mentioned only in `cordis@4.0.4/README.md`; delta §10.6).
7. **`engines` ranges of the `0.1.7-rc.2` packages** — `engines` was not part of
   the extracted comparison (delta §10.7).
8. **A pristine-machine `pnpm install --frozen-lockfile`.** `node_modules` was
   never deleted during the upgrade, so a clean install was not proven. In
   particular, the local store still holds unreachable stale directories
   (`cordis@4.0.2`, `schemastery@3.18.2`, `dsh-llm@0.1.6-alpha.2`,
   `dsh-settings-file@0.1.6-alpha.2`); nothing resolves them and the committed
   lockfile cannot be their source, but a `--frozen-lockfile` install does not
   prune them (`07-verification.md` D1; raw scan in
   `docs/adaptation/06-docs.md` §10).

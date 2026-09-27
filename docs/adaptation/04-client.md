# 04 — Settings subsystem + web client (DSH 0.1.6-alpha.2 → 0.1.7-rc.2)

Owner: `settings-adapt` (task-4). Scope: `src/settings-section.ts`, `src/client/**`,
`src/config.ts` + `src/service.ts` (read-side, added by Lead decision),
`tests/settings-section.spec.ts`, `packages/dsh-jev/package.json`, `pnpm-lock.yaml`.

Verdicts (all executed in this working tree, commands quoted where they matter):

| Gate | Command | Result |
|---|---|---|
| Host typecheck | `pnpm --filter @buberlo/dsh-jev exec tsc -p tsconfig.json --noEmit` | exit 0 |
| Client typecheck | `pnpm --filter @buberlo/dsh-jev exec tsc -p tsconfig.client.json --noEmit` | exit 0 |
| Package build | `pnpm --filter @buberlo/dsh-jev run build` (`tsc` ×2 + `tsdown`) | exit 0 |
| Artifact load | stub `window.__ModuleLoader__` + stub `require` over emitted `lib/client.js` | see §5 |
| Tests | `pnpm --filter @buberlo/dsh-jev test` | 7 files, **62/62 passed** |
| Test typecheck | `tsc -p <temp probe extending tsconfig.json>` over `tests/settings-section.spec.ts` (the repo's `typecheck` script covers `src/**` only, and vitest does not typecheck) | exit 0 under the full strict settings |
| Lockfile | `pnpm install --frozen-lockfile --ignore-scripts` | exit 0, "Lockfile is up to date" |

---

## 1. OLD → NEW settings API mapping

The 0.1.7-rc.2 API is a redesign, not a rename: the settings document **is** the
active profile's Cordis patch, `SettingsForms` projects it entry by entry, and a
plugin contributes by marking its schema's editable fields `.volatile()`.

| # | 0.1.6-alpha.2 | 0.1.7-rc.2 | Declaration / implementation citation |
|---|---|---|---|
| 1 | `ctx.settings.installSection(owner, ns, schema, entry, hooks)` | **Gone.** The plugin registers nothing: `SettingsForms.describe()` projects every active Loader entry whose `Config` has volatile fields. | `dsh-settings/lib/types/index.d.ts:62-117` (no `installSection`); `lib/types/schema.d.ts:7-11` (`volatileForm`); `lib/index.js:413-464` |
| 2 | Namespace chosen by the plugin (`JEV_SETTINGS_NS = 'jev'`) | The **Loader profile entry id** (`entry.options.id`); the form key is that id | `dsh-settings/lib/index.js:420-443` (`ns: entry.options.id`); `dsh-client-ui-settings/lib/types/client/config-form.d.ts:138-142` (`@param entryId Unique Host plugin entry id`) |
| 3 | `hooks.setSource(current => source = current)` | The volatile **reference object itself**: the Loader commits a parsed field into the running fiber's reference in place, so re-reading it *is* the source | `cordis-plugin-loader/lib/index.js:393-425` (`_commitVolatile`, `updateVolatile(ref, source)`) |
| 4 | `hooks.onChange(() => runtime.reconfigure(source()))` | `ctx.on('loader/volatile-update', paths => runtime.reconfigure(entry))` | `cordis-plugin-loader/lib/types/index.d.ts:29` (event declaration); emitted at `lib/index.js:417-424` |
| 5 | `hooks.validate(value)` (throw to refuse a write) | `ctx.on('internal/config', function (_config, next) { const c = next(); if (this !== ctx.fiber) return c; …throw…; return c })` | `cordis/lib/types/events.d.ts:226`; dispatched by `dsh-config-editor/lib/index.js:76-77` before persistence and by `cordis-plugin-loader/lib/index.js:400` before a volatile commit |
| 6 | `ctx.settingsScope.bind({ namespace: 'jev' })` | `ctx.configForms.get<T>(entryId)` → `ConfigForm<T>` | `dsh-client-ui-settings/lib/types/client/config-form.d.ts:106-142`; provided as `configForms` at `lib/client.js:1284` |
| 7 | Types `SettingsScope`, `SettingsScopeSnapshot` | Types `ConfigForm`, `ConfigFormSnapshot` | `dsh-client-ui-settings/lib/types/client/index.d.ts:4-8`, `client/config-form-types.d.ts:6-74` |
| 8 | `scope.set('selection.enabled', value)` (dotted field) | `set` addresses **one** path segment; nested writes are path ops: `mutate([{ op:'set', path:['selection','enabled'], value }])` | `config-form.d.ts:55-81`; implemented at `lib/client.js:1152-1158` (`path: [field]`) |
| 9 | Section registered while a settings provider is mounted | `configure({ auto: false }, ctx.fiber)` inside `ctx.inject(['settings'], …)`, so no auto-generated page competes with the shipped card | `dsh-settings/lib/types/index.d.ts:74-82`; README.md:39 |
| 10 | `apiKey` carries `role('secret')` | **Unchanged** — still `role('secret')`, still stripped by `redactSecrets` and reported as a presence marker | `src/config.ts:243`; `dsh-settings/lib/index.js:22-30, 440-450` |
| 11 | Client `inject` included `remote` | `['slots','locale','configForms']` — `remote` dropped; the settings transport lives behind `configForms`, whose *providing* fiber holds `remote.settings` | `config-form.d.ts:113-118` ("letting a shared form write through the caller's context would make every caller declare `remote.settings`") |

### api-delta open item 1 — which key does the write actually use?

**Executed answer:** the **profile entry id**, which in this plugin happens to
equal the old namespace literal `'jev'`.

- Read from the implementation, not the docs: `dsh-settings/lib/index.js:420-443`
  builds every descriptor with `ns: entry.options.id`, and
  `SettingsForms.write()` re-finds the entry with
  `configEditor.entries().find(row => row.options.id === ns)` (`lib/index.js:502-504`).
- Observed in the executed test: the fixture's row is declared with `id: jev` in
  the profile patch and `ctx.settings.describe()` returns a row whose `ns` is
  exactly `'jev'`; `ctx.settings.update('jev', …)` then succeeds against it
  (`tests/settings-section.spec.ts` cases 1-4 and 6).
- `config-form.d.ts:10-12` separately calls `ConfigFormSpec.namespace` the
  "Settings namespace registered by the owning Host plugin", i.e. the wire-facing
  name of the same id. No code in this package relies on the coincidence: the
  client literal (`src/client/index.tsx:53`) and the row id
  (`cordis.patch.yml`) are two spellings of one identity, documented at
  `src/settings-section.ts:33-38`.

---

## 2. Host changes

### `src/config.ts`

| Line | Before | After | Why required | Impact | Verification |
|---|---|---|---|---|---|
| 208-293 | plain schemastery fields | every form-editable leaf carries `.volatile()`; arrays/dicts are marked on the node itself, nested objects stay plain | Only volatile fields become a form (`volatileForm`) and only volatile paths are writable (`isVolatilePath`); without the marks `describe()` omits the entry and every write throws `Plugin entry "jev" has no volatile fields` (`dsh-settings/lib/index.js:505-507`) | Behaviour: the entry becomes editable; the running runtime is rebuilt from the committed references instead of by remount | `settings-section.spec.ts` 1-4, 6; `tsc` exit 0 |
| 289-293 | `mock: { answers, delayMs }` | deliberately **not** volatile | `mock` is scenario data no form edits; leaving it ordinary keeps it out of every form and `SettingsForms.write`'s `strip()` preserves it verbatim (`lib/index.js:524-534`) | Behaviour: `mock.delayMs` survives settings writes (case 6 depends on it) | case 6 (delayed mock + a `mode` write) |
| 142-215 | — | new `ParsedConfig` (and `ParsedModelRouteConfig`): the parsed view where editable fields are `Volatile<…>` | The schema type must be **named** portably; see §3 | Compile-only + a schema/output cross-check | `tsc` exit 0 |
| 239 | `export const Config: z<Config> = z.object({…})` | `export const Config: z<Config, ParsedConfig> = z.object({…})` | TS2883: with the marks added, the *inferred* type references cosmokit's `Dict` through `z.dict(...)` and cannot be written into the emitted `.d.ts`. The annotation also makes the compiler check that the schema really produces `ParsedConfig` | Compile-only | `tsc` exit 0 |
| 374-376 | — | `plainConfig(config: Config): Config` = `Config.simplify(config) ?? {}` | A parsed field is a reference; `Schema.simplify` is schemastery's own "resolve references, drop default-equal values" operation (`schemastery/src/index.ts:422-458`). Dropping defaults is safe because `resolveSettings` re-applies every default identically (all 40 diffed); `?? {}` covers `simplify`'s whole-config `null` for an unconfigured entry | Behaviour: the runtime reads the committed values | measured probe (below) + cases 1-4, 6 |

Measured before writing `plainConfig` (throwaway node probe against the marked
schema, schemastery 3.18.4):

```text
SCHEMA ACCEPTED (validateVolatileSchema passed at parse)
provider volatile ref: true | get() = live
mode absent -> volatile ref: true | get() = shadow
mock volatile: false | mock.delayMs volatile: false
selection.enabled volatile: true | categories volatile: true
simplify(explicit live+k+selection off) = {"provider":"live","apiKey":"k","selection":{"enabled":false}}
simplify(empty) = null
simplify(plain untagged input) = {"mode":"enforce"}
simplify(mock answers) = {"mock":{"answers":{"q1":"a"},"delayMs":5000}}
```

### `src/service.ts`

| Line | Before | After | Why | Impact | Verification |
|---|---|---|---|---|---|
| 21 | `import { Config as ConfigSchema, resolveSettings, … }` | also imports `plainConfig` | the read-side unwrap | compile-only | `tsc` exit 0 |
| 80 | `resolveSettings(config)` | `resolveSettings(plainConfig(config))` | the constructor receives the **parsed** config; reading a reference as if it were a value would make `settingsValue.provider` an object | Behaviour: identical values from the composed entry | cases 1, 2, 5, 6 |
| 141-142 | `resolveSettings(config)` | `resolveSettings(plainConfig(config))` after re-reading `entry` | replaces the removed `setSource`/`onChange` pair: re-reading the committed references adopts exactly the stored document | Behaviour: a committed write reconfigures the running service without a remount | case 2, case 6 |

### `src/settings-section.ts` (rewritten)

| Line | Before | After | Why | Impact | Verification |
|---|---|---|---|---|---|
| 1-31 | doc claiming `installSection` registration | doc describing the three new contributions | the module's contract changed | none | — |
| 33-38 | `JEV_SETTINGS_NS` = namespace argument | same constant, now documented as the **profile entry id** the shipped card binds; no longer passed to any API | the identity moved from a name to the entry; keeping the constant keeps both halves' literals discoverable | none (internal; not re-exported from `src/index.ts`) | §1 answer |
| 58-70 | `validate` hook (resolved values) | `assertLiveProviderUsable(candidate)`: refuses `provider:'live'` when `mode !== 'off'` and `apiKey` is not a non-empty string | the hard invariant; `mode !== 'off'` also covers an omitted mode, which resolves to the schema default `shadow` and still enables the provider | Behaviour: a live-without-key write is refused *before* persistence | case 4 (rejects `/apiKey/`, then accepts with a key) |
| 88-95 | — | `ctx.inject(['settings'], settingsCtx => settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber)))` | page policy, replacing "register the section while a provider is mounted"; the plugin still runs with no settings service (the child context never activates) | Behaviour: same user-visible capability, no auto-page duplicate | case 5; `tsc` |
| 90-97 | — | `ctx.on('internal/config', …)`: `next()` first, guard on `this !== ctx.fiber`, then validate | this waterfall runs before `config-editor` persists (`lib/index.js:76-77`) *and* before the Loader commits volatile refs (`cordis-plugin-loader/lib/index.js:400`) | Behaviour: the document and the runtime can never disagree | case 3 (schema rejection), case 4 (invariant) |
| 100-102 | — | `ctx.on('loader/volatile-update', () => runtime.reconfigure(entry))` | the Loader has already committed the new values into the references inside `entry` when this fires | Behaviour: rebuild the runtime on every committed change | case 2, case 6 |

Signature stability: `installSettingsSection(ctx, runtime, entry)` is unchanged,
so `src/service.ts:102` needed no edit.

---

## 3. Why the `.volatile()` placement is the nested-object shape, and why the annotation is `z<Config, ParsedConfig>`

Measured constraints (schemastery `src/index.ts`):

- `:480-482` `.volatile()` throws if applied twice to one schema.
- `:488-509` `validateVolatileSchema` throws
  `volatile fields require a fixed object path without an enclosing volatile field`
  for a volatile node behind a dynamic key (`dict`/array element, traversed with
  `blocked = true`) or nested inside another volatile node.
- → volatile **leaves** inside plain nested objects; `array`/`dict` fields marked
  on the node itself. The probe in §2 confirmed the exact shipped schema parses.

Two shapes were measured for the schema's declared type. The Lead's option
(B) — no annotation, relying on inference — **does not compile for this schema**:

```text
src/config.ts(155,14): error TS2883: The inferred type of 'Config' cannot be named
  without a reference to 'Dict' from '.pnpm/@deepseek-ai+cosmokit@1.8.5/…'. This is
  likely not portable. A type annotation is necessary.
src/service.ts(54,10): error TS2883: (same, via `static Config = ConfigSchema`)
```

`z.dict(...)` puts cosmokit's `Dict` into the inferred type, and a published
declaration cannot name it without adding cosmokit as a runtime dependency.
Option (A) — `z<Config, ParsedConfig>`, the shape `dsh-agent-loop@0.1.7-rc.2`
itself uses (`lib/types/index.d.ts:102`) — compiles and additionally gives a
compile-time check that the schema's output matches `ParsedConfig`
(`tsc` exit 0). `Config` therefore keeps its 0.1.6 meaning (the plain values a
caller supplies and the runtime reads); this is why all ten
`JevPluginConfig`/`ctx.plugin(JevPlugin, {…})` call sites in `tests/`,
`bench/`, `examples/` and `scripts/` still typecheck unchanged.

---

## 4. Client changes

| File:line | Before | After | Why | Impact | Verification |
|---|---|---|---|---|---|
| `src/client/jev-card-controller.ts:12` | `import type { SettingsScope }` | `import type { ConfigForm }` | `SettingsScope` no longer exists (TS2305) | UI: none | `tsc` client exit 0 |
| `…controller.ts:39` | `setField(field, value: unknown)` | `setField(field, value: JevSettingValue)` (`string \| number \| boolean \| null`) | the write face is typed by `SettingsPathOpView.value`, so this is what lets the compiler check the write shape | UI: none (the card only writes strings/booleans) | see the probe in §5 |
| `…controller.ts:74-77` | `constructor(scope: SettingsScope<JevSettings>)` | `constructor(form: ConfigForm<JevSettings>)` | the new provider face | UI: none | `tests/client-card.spec.ts` 6/6 |
| `…controller.ts:100-110` | `this.#scope.set(field, next)` (dotted field) | `this.#form.mutate([{ op:'set', path: field.split('.'), value: next }])`, then throw when the Host answers `false` | `set` addresses **one** segment: the old dotted call would have written a literal top-level `"selection.enabled"` key. `mutate`'s `false` means "the Host refused", which the card must surface instead of reporting success | UI: identical controls; refusals now surface as failures (previously the scope rejected) | strict one-segment double in `tests/client-card.spec.ts` asserts the exact ops |
| `src/client/JevCard.tsx:16,57` | `persist(field, value: unknown)` | `persist(field, value: JevSettingValue)` | follows the narrowed face | UI: none | `tsc` client exit 0 |
| `src/client/index.tsx:41` | `inject = ['slots','locale','remote','settingsScope']` | `['slots','locale','configForms']` | `settingsScope` is gone; `remote` is no longer touched (see §1 row 11) | UI: none | artifact load (§5), `scripts/packaging-test.mjs:170` updated by docs-adapt to `['configForms','locale','slots']` |
| `src/client/index.tsx:50-57` | `ctx.settingsScope.bind<JevSettings>({ namespace:'jev' })` | `ctx.configForms.get<JevSettings>(ENTRY_ID)` (`ENTRY_ID = 'jev'` at `:50`, call at `:57`) | the new accessor | UI: none | artifact load; `tests/client-card.spec.ts` |
| `src/client/index.tsx:56-63` | page registration unchanged (`plugins.bundle.config`, key = package name, `locale`, `inject: () => controller.inject()`) | unchanged | the slot contract's owner props are now `{ view:'page', form? }` and the page passes **no** `form` for bundle config (`dsh-client-ui-plugin-manager/lib/client.js:1973`), so the card keeps fetching its own form from `configForms` | UI: **none** — same card, same controls, same write path | artifact load + client-card spec |

**User-visible capability: unchanged.** The card still shows the configured
state, edits mode/provider/features, and writes a write-only `apiKey`
(`role('secret')` ⇒ the value never reaches the browser; only its presence does).
No capability was added, dropped, or downgraded by the redesign.

---

## 5. Artifact load evidence (executed, not inferred)

`pnpm --filter @buberlo/dsh-jev exec tsdown` → `lib/client.js 16.57 kB`. Then the
emitted file was evaluated with a stub `window.__ModuleLoader__` and a stub
`require` that **throws for any specifier outside the platform set**:

```text
loaded.id      = "@buberlo/dsh-jev"
typeof factory = function
require() calls = ["react","react/jsx-runtime"]
exports         = ["apply","inject"]
inject sorted   = ["configForms","locale","slots"]
typeof apply    = function
require specifiers in source      = ["react","react/jsx-runtime"]
cross-plugin value import present = false
exit=0
```

So: `window.__ModuleLoader__.load({ id, factory })` is honored; only
`react` / `react/jsx-runtime` resolve through the injected require; no
cross-plugin value import exists; and the artifact still exports `inject` (the
array `scripts/packaging-test.mjs:170` asserts).

### The `@deepseek-ai/dsh-api-remotes` hole, closed and proven

`config-form-types.d.ts:4` imports `SettingsPathOpView` from
`@deepseek-ai/dsh-api-remotes/client`. That package was absent, and with the
repo's `skipLibCheck: true` the unresolved import degrades to `any`, so
`mutate`'s argument was unchecked. Measured with a throwaway probe file
(`src/client/zz-probe-tmp.ts`, written, compiled, deleted):

```ts
import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
declare const form: ConfigForm<{ mode?: string }>
export async function probe(): Promise<boolean> {
  return form.mutate([{ op: 'typo', path: 42, value: Symbol('x') }])
}
```

```text
BEFORE (no @deepseek-ai/dsh-api-remotes):  tsc -p tsconfig.client.json --noEmit  → exit 0
AFTER  (0.1.7-rc.2 added, exact pin):      exit 1
  src/client/jev-card-controller.ts(96,11): error TS2322: Type 'unknown' is not assignable to type 'JsonValue'.
  src/client/zz-probe-tmp.ts(7,25): error TS2322: Type '"typo"' is not assignable to type '"set" | "unset"'.
  src/client/zz-probe-tmp.ts(7,37): error TS2322: Type 'number' is not assignable to type 'string[]'.
  src/client/zz-probe-tmp.ts(7,47): error TS2322: Type 'symbol' is not assignable to type 'JsonValue'.
```

The transition closed the hole and immediately surfaced a real defect in this
package's own controller (`value: unknown` not assignable to `JsonValue`), which
is fixed at `jev-card-controller.ts:39`. The dependency is imported as a
**type only**; it appears nowhere in the emitted `lib/client.js` (require
specifiers above are still only `react`, `react/jsx-runtime`).

---

## 6. `@deepseek-ai/dsh-settings-file` removal

Evidence, in the order it was established:

- Registry (recorded by the Lead and in `docs/adaptation/01-deps.md`):
  `@deepseek-ai/dsh-settings-file` has no `0.1.7-rc.2`; it stops at
  `0.1.6-alpha.2`, and its `latest` is `0.0.1-rc.3`. The Lead removed the pin and
  ran `pnpm install --ignore-scripts` (`Packages: -4`).
- Measured now in this tree:
  `Select-String -Path packages/dsh-jev/package.json,pnpm-lock.yaml -Pattern 'dsh-settings-file'`
  → **0** matches; `-Pattern '0\.1\.6-alpha\.2'` → **0** in `package.json` and
  **0** in `pnpm-lock.yaml`.
- Absence from the installed 0.1.7-rc.2 tree: no package in the lockfile
  depends on it, which is what the 0-occurrence count proves.
- Residual, stated rather than hidden: `node_modules/.pnpm` still holds two
  orphaned directories named `@deepseek-ai+dsh-settings-f_*` whose nested
  `package.json` says `0.1.6-alpha.2`. They are unreferenced by the lockfile
  (pnpm does not always prune the store on install) and nothing resolves them;
  `pnpm install --frozen-lockfile --ignore-scripts` is clean with them present.

The test that used it is migrated, not weakened — §7.

---

## 7. `tests/settings-section.spec.ts` — the real end-to-end settings test

The old test could not survive at all: `ctx.settings.update()` in 0.1.7-rc.2 is
not a standalone service. `SettingsForms.inject = ['configEditor','profileContext']`
and `write()` delegates to `configEditor.edit()`, which recomposes the profile's
patch layers, validates the complete candidate and writes the profile patch YAML
to disk (`dsh-settings/lib/index.js:501-537`,
`dsh-config-editor/lib/index.js:63-129`). So the test boots the real stack:

```text
real Loader (@deepseek-ai/cordis-plugin-loader)
+ real profile: initProfile() + a profile patch document + mountRootInclude()
+ real profile patch writer (@deepseek-ai/dsh-config-editor)
+ real settings service (@deepseek-ai/dsh-settings)
+ this package's real JevRuntime
```

Only module *resolution* is substituted: the row's module is registered in the
Loader's own `builtins` map under the `cordis:` scheme
(`spec.ts:108`, the mechanism the product uses for `cordis:include`), so no build
output is required. Everything under test is real.

All six original cases were preserved, now against the real document:

| # | Case | What proves it now |
|---|---|---|
| 1 | entry resolves with the composed value | `ctx.settings.describe({redactSecrets:true})` yields `ns:'jev'`, `value.provider==='mock'`, `value.mode==='shadow'`; the secret is reported only as a slot (`secrets[].path === 'apiKey'`) and `JSON.stringify(value)` does not contain `apiKey` |
| 2 | a committed write reconfigures the running service | `update('jev',{mode:'enforce'})` → `ctx.jev.mode === 'enforce'`; `update('jev',{selection:{enabled:false}})` → `ctx.jev.settings.selection.enabled === false` **while `assessment.enabled` stays true** (composed config preserved) |
| 3 | invalid value rejected, last good config kept | `update('jev',{mode:'bogus'})` rejects (schema `resolveConfig`), `ctx.jev.mode` stays `'shadow'` |
| 4 | live needs a key, runtime stays consistent | `update('jev',{provider:'live'})` rejects `/apiKey/` (the `internal/config` gate) and `settings.provider` stays `'mock'`; with `apiKey:'test-key-not-real'` it is accepted and `ctx.jev.core.config.provider.kind === 'live'`; back to `'mock'` succeeds |
| 5 | runs with no settings provider | direct `ctx.plugin(JevPlugin, …)`: `ctx.jev.mode === 'shadow'`, `ctx.get('settings') === undefined` |
| 6 | in-flight assessments abort on a config change | mock `delayMs: 5000`, one in-flight `assess`, then `update('jev',{mode:'off'})` → `assessment.failure?.code === 'ABORTED'` and `activeRequests === 0` |

No case was deleted, skipped, or replaced by a fake; `mock.delayMs` surviving case
6's write is itself the evidence that ordinary (non-volatile) configuration is
preserved by a form write.

### The pre-fix defect, and which layer the error actually flags

The first fixture put the row in the leaf `cordis.yml`. Two symptoms followed:
`describe()` sometimes saw no row (a mount race, fixed by
`await ctx.loader.await()` at `spec.ts:124` plus an explicit harness check at
`spec.ts:125`), and the first write failed with

```text
Error: Configuration for "jev" is overridden by a home patch or command-line overlay
  at dsh-config-editor/lib/index.js:116
```

Corrected diagnosis (from the code, not the message): that check recomposes the
**patch layers the editor owns** —

```js
const patches = readProfilePatches('dsh', profile, {
  ...loadProfileDirectory('dsh', profile.dir, profile.installAnchor),
  patches: yaml.load(String(document), …)
})
if (!isDeepStrictEqual(
  flatten(composeEntries([patches])).find(row => row.id === entry.options.id)?.config ?? {},
  next,
)) throw new Error(`Configuration for "…" is overridden by a home patch or command-line overlay`)
```

— i.e. bundle layers + the profile patch + the home patch + the CLI overlays
(`dsh-app-boot/lib/index.js:1022-1032`). A row that exists **only** in the leaf
`cordis.yml` appears in none of those layers, so the lookup falls to `{}` and the
comparison fails. The message names the home/overlay layers generically; the home
layer was never the cause (the real home patch was empty **and** the fixture's
home layer is the temp dir).

Refuted hypothesis, worth recording because it constrains plugin authors:
**rows inserted by a patch layer ARE writable.** With the row declared in the
profile patch document as `insert: [{ id: jev, … }]` — exactly how
`cordis.patch.yml` installs the plugin in a real profile — the editor appends a
config-only override row beside the insert, the recomposition then yields `next`,
and the check passes (cases 1-4, 6 all execute real writes). What is *not*
writable through the settings form is a row that exists solely in the leaf
config passed to `mountRootInclude`/`boot`, because the editor's document cannot
derive it. The constraint is therefore fixture-shape, not a limitation of
bundle-installed plugins.

### Hermeticity: which paths, and the executed proof

Only two directories are ever resolved, both from the `ProfileContext` this test
provides and both inside the per-test temp root:

- `profileContext.dir` / `.patchPath` → the only writable target,
  `<tmp>/profile/cordis.patch.yml` (`dsh-config-editor/lib/index.js:25, 65-124`).
- `profileContext.home` → the home patch layer and the legacy-document path are
  read from `join(context.home, 'cordis.patch.yml')` and
  `join(profile.home, 'settings.yaml')`
  (`dsh-app-boot/lib/index.js:1027`, `dsh-settings/lib/index.js:347-351`).

DSH home resolution is nonetheless process-global (`@deepseek-ai/dsh-home-paths`:
configured ?? `$DSH_HOME` ?? `~/.dsh`), so the fixture pins the environment
(`vi.stubEnv('DSH_HOME', home)` at `spec.ts:96`, restored by
`vi.unstubAllEnvs()` in `afterEach`) instead of relying on the ambient value.
Proof — the same spec run three times with three different ambient homes:

```text
RUN A: DSH_HOME = <tmp>/jev-decoy-dsh-home-xyz (nonexistent)
       Test Files 1 passed (1) | Tests 6 passed (6)
RUN B: DSH_HOME unset (so ~/.dsh would be resolved)
       Test Files 1 passed (1) | Tests 6 passed (6)
RUN C: DSH_HOME = ambient launcher home
       Test Files 1 passed (1) | Tests 6 passed (6)

decoy created? False
real home's cordis.patch.yml hash unchanged? True
```

Same result in all three runs, the decoy directory was never created, and the
live harness home's patch file is byte-identical afterwards. No code path in this
test can reach outside its temp dirs: every path comes from `profileContext`, and
`readProfilePatches` composes only `context.dir`/`context.patchPath`/
`context.home`/`context.overlays` (`dsh-app-boot/lib/index.js:1022-1032`).

---

## 8. Deliberately left unchanged

- **`cordis.patch.yml`** — the new API still identifies a plugin by its Loader
  entry id, and `id: jev` is that id, so the bundle contract needed no change.
- **`tsdown.config.ts`, `tsconfig.client.json`** — the artifact contract
  (`window.__ModuleLoader__.load({ id, factory })`, `react` externals, CJS
  banner) is unchanged, and the emitted file still honors it (§5).
- **`package.json`'s `dsh` section** (bundle patch, `client.platform`,
  `client.inject`) — still accurate; `@deepseek-ai/dsh-api-remotes` was already
  named there.
- **`JevCard.tsx` UI code** apart from the write-value type — the card's markup,
  copy and control set are untouched; only `persist`'s parameter type narrowed to
  match the typed write face.
- **`settings-section.ts`'s guard order** — `next()` is called before the
  `this !== ctx.fiber` check and before validating, mirroring upstream
  `dsh-llm-pi-ai/lib/index.js:2552-2558`, so a later `internal/config` listener
  is never skipped (the AGENTS.md "always call `next()`" rule).
- **A pre-existing React warning** in `JevCard.tsx` (a style rerender sets
  `borderColor` where `border` is set) is untouched: it predates this migration
  and changing CSS is out of scope for an API migration.

## 9. Known residuals (stated, not hidden)

1. **A non-string `apiKey` is refused for a `live` + enabled write.** The gate
   only accepts a non-empty literal string. A value the form never receives — in
   practice an unevaluated `!!js` expression in the profile document — cannot be
   judged here, and the write is refused rather than assumed good, so the
   document and the runtime still cannot disagree. The 0.1.6 hook saw a resolved
   section and could judge it; this is a deliberate, safety-weighted deviation,
   documented at `src/settings-section.ts:52-56`.
2. **The browser half is not executed end to end.** No browser is available
   here, so the real `configForms` → real Host write path is proven by: the
   artifact load (§5, executed), the strict one-segment/path-op form double in
   `tests/client-card.spec.ts` (executed), and the real Host-side document tests
   (§7, executed). The browser→Host round trip itself has NOT been executed and
   is not claimed.
3. **`Schema.simplify` drops values equal to their schema default.** Harmless
   today because `resolveSettings` re-applies every default identically (diffed);
   it does make `resolveSettings` the authority for default-equal values, which
   is recorded in `plainConfig`'s doc comment for the next reader.

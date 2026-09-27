# Upstream delta: `0.1.6-alpha.2` → `0.1.7-rc.2`

Evidence inventory for moving `@buberlo/dsh-jev` from the DSH release it is verified
against (`@deepseek-ai/dsh-*@0.1.6-alpha.2`, `@deepseek-ai/cordis@4.0.2`,
`@deepseek-ai/schemastery@3.18.2`) to `@deepseek-ai/dsh-*@0.1.7-rc.2`,
`@deepseek-ai/cordis@4.0.4`, `@deepseek-ai/schemastery@3.18.4`.

This document is written for agents that will change code. Every classification is
derived from a **shipped artifact** (the published tarball's `lib/types/**/*.d.ts`,
`lib/**/*.js`, `package.json`, `cordis.patch.yml`, or shipped `README.md`).
Nothing here is inferred from a source checkout, from an example, or from memory.

---

## 1. Method and provenance

### 1.1 Where the evidence lives

| Item | Path |
|---|---|
| Scratch root | `%TEMP%\dsh-delta-0.1.7\` |
| Fetched tarballs | `%TEMP%\dsh-delta-0.1.7\tgz\` (`*.tgz`, sha256 recorded in `manifest\tarball-sha256.txt`) |
| Extracted 0.1.6-alpha.2 trees | `%TEMP%\dsh-delta-0.1.7\v16\<pkg>@0.1.6-alpha.2\package\` |
| Extracted 0.1.7-rc.2 trees | `%TEMP%\dsh-delta-0.1.7\v17\<pkg>@0.1.7-rc.2\package\` |
| `cordis` / `schemastery` trees | `%TEMP%\dsh-delta-0.1.7\deps\<pkg>@<ver>\package\` |
| Auxiliary packages (manifest, client-modules, config-editor, gateway) | `%TEMP%\dsh-delta-0.1.7\extra\<pkg>@<ver>\package\` |
| Per-package changed/added/removed file lists | `%TEMP%\dsh-delta-0.1.7\manifest\<pkg>.{changed,added,removed}.txt` + `summary.txt` |
| Per-package unified diffs (`lib/types/**/*.d.ts` + `package.json` + `README.md`) | `%TEMP%\dsh-delta-0.1.7\diffs\<pkg>.diff.txt` |
| `cordis` and `schemastery` full diffs | `diffs\cordis-4.0.2-4.0.4.diff.txt`, `diffs\schemastery-3.18.2-3.18.4.diff.txt` |
| Type-level probes (tsc 6.0.3) | `probe16\`, `probe17\`, `probe-config.ts`, `probe-volatile.ts`, `probe-volatile2.ts` |

### 1.2 Commands actually run

```powershell
# fetch: exact versions only, never a bare name
npm pack '@deepseek-ai/dsh-tools@0.1.6-alpha.2' --pack-destination $TEMP\dsh-delta-0.1.7\tgz
npm pack '@deepseek-ai/dsh-tools@0.1.7-rc.2'   --pack-destination $TEMP\dsh-delta-0.1.7\tgz
# ... 26 package names x 2 versions (see pack-log.txt) plus cordis/schemastery and 4 auxiliary packages

# extract
tar -xzf deepseek-ai-dsh-tools-0.1.7-rc.2.tgz -C v17\deepseek-ai-dsh-tools@0.1.7-rc.2

# diff (hash manifest over the whole tarball, then git diff per file)
manifest.ps1      # SHA-256 per file; emits <pkg>.{changed,added,removed}.txt
mkdiffs.ps1       # git diff --no-index -U4 for lib/types/**/*.d.ts, package.json, README.md
```

Environment: Windows, Node `v24.16.0`, npm `12.0.2`, git `2.49.0.windows.1`,
registry `https://registry.npmjs.org/`, run date **2026-09-27**.

No install was performed inside `D:\dsh-plugins\dsh-jev`; its `node_modules`,
`package.json`, `pnpm-lock.yaml`, `src/`, `tests/` were never read for evidence
and never modified.

### 1.3 Claim provenance

| Claim class | Source | Marker in this document |
|---|---|---|
| Declarations, signatures, exports, `package.json` ranges, patch rows | shipped `.d.ts` / `.json` / `.yml` | quoted with `file:line` |
| Runtime behaviour, pipeline order, capability restriction | shipped `lib/*.js` + shipped `README.md` | quoted with `file:line` or README heading |
| Schema/typing semantics (`.volatile()`, `z.object` inference) | `tsc 6.0.3 --noEmit --strict --exactOptionalPropertyTypes --skipLibCheck false` against the shipped `.d.ts` | §7.3, §7.4 "measured" |

`@deepseek-ai/dsh-settings-file` has **no `0.1.7-rc.2` release** (`npm view
@deepseek-ai/dsh-settings-file versions` ends at `0.1.6-alpha.2`; dist-tags are
`latest=0.0.1-rc.3, next=0.1.5-rc.3, alpha=0.1.6-alpha.2`). That is a registry
fact, not a delta in a shipped file, and it is the single most consequential
item in this report.

---

## 2. Version matrix

`✎` = at least one `lib/types/**/*.d.ts` file differs (whole-tarball SHA-256
comparison, `manifest\summary.txt`); `=` = declarations byte-identical.

| Package | 0.1.6-alpha.2 | 0.1.7-rc.2 | Declarations | Tarball |
|---|---|---|---|---|
| `@deepseek-ai/cordis` | 4.0.2 | 4.0.4 | ✎ | changed |
| `@deepseek-ai/schemastery` | 3.18.2 | 3.18.4 | ✎ | changed |
| `@deepseek-ai/dsh-tools` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-agent` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-agent-loop` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-agent-loop-testkit` | 0.1.6-alpha.2 | 0.1.7-rc.2 | = | changed |
| `@deepseek-ai/dsh-llm` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-scope` | 0.1.6-alpha.2 | 0.1.7-rc.2 | = | changed |
| `@deepseek-ai/dsh-session` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-session-projection` | 0.1.6-alpha.2 | 0.1.7-rc.2 | = | changed |
| `@deepseek-ai/dsh-skill` | 0.1.6-alpha.2 | 0.1.7-rc.2 | = | changed |
| `@deepseek-ai/dsh-skill-filesystem` | 0.1.6-alpha.2 | 0.1.7-rc.2 | = | changed |
| `@deepseek-ai/dsh-system-prompt` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-user-approval` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-settings` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-settings-file` | 0.1.6-alpha.2 | **absent** | n/a | **not published** |
| `@deepseek-ai/dsh-client-ui-settings` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-client-ui-plugin-manager` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-client-ui-slots` | 0.1.6-alpha.2 | 0.1.7-rc.2 | = | changed |
| `@deepseek-ai/dsh-client-locale` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |
| `@deepseek-ai/dsh-client-ui-renderer` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ (JSDoc only) | changed |
| `@deepseek-ai/dsh-client-test-runtime` | 0.1.6-alpha.2 | 0.1.7-rc.2 | ✎ | changed |

Not in `packages/dsh-jev/package.json` but inspected as supporting evidence:
`@deepseek-ai/dsh-base`, `@deepseek-ai/dsh-api-remotes`, `@deepseek-ai/dsh` (CLI),
`@deepseek-ai/dsh-package-manifest`, `@deepseek-ai/dsh-client-modules`,
`@deepseek-ai/dsh-config-editor`, `@deepseek-ai/dsh-api-gateway`.

Peer-range convention change (every DSH package, same shape):

```diff
-  "@deepseek-ai/cordis": "^4.0.2",
-  "@deepseek-ai/dsh-llm": "^0.1.6-alpha.2",
+  "@deepseek-ai/cordis": "~4.0.4",
+  "@deepseek-ai/dsh-llm": "0.1.7-rc.2",
```

Every cross-package DSH peer is now pinned **exactly** (no caret), which is why
every DSH package in this repository must move in lockstep: a mixed 0.1.6/0.1.7
tree cannot satisfy the new peers.

---

## 3. Per-extension-point diff and classification

Legend: **identical** (byte-identical declaration), **compatible** (declaration
changed, existing call sites still compile and behave), **breaking** (existing
call site no longer compiles or behaves differently).

### 3.1 Cordis plugin shape

| Item | Verdict | Evidence (0.1.7-rc.2) |
|---|---|---|
| `export default class ... extends Service` | **identical** | `@deepseek-ai/cordis@4.0.4/lib/types/service.d.ts` and `src/service.ts` are byte-identical to 4.0.2 |
| `static inject` | **identical** | `lib/types/registry.d.ts` unchanged |
| `static Config` (schemastery `z<T>` annotation) | **compatible** | schema API widened; measured in §7.4 — the existing `export const Config: z<Config> = z.object({...})` still compiles under 3.18.4 |
| Cordis service proxy and `private #field` hazard | **identical** | `src/service.ts`, `src/context.ts` byte-identical (only `src/fiber.ts`, `src/events.ts`, `src/index.ts`, `src/logger.ts` changed) |
| `ctx.effect(...)` | **identical** | `lib/types/context.d.ts` byte-identical |

### 3.2 Tool pipeline

| Extension point | Verdict | 0.1.7-rc.2 declaration |
|---|---|---|
| `tools/pre-execute` waterfall | **identical** | `dsh-tools/lib/types/index.d.ts:47` — `'tools/pre-execute'(this: Scoped<ToolRuntime>, exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision>` (0.1.6: `index.d.ts:39`, same text) |
| `PreToolDecision` `allow`/`deny`/`cancel` | **identical** | `index.d.ts:445-453` |
| `PreToolDecision` `ask{reason?}` | **compatible** (additive optional field) | `index.d.ts:454-460`; new `displayReason?: { readonly en: string; readonly [locale: string]: string }` |
| `tools/result` observe-only emit | **identical** | `index.d.ts:92` (0.1.6: `:84`, same text) |
| `ctx.tools.restrict(filter)` | **identical** | `index.d.ts:644` |
| `ctx.tools.guard(guard)` | **identical** | `index.d.ts:655` |
| `ctx.tools.get(name, scope?)` | **identical** | `index.d.ts:690` |
| `ctx.tools.schemas(scope?)` | **identical** | `index.d.ts:711` |
| `ToolDefinition.projectContent?` | **compatible** (additive) | `index.d.ts:138` |
| `DefineToolOptions.deferLoading?: true` | **compatible** (additive) | `lib/types/schema.d.ts:195` |
| Pipeline order `pre-execute → guards → execute → post-execute → finalizeContent → result` | **identical** | `dsh-tools/README.md:105` unchanged; `README.md:87` documents `projectContent` running *before* post-execute |

### 3.3 Agent scope and lifecycle

All of `dsh-agent/lib/types/runtime-types.d.ts` is **byte-identical**
(`dsh-agent` changed only `index.d.ts`, `model-selection.d.ts`, `types.d.ts`,
`consumed-work.js`, `lib/index.js`, `package.json`, READMEs — plus a new
`archive-admission.d.ts`).

| Extension point | Verdict | 0.1.7-rc.2 line |
|---|---|---|
| `agent.ctx` | **identical** | `runtime-types.d.ts:149` — `readonly ctx: Context;` |
| `agent.inject(UserMessage)` | **identical** | `runtime-types.d.ts:209` |
| `agent/disposed` | **identical** | `runtime-types.d.ts:240` |
| `agent/pre-step` | **identical** | `runtime-types.d.ts:304` |
| `agent/request` (→ `LlmCallConfig`) | **identical** | `runtime-types.d.ts:327` |
| `agent.session.deriveMessages()` | **identical** | `dsh-session/lib/types/index.d.ts:303` — `deriveMessages(): Message[]` |

Caveat on `agent.inject`: the *type* is unchanged, but the `UserMessage` source
vocabulary it consumes changed — see §3.5 and B-3.

### 3.4 Settings (host)

| Extension point | Verdict | Evidence |
|---|---|---|
| `ctx.settings.installSection(owner, ns, schema, entry, hooks)` | **BREAKING — removed** | present at 0.1.6 `dsh-settings/lib/types/index.d.ts:228`; absent from the whole 0.1.7-rc.2 package (`grep installSection lib/types` → 0 hits) |
| `ctx.settings` type | **BREAKING** | 0.1.6 `index.d.ts:113` `settings: SettingsProvider` → 0.1.7-rc.2 `index.d.ts:27` `settings: SettingsForms` |
| `SettingsProvider` / `SettingsScope` / `SettingsRegisterOptions` / `SettingsSectionHooks` / `SettingsUpdateSource` | **BREAKING — removed** | 0.1.6 `index.d.ts:157` (`SettingsProvider`), `:84` (`SettingsScope`), `:23` (`SettingsRegisterOptions`), `:315` (`SettingsSectionHooks`), `types.d.ts:15` (`SettingsUpdateSource`); none exist in 0.1.7-rc.2 |
| `ctx.settings.describe(options?)` | **compatible (shape changed)** | 0.1.7-rc.2 `index.d.ts:96`; `SettingsDescriptor` gained required `autoGenerate: boolean`, `applies` narrowed to `'live'` |
| `ctx.settings.update(ns, patch, expectedRevision?)` | **breaking (signature + semantics)** | 0.1.6 `:256` `ns: Namespace & SettingsNamespaceInput<Namespace>` → 0.1.7-rc.2 `:102` `ns: string` = **profile entry id**, not a settings namespace |
| `ctx.settings.replace(ns, section, rev?)` | **breaking (same)** | 0.1.6 `:268` → 0.1.7-rc.2 `:108` |
| `ctx.settings.mutate(ns, ops, rev?)` | **breaking (same)** | 0.1.6 `:282` → 0.1.7-rc.2 `:114` |
| `settings/updated` event | **BREAKING — removed** | 0.1.6 `types.d.ts:89`; only `settings/document-updated(ns, revision)` survives at 0.1.7-rc.2 `types.d.ts:73` |
| `describe({ redactSecrets: true })` | **compatible** | `SettingsDescribeOptions` still `{ redactSecrets?: boolean }`, `index.d.ts:21-23` |
| `SettingsForms.configure({ auto? }, owner?)` | **new** | `index.d.ts:80-84` |
| `ctx.settings.writable` / `documentPath` / `prepareDocument()` | **new** | `index.d.ts:85`, `:87`, `:91` |
| `@deepseek-ai/dsh-settings/invariant` subpath | **BREAKING — removed** | `package.json` `exports` lost `"./invariant"` |

### 3.5 Messages and user-facing injected context

| Extension point | Verdict | Evidence |
|---|---|---|
| `createUserMessage(input)` | **identical signature** | 0.1.6 `dsh-llm/lib/types/message.d.ts:180` → 0.1.7-rc.2 `:213`; parameter type `NewUserMessage` unchanged in shape |
| `MessageSourceMap` keys | **BREAKING — `plugin` removed** | 0.1.6 `:94-100` had `plugin: { kind: 'plugin'; plugin: string } & ContextFormed` at `:98`; 0.1.7-rc.2 `:101-108` has only `user`, `model`, `tool`, `system-prompt`, with the note *"each producer declares its own `kind` in its own module; there is no shared catch-all `plugin` kind"* |
| `Message` | **breaking (type structure)** | 0.1.6 `:120` was one interface with `role: 'system' \| 'user' \| 'assistant'`; 0.1.7-rc.2 `:174` is `MessageRoleMap[keyof MessageRoleMap]`, adding `DeveloperMessage` (`role: 'developer'`) and moving `ToolResultMessage` to `role: 'tool'` |
| `SystemMessage.source` | **breaking** | 0.1.6 `:144` `MessageSourceMap['plugin']` → 0.1.7-rc.2 `:135` `MessageSourceMap['system-prompt']` |
| `ContextFormed` vocabulary | **identical** | `form` union unchanged (`instructions\|catalog\|snapshot\|notice\|relay\|recall`), `notice` still requires `summary` |
| `createSystemMessage(text, plugin)` | **breaking (arity)** | 0.1.7-rc.2 `message.d.ts:232` — `createSystemMessage(text: string): SystemMessage` |
| `BlockAssembler.message(source?)` | **breaking (arity)** | 0.1.7-rc.2 `lib/types/assembler.d.ts:73` — `message(source: Omit<ModelMessageSource,'kind'>): AssistantMessage` |
| `GenerateOptions.messages` | **changed (widened)** | 0.1.7-rc.2 `lib/types/types.d.ts:501` — `messages: RequestMessage[]`, where `RequestMessage = Message \| RequestUserInput` |
| `ToolResultBlock` → `ToolResultMessage` | **breaking** | `ContentBlockMap['tool-result']` deleted; `ToolAdditionBlock` declared at `types.d.ts:94` and registered as `'tool-addition'` at `:120` |
| `dsh-llm/brand` subpath (`ToolCallId`, `MessageId`, …) | **identical** | still exported, `package.json` `exports["./brand"]` |

### 3.6 Skills

| Extension point | Verdict | Evidence |
|---|---|---|
| `ctx.skills.list(options?)` | **identical** | `dsh-skill/lib/types/index.d.ts:266`; `dsh-skill` `.d.ts` files are byte-identical (only `package.json` + README changed) |
| `isModelInvocable(skill)` | **identical** | `dsh-skill/lib/types/index.d.ts:107` |
| `SkillSummary` shape | **identical** | whole-package declaration hash equal |
| `dsh-skill-filesystem` discovery/parse contract | **identical** | declarations byte-identical; only `package.json` + `README.i18n.yaml` changed |

### 3.7 Approval

| Extension point | Verdict | Evidence |
|---|---|---|
| `approval/request` waterfall | **identical** | `dsh-user-approval/lib/types/types.d.ts:81` |
| `ApprovalOutcome` incl. `allowed-once` | **identical** | `types.d.ts:26` |
| `ApprovalRequestEvent` | **compatible** (additive `displayReason?`) | `types.d.ts:65` |
| `ctx.approval` service | **identical** | `lib/types/index.d.ts` changed only by a `MessageSourceMap` augmentation for `kind: 'user-approval'` |

### 3.8 Web client

| Extension point | Verdict | Evidence |
|---|---|---|
| `ctx.settingsScope.bind({ namespace })` | **BREAKING — removed** | 0.1.6 `dsh-client-ui-settings/lib/types/client/index.d.ts:16-17` exported `SettingsScope{,Controller,Binder,Snapshot,Spec}`; those files (`settings-scope.d.ts`, `settings-contract.d.ts`) are **deleted** in 0.1.7-rc.2 |
| `ctx.configForms` | **new replacement** | 0.1.7-rc.2 `client/config-form.d.ts:96` — `configForms: ConfigForms`; `:106` `class ConfigForms extends Service`; `:142` `get<T>(entryId: string): ConfigForm<T>`; `:137` `describe()`; `:156` `whileServed(namespaces, register)` |
| `ConfigForm<T>` surface | **new** | `client/config-form-types.d.ts:36-74` — `getSnapshot()`, `subscribe()`, `mutate(ops, expectedRevision?)`, `set(field, value)`, `unset(field)`; snapshot has `status/value/base/user/revision/writable/mode` |
| `ctx.locale.register(ns, locale, dict)` | **identical** | `dsh-client-locale` client `index.d.ts` changed only in the `LocaleRuntime` constructor and by adding `resolveText()` + `apply(): Promise<void>` |
| `SlotRegistry.register({ name, key, locale, inject }, Component)` | **identical** | `dsh-client-ui-renderer` declared change is one JSDoc sentence on `bindStoreScope`; `SlotMap`/`SlotRegistry` shape unchanged |
| Slot `plugins.bundle.config` | **compatible** | `dsh-client-ui-plugin-manager/lib/types/client/slot-contract.d.ts:100` unchanged; only `PluginConfigViewProps` gained `readonly form?: ConfigPageForm \| undefined` (`:24`) |
| Slot `plugins.item` | **compatible** (JSDoc + occupied-by note changed) | `slot-contract.d.ts:90` |
| Slot `plugins.row.config` | **compatible** | `slot-contract.d.ts:112` |
| New slots `plugins.bundle.activation`, `plugins.detail.actions`, `plugins.detail.badge`, `plugins.detail.section` | **additive** | `slot-contract.d.ts` (new declarations) |
| Client artifact contract `window.__ModuleLoader__.load({ id, factory })` | **identical** | `dsh-client-modules/lib/client.js:1` and `lib/index.js:456`; loader interface unchanged |
| `PLATFORM_MODULES` baseline (React, Cordis, static UI libraries) | **identical** | `dsh-client-modules/README.md:46` byte-identical between versions |
| `dsh.client` manifest keys (`platform`, `inject`, `immediately`, `external`) | **identical** | `dsh-package-manifest/lib/types/types.d.ts:76-89` unchanged |
| `dsh.bundle.patch` | **compatible** (widened) | `dsh-package-manifest/lib/types/types.d.ts:66-69` — `patch: string \| string[]` |
| `dsh-client-ui-plugin-manager` `/client` `apply()` | **breaking for that package only** | `lib/types/client/index.d.ts:12-24` now declares `ctx.pluginNavigation`; not used by this plugin |

### 3.9 Testkits

| Extension point | Verdict | Evidence |
|---|---|---|
| `mountAgentLoopTestDependencies`, `mountAgentLoopTestHarness`, `AgentLoopTestHarness` | **identical** | `dsh-agent-loop-testkit` declarations byte-identical (package.json + README only) |
| `dsh-client-test-runtime` `SlotTestRuntime` / `createClientTest` / `webApp` | **ambiguous — see 8(a)** | `.d.ts` changed; `stubSettingsScope` → `stubConfigForm`; runtime still imports unpublished renderer `src/` paths |
| `@deepseek-ai/dsh-client-test-runtime` installability from npm | **still unusable at runtime** | §8(a) |

---

## 4. Breaking changes that affect this plugin

Each entry: symbol, old, new, `file:line`, symptom, minimal fix.

### B-1 `ctx.settings.installSection` deleted — host settings section cannot be registered

* **Old** — `dsh-settings@0.1.6-alpha.2/lib/types/index.d.ts:228`
  ```ts
  installSection<const Namespace extends string, T>(owner: Context, ns: Namespace & SettingsNamespaceInput<Namespace>, schema: z<T>, entry: T, hooks: SettingsSectionHooks<T>): void;
  ```
* **New** — no such member. `dsh-settings@0.1.7-rc.2/lib/types/index.d.ts:62-118` exposes only `configure`, `writable`, `documentPath`, `prepareDocument`, `describe`, `update`, `replace`, `mutate`.
* Used at `packages/dsh-jev/src/settings-section.ts:32`; the whole `installSettingsSection()` function is now unusable.
* **Symptom** — compile error `Property 'installSection' does not exist on type 'SettingsForms'`; at runtime the namespace is never registered, so the `jev` settings page would render `unavailable`.
* **Fix (mechanism, verified)** — 0.1.7-rc.2 derives forms from each profile entry's Config schema instead of a registered namespace. Mark the editable fields volatile in `Config` and let `SettingsForms` project them; the write path becomes a profile-patch write through `@deepseek-ai/dsh-config-editor`. `dsh-settings/lib/types/schema.d.ts:11` is the projection entry point (`volatileForm(schema)`), and `SettingsForms.get/update/replace/mutate` are keyed by **profile entry id** (`index.d.ts:102-114`) — for this bundle that is the `jev` row id in `packages/dsh-jev/cordis.patch.yml:4`.
  If the plugin keeps shipping its own page instead of the auto-generated one, call `ctx.settings.configure({ auto: false }, owner)` (declared `index.d.ts:80`; the same advice is in `dsh-settings/README.md`, "Use this package").

### B-2 `SettingsSectionHooks` / `SettingsScope` / `settings/updated` deleted

* **Old** — `dsh-settings@0.1.6-alpha.2/lib/types/index.d.ts:315` (`SettingsSectionHooks` with `setSource`/`onChange`/`validate`), `:84` (`SettingsScope`), `types.d.ts:89` (`settings/updated`).
* **New** — absent. `setSource`/`onChange` have no counterpart: the value is read from the live Loader entry, and reconfiguration arrives through the volatile reference plus `loader/volatile-update` (`cordis@4.0.4/README.md`, "Volatile configuration").
* Used at `src/settings-section.ts:32-49` (`setSource`, `onChange`, `validate`).
* **Symptom** — compile errors for all three hook members; `validate`'s cross-field guard (`live` without `apiKey`) loses its enforcement point.
* **Fix** — move the cross-field rule out of the deleted `validate` hook. It has no equivalent on `SettingsForms`; the nearest equivalent is the plugin's own constructor (`src/service.ts:246` already throws for `live` without a key) and the schema-level `.required()`/union constraints. Do not claim the write is refused unless a test proves which layer refuses it.

### B-3 `MessageSourceMap['plugin']` deleted — `agent.inject()` payload no longer compiles

* **Old** — `dsh-llm@0.1.6-alpha.2/lib/types/message.d.ts:98`
  ```ts
  plugin: { kind: 'plugin'; plugin: string; } & ContextFormed;
  ```
* **New** — `dsh-llm@0.1.7-rc.2/lib/types/message.d.ts:101-108`
  ```ts
  export interface MessageSourceMap {
      user: { kind: 'user'; };
      model: ModelMessageSource;
      tool: ToolMessageSource;
      'system-prompt': SystemPromptMessageSource;
  }
  ```
  with the doc comment: *"Merge-extensible sum type — each producer declares its own `kind` in its own module; there is no shared catch-all `plugin` kind."* (`:96`)
* Used at `src/adapters/pre-step.ts:236`:
  ```ts
  source: { kind: 'plugin', plugin: 'dsh-jev', form: 'notice', summary: `skill: ${result.skill}` },
  ```
* **Symptom** — `Type '{ kind: "plugin"; ... }' is not assignable to type 'MessageSource'`. If it were forced through, the session surface would carry an unregistered source kind.
* **Fix — declare the plugin's own `kind` by module augmentation.** This is the *prescribed* replacement the declaration itself points at, not a workaround:
  ```ts
  import type { ContextFormed } from '@deepseek-ai/dsh-llm'

  declare module '@deepseek-ai/dsh-llm' {
    interface MessageSourceMap {
      'dsh-jev': { kind: 'dsh-jev' } & ContextFormed
    }
  }
  // then, at src/adapters/pre-step.ts:
  source: {
    kind: 'dsh-jev',
    form: 'notice',
    summary: boundContextSummary(`skill: ${result.skill}`),
  }
  ```
  `ContextFormed`'s `notice` variant still requires `summary` (`message.d.ts:85-88`) and `boundContextSummary()` is the shipped bound (`:120`, `CONTEXT_SUMMARY_MAX_CHARS = 120` at `:114`).
* **Wrong reading to avoid** — do *not* fix B-3 by picking a different existing member (`'tool'`, `'system-prompt'`, `'model'`, `'user'`) or by dropping `source`. The union is deliberately closed per producer precisely so that a plugin declares its own kind; reusing another producer's tag mis-attributes the injected context and drops the `form: 'notice'` presentation. The comment at `message.d.ts:94-108` and the phrase *"each producer declares its own `kind` in its own module"* are the instruction.
* **Precedent** — verified by the Lead against nine upstream 0.1.7-rc.2 packages, all of which augment `MessageSourceMap` with their own member: `dsh-agent`, `dsh-agent-loop`, `dsh-api-session-controller`, `dsh-compaction`, `dsh-llm`, `dsh-skill`, `dsh-subagent`, `dsh-tools`, `dsh-user-approval`. Five are quotable from the tarballs: `dsh-tools/lib/types/index.d.ts:16-23` (`'tool-registry'`), `dsh-tools/lib/types/ptc.d.ts:9-16` (`'ptc-mode'`), `dsh-agent/lib/types/model-selection.d.ts:8-13` (`'model-selection'`), `dsh-user-approval/lib/types/index.d.ts:11-16` (`'user-approval'`), `dsh-agent-loop/lib/types/runtime-context.d.ts:10-17` (`'runtime-context'`).
* **Status in this repo** — `host-adapt` implemented exactly this shape: the plugin declares its own `'dsh-jev'` member typed `{ kind: 'dsh-jev' } & ContextFormed` and bounds the notice summary with the real `boundContextSummary()`.

### B-4 `ctx.settingsScope` deleted — the client card's data path is gone

* **Old** — `dsh-client-ui-settings@0.1.6-alpha.2/lib/types/client/index.d.ts:16-17`
  ```ts
  export type { SettingsScopeController, SettingsScopeBinder } from './settings-scope.ts';
  export type { SettingsScope, SettingsScopeSnapshot, SettingsScopeSpec } from './settings-contract.ts';
  ```
* **New** — both source files are absent from the 0.1.7-rc.2 tarball; `client/index.d.ts:4-5` exports `ConfigForms`, `ConfigForm`, `ConfigFormSnapshot` instead, and `client/config-form.d.ts:96` merges `configForms` into `Context`.
* Used in the **pre-adaptation** source at `src/client/index.tsx:37` (`inject = ['slots','locale','remote','settingsScope']`) and `:50` (`ctx.settingsScope.bind<JevSettings>({ namespace: 'jev' })`), plus `src/client/jev-card-controller.ts:10,63,66` (`SettingsScope<JevSettings>`). Those line numbers describe the tree as it stood when this delta was measured; the file has since been adapted — see the current form in §11 (`:41`, `:57`).
* **Symptom** — `Property 'settingsScope' does not exist`; the Loader entry's inject list cannot resolve `settingsScope`, so `apply()` never runs and the card never appears.
* **Fix** — replace with `ctx.configForms.get<JevSettings>(entryId)` (`client/config-form.d.ts:142`) and `ConfigPageForm` (`slot-contract.d.ts:150-156`) for the page props; the slot registration itself (`ctx.slots.inject(...)`, `ctx.slots.register({name:'plugins.bundle.config', key:'@buberlo/dsh-jev', ...})`) is unchanged. Note the key change: `get()` is documented as taking the **Host plugin entry id** (`config-form.d.ts:138-142`), and `dsh-settings/README.md` says forms *"identify each plugin by its profile entry id"*. Whether the id is the row id (`jev`) or the settings namespace (`jev`) cannot be resolved from the shipped declarations alone — see §10.

### B-5 `BlockAssembler.message(source?)` now requires a source

* **Old** — `dsh-llm@0.1.6-alpha.2/lib/types/assembler.d.ts:73` `message(source?: MessageSource): Message;`
* **New** — `dsh-llm@0.1.7-rc.2/lib/types/assembler.d.ts:73` `message(source: Omit<ModelMessageSource, 'kind'>): AssistantMessage;`
* Not called by this plugin's `src/` (grep: 0 hits). Only relevant if the scripted test adapter in `packages/dsh-jev/tests/helpers/scripted-adapter.ts` assembles messages.
* **Symptom** — `Expected 1 arguments, but got 0`.

### B-6 `createSystemMessage(text, plugin)` lost its second parameter

* **Old** — `dsh-llm@0.1.6-alpha.2/lib/types/message.d.ts:200` `createSystemMessage(text: string, plugin: string): SystemMessage;`
* **New** — `dsh-llm@0.1.7-rc.2/lib/types/message.d.ts:232` `createSystemMessage(text: string): SystemMessage;`
* Not used by this plugin's `src/`.

### B-7 `dsh-settings-file` has no `0.1.7-rc.2` release and is no longer mounted

* `packages/dsh-jev/package.json:92` pins `"@deepseek-ai/dsh-settings-file": "0.1.6-alpha.2"` as a devDependency; used by `packages/dsh-jev/tests/settings-section.spec.ts:13`. It cannot be bumped — the package stops at `0.1.6-alpha.2`.
* The base bundle dropped the row: `dsh-base@0.1.6-alpha.2/cordis.patch.yml:97-98` was
  ```yaml
  - id: settings
    name: '@deepseek-ai/dsh-settings-file'
  ```
  and `dsh-base@0.1.7-rc.2/cordis.patch.yml:97-102` is
  ```yaml
  - id: config-editor
    name: '@deepseek-ai/dsh-config-editor'
    disabled: !!js "!ctx.get('profileContext')"

  - id: settings
    name: '@deepseek-ai/dsh-settings'
    disabled: !!js "!ctx.get('profileContext')"
  ```
* **Symptom** — `pnpm install` cannot resolve the pinned version; the test file's import fails at build time.
* **Fix** — remove the pin; mount `@deepseek-ai/dsh-settings@0.1.7-rc.2` (+ `@deepseek-ai/dsh-config-editor@0.1.7-rc.2` if the test writes configuration) in the test and drop or rewrite `settings-section.spec.ts`. `@deepseek-ai/dsh-settings@0.1.7-rc.2` is published (tarball sha256 prefix `934205e502d20c2a`).

### B-8 `client-ui-settings` now has a runtime `dependencies` entry on schemastery `~3.18.4`

* `dsh-client-ui-settings@0.1.7-rc.2/package.json` gained:
  ```json
  "dependencies": { "@deepseek-ai/schemastery": "~3.18.4" }
  ```
  (it had no `dependencies` block at 0.1.6-alpha.2).
* This plugin pins `@deepseek-ai/schemastery` **3.18.2** in both `dependencies` (`packages/dsh-jev/package.json:54`) and `devDependencies` (`:77`). `3.18.2` does not satisfy `~3.18.4`.
* **Symptom** — a duplicate schemastery instance in the tree, and `settings-section.spec.ts`/`client-card.spec.ts` may exercise a schema built by the 3.18.2 copy while the settings service projects with 3.18.4. Worse, `.volatile()` only exists in 3.18.4 (§7.4), so B-1 cannot be implemented while the pin stays at 3.18.2.
* **Fix** — bump the `schemastery` pin to `3.18.4` in both blocks.

### B-9 `dsh-base` also renamed the DeepSeek LLM row and changed a config key

Not consumed by this plugin, but it affects any profile boot the packaging test drives:
`cordis.patch.yml` `- id: llm-deepseek` / `name: '@deepseek-ai/dsh-llm-deepseek'` → `name: '@deepseek-ai/dsh-llm-deepseek-api-key'` plus a new `llm-deepseek-account` row; `spill-policy.config.maxInlineBytes: 50000` → `maxInlineTokens: 12500`; new rows `authorization` and `deepseek-account`. See §6.4.

### 4.10 Breaking changes that do **not** touch this plugin

Listed so downstream agents do not chase them: `Session.toolHistory()` /
`fork()` semantics and `SESSION_FORMAT_VERSION` 3→4 (`dsh-session`),
`DeveloperMessage` + `tool-addition`/`tool-removal` blocks and `ToolUpdate`
(`dsh-llm`/`dsh-session`), `Fiber.update()` return type (`cordis`),
`client-ui-plugin-manager` install-dialog state machine, `client-locale`
`apply(): Promise<void>`, `dsh-client-test-runtime` `TestSessions` method renames
(`setSubagentCatalogOpen`/`refreshSubagents` → `refreshProjections`).

---

## 5. Non-breaking but relevant changes

| Change | Where | Effect on this plugin |
|---|---|---|
| `PreToolDecision.ask.displayReason?` added | `dsh-tools/lib/types/index.d.ts:456` | optional; the adapter's `{ kind: 'ask', reason }` at `src/adapters/assessment.ts:133` still type-checks. `displayReason` is *localized prompt text*; `reason` remains the audited reason (`index.d.ts:437-443`) |
| `ToolDefinition.projectContent?` added | `dsh-tools/lib/types/index.d.ts:138` | runs before `tools/post-execute` (`README.md:87`); no `tools/result` shape change |
| `deferLoading?: true` on `ToolSchema`/`DefineToolOptions` | `dsh-llm/lib/types/types.d.ts:461`, `dsh-tools/lib/types/schema.d.ts:195` | inert unless declared |
| `ApprovalRequestEvent.displayReason?` added | `dsh-user-approval/lib/types/types.d.ts:65` | optional |
| `settings/document-updated(ns, revision)` retained | `dsh-settings/lib/types/types.d.ts:73` | the only settings event left |
| `SettingsForms.configure({ auto })` added | `dsh-settings/lib/types/index.d.ts:80` | the supported way to suppress the auto-generated page |
| `ConfigForms.developerTools` | `dsh-client-ui-settings/lib/types/client/config-form.d.ts:109` | unrelated preference service |
| `ConfigForms.whileServed(namespaces, register)` | `client/config-form.d.ts:156` | for pages that edit another plugin's namespace |
| Slots `plugins.bundle.activation`, `plugins.detail.{actions,badge,section}` | `client-ui-plugin-manager/lib/types/client/slot-contract.d.ts` | additive |
| `DshPackageManifest.icon?` | `dsh-package-manifest/lib/types/types.d.ts:15` | additive |
| `DshBundleManifest.patch: string \| string[]` | `dsh-package-manifest/lib/types/types.d.ts:68` | our `dsh.bundle.patch` is a single string — still valid |
| `Session.toolHistory(): ToolHistory` added | `dsh-session/lib/types/index.d.ts:278` | new; `deriveMessages()` unchanged |
| `TurnEndReasonMap.forked` added | `dsh-session/lib/types/types.d.ts:205-207` | additive |
| `ACCOUNT_QUOTA_EXCEEDED_CODE` added | `dsh-llm/lib/types/error.d.ts:22` | additive |
| `listModels` advisory wording tightened | `dsh-llm/lib/types/index.d.ts:344-350` | **relevant to `src/adapters/model-routing.ts`**: *"Core routing accepts unlisted model ids; catalog-driven entry points such as the GUI may require membership."* The adapter's conservative "absent from catalog → keep the existing model" behaviour remains legal and is still the safe default |
| CLIs gained `--dump-config-schema` | `dsh/lib/types/args.d.ts:39-45`, `lib/types/dump-config.d.ts` | new verification lever for the profile-mount path |
| `LOCALE_SETTINGS_NAMESPACE` host registration replaced by a volatile `Config` | `dsh-client-locale/lib/types/index.d.ts:5-18` | pattern reference only |

---

## 6. Behavioural and configuration changes

### 6.1 Settings configuration model

0.1.6-alpha.2: a settings *provider* (`dsh-settings-file`) stored one YAML
document; plugins registered a namespace with a schema and received a `base`
layer plus hooks. 0.1.7-rc.2: `ctx.settings` **is** the service, forms are
projected from each active Loader entry's Config, and writes go through the
active profile's Cordis patch (`dsh-config-editor/README.md`, "Use this
package": *"Save plugin configuration in the active profile's patch and apply it
immediately."*). `dsh-settings/README.md` adds: *"Edit fields that plugins
declare with `.volatile()` and inspect their effective values. Forms identify
each plugin by its profile entry id, preserve secret values, and refuse stale
writes."* A legacy `$DSH_HOME/settings.yaml` is imported once into the profile
patch (`dsh-settings/lib/types/index.d.ts:71-73`, `private importLegacyDocument`).

### 6.2 Profile / bundle install path

Unchanged: `dsh.bundle.patch` in `package.json` plus a `cordis.patch.yml` row
(now also allowed to be a list). Our row (`packages/dsh-jev/cordis.patch.yml:3-5`)
is still valid:
```yaml
- insert:
    - id: jev
      name: '@buberlo/dsh-jev'
```

### 6.3 Client artifact contract

Unchanged: `window.__ModuleLoader__.load({ id, factory })` is still the registration
call (`dsh-client-modules/lib/index.js:456`), `<id>/client` still resolves to the
same exports as the bare id (`README.md:38`), and the frozen baseline is still
React + Cordis + static UI libraries (`README.md:46`). What changed is loader
*robustness*: a batch `<script>` that fails to load is retried once, a batch that
loads without registering a row falls back to that row's one-resource URL, and
the module system records the last import/failure per row
(`lib/client.js` `arrive`/`recordingImportError`; `lib/types/client/manifest.d.ts`
gains `importError(id)`). Revisions are now derived from `mtimeMs`/`ctimeMs`/`size`
rather than content hashing (`lib/index.js` `artifactRevision`; `README.md`,
"Live plugin composition"), and the combo/chunk URLs the browser receives are
document-relative (`lib/types/client/manifest.d.ts:52-72`). `tsdown.config.ts`
emits the same banner/footer contract and needs no change for this reason.

### 6.4 Base bundle composition

`dsh-base@0.1.7-rc.2/cordis.patch.yml` vs 0.1.6-alpha.2: settings row replaced
(see B-7), `config-editor` added, `authorization` + `deepseek-account` added,
`llm-deepseek` → `llm-deepseek-api-key` + `llm-deepseek-account`,
`spill-policy.config.maxInlineBytes: 50000` → `maxInlineTokens: 12500`.
`dsh-base` `dependencies` now include `@deepseek-ai/dsh-settings` and
`@deepseek-ai/dsh-config-editor`.

### 6.5 Remote capability set

Unchanged sentence, still present in 0.1.7-rc.2 —
`dsh-api-remotes@0.1.7-rc.2/README.md:73`: *"The capability set is fixed by
explicit build-time value imports; the Client does not discover the Host's active
Services or Remote definitions at runtime."* New forwarded events were added
(`deepseek-account/session-expired`, `deepseek-account/model-sign-in-required`,
`credentials/record-updated`, `schedule/changed`) and the namespace list grew,
but an out-of-tree plugin still cannot add a `ctx.remote.<ns>` method.

---

## 7. `cordis` 4.0.2 → 4.0.4 and `schemastery` 3.18.2 → 3.18.4

### 7.1 Cordis: service proxy behaviour

**No change.** `src/service.ts`, `src/context.ts`, `src/registry.ts`,
`src/reflect.ts`, `src/utils.ts` and their `.d.ts` files are **byte-identical**.
The AGENTS.md rule "services use TypeScript `private` fields, not `#`" still
holds and its cause is unchanged.

Files that did change: `src/fiber.ts`, `src/events.ts`, `src/index.ts`,
`src/logger.ts`, `lib/index.js`, `README.md`, `package.json`.

### 7.2 Cordis: type-level changes

```diff
- Fiber.update(config: any, noSave?: boolean): void | Promise<void>;
+ Fiber.update(config: any, noSave?: boolean): void;
```
(`cordis-4.0.4/lib/types/fiber.d.ts:199`; same in `src/fiber.ts` `update()`;
`internal/update` narrowed from `next: () => void | Promise<void>` to
`next: () => void` at `lib/types/events.d.ts:230`.) Not called by this plugin.

New public type exports (`lib/types/index.d.ts:15-16`, `src/index.ts:15-16`):
```ts
export type { Volatile, VolatileSnapshot } from '@deepseek-ai/cosmokit'
```

Runtime fix: `LoggerService.exporter` now deletes the exporter it created
(`src/logger.ts:231-235`) — a real bug fix, no API change.

`README.md` gained a "Volatile configuration" section: schemas may return
`Volatile<T>` references read through `.get()`; Loader commits volatile-only
changes without restarting and notifies the owning fiber through
`loader/volatile-update`.

### 7.3 Schemastery: new API

```diff
+ Meta.volatile?: boolean
+ volatile(): Schema<NoInfer<S>, NoInfer<T>, Mode extends 'defined' | 'volatile-defined' ? 'volatile-defined' : 'volatile'>
+ type SchemaMode = 'plain' | 'defined' | 'volatile' | 'volatile-defined'
+ type SchemaOutput<T, M> = M extends 'volatile' ? Volatile<T | undefined> : M extends 'volatile-defined' ? Volatile<T> : T
+ type SetRequired<M, R> = ...
+ type Schema<S = any, T = S, Mode extends SchemaMode = 'plain'> = Schemastery<S, T, Mode>
```
(`schemastery@3.18.4/lib/types/index.d.ts:103` (`Meta.volatile`), `:156`
(`volatile()`), `:205-208` (`SchemaMode`/`SchemaOutput`/`SetRequired`/`Schema`).)

`.volatile()` throws `TypeError('volatile schema is already wrapped')` when
re-applied, and `validateVolatileSchema` rejects a volatile field nested inside
another volatile field or under a dynamic key/index
(`lib/index.mjs`, `Schema.prototype.volatile`, `validateVolatileSchema`).
`simplify()` unwraps references for persistence (`Schema.prototype.simplify`).

### 7.4 Schemastery: measured type-level deltas (tsc 6.0.3)

`z.object()` now takes `NoInfer<X>`:
```diff
- object<X extends Dict>(dict: X): Schema<ObjectS<X>, ObjectT<X>>
+ object<X extends Dict>(dict: X): Schema<ObjectS<NoInfer<X>>, ObjectT<NoInfer<X>>>
```
(`schemastery@3.18.4/lib/types/index.d.ts:77-78`.) `Inverse<X>` now evaluates
`SchemaOutput<T, M>`, so `.required()`/`.default()` return modes change
assignability.

Three probe compilations against the shipped `.d.ts`:

1. `probe-config.ts` — the **exact** `packages/dsh-jev/src/config.ts` schema
   pattern including the annotation `export const Config: z<Config> = z.object({...})`:
   * `schemastery@3.18.2`: `tsc` exits 2 with exactly one error — the probe's
     deliberate `.volatile()` line (`TS2339: Property 'volatile' does not exist`).
     Nothing else fails.
   * `schemastery@3.18.4`: `tsc --noEmit --strict --exactOptionalPropertyTypes --skipLibCheck false`
     exits **0**.
   → the `NoInfer` change does **not** break the existing `z<Config>` annotation.
2. `probe-volatile.ts` — the naive migration `interface LiveConfig { mode: Volatile<...> }`
   with `export const LiveConfigSchema: z<LiveConfig>`:
   * **fails** under `exactOptionalPropertyTypes: true`
     (`TS2375`, contravariant `.default()` parameter, `Volatile<"off"|"enforce"|"shadow">`
     vs `"off"|"enforce"|"shadow"|null`).
3. `probe-volatile2.ts` — two shapes that **compile cleanly** (exit 0, lib check on):
   * **Shape A (recommended)**, the form `dsh-agent-loop@0.1.7-rc.2` itself uses
     (`lib/types/index.d.ts:102`, `static Config: z<{ agents?: ...; maxParallelToolCalls?: number }, Config>`):
     ```ts
     export const ConfigA: z<LiveConfigInput, LiveConfig> = z.object({
       mode: z.union(['off','shadow','enforce'] as const).default('shadow').volatile(),
       selection: z.object({ enabled: z.boolean().default(true).volatile() }),
     })
     ```
   * **Shape B**, the inferred form shipped by `dsh-client-locale` and
     `dsh-client-ui-settings` (`lib/types/index.d.ts` in both, `Schemastery.ObjectT<NoInfer<{...}>>`):
     ```ts
     export const ConfigB = z.object({ ... })
     export type ConfigBType = Schemastery.TypeT<typeof ConfigB>
     ```
   Reading a volatile field requires `.get()` on the value
   (`probe-volatile2.ts` `readMode` compiles; a direct read does not).

**Consequence for `src/config.ts`**: `resolveSettings(config)` (`config.ts:259`)
reads every field directly (`config.provider`, `config.mode`, …). If the plugin
adopts volatile fields, those reads must become `config.provider?.get()` etc.,
and the `Config` interface fields must be typed `Volatile<T>`.

---

## 8. Explicit answers

### 8(a) Does the `dsh-client-test-runtime` limitation still exist?

**Yes. Unchanged at 0.1.7-rc.2.**

* `dsh-client-test-runtime@0.1.7-rc.2/lib/index.js:5-6` still contains
  ```js
  import { bindSnapshotSelector as bindSnapshotSelector$1 } from "@deepseek-ai/dsh-client-ui-renderer/src/client/bind.ts";
  import { createSlotRenderer as createSlotRenderer$1 } from "@deepseek-ai/dsh-client-ui-renderer/src/client/scoped-slots.tsx";
  ```
  and `:12` `from "@deepseek-ai/dsh-api-session-controller/src/client/scope.ts"`.
  At 0.1.6-alpha.2 the same two lines are at `lib/index.js:5-6`.
* `dsh-client-ui-renderer@0.1.7-rc.2/package.json` `files` is
  `["lib/index.js","lib/invariant.js","lib/client.js","lib/types/**/*.d.ts"]`,
  the extracted tarball has **no `src/` directory**, and `exports` declares
  `"./src/*": "./src/*"` — a subpath that points at files the tarball never ships.
* Therefore `@deepseek-ai/dsh-client-test-runtime@0.1.7-rc.2` still cannot load
  its slot bench from npm, and the "imports renderer `src/` paths while the
  published renderer ships only `lib/`" limitation recorded in
  `docs/upstream-compatibility.md:115-121` and `:253-258` still stands.
* Additional note not in the old record: the same class of failure applies to
  `@deepseek-ai/dsh-api-session-controller/src/client/scope.ts`, and it is now
  **executed, not merely suspected** — task-5 (`test-adapt`) closed the item: the
  package is a declared peer that is not installed in this workspace, *and* the
  published 0.1.7-rc.2 tarball ships no `src/` either while its `exports` still
  advertises `"./src/*"`. See §10 item 3 and `docs/adaptation/05-tests.md` §5.
  The limitation above is therefore **doubly grounded**: the published test runtime
  imports unpublished `src/` paths from *two* packages, neither of which resolves.
* Practical consequence for `packages/dsh-jev/tests/client-card.spec.ts`:
  keep the current approach (drive `apply()` against a recording fake context and
  render the component directly). Do not plan on adopting `SlotTestRuntime` /
  `stubConfigForm` from the registry.

### 8(b) Did the Remote capability restriction change?

**No.**

`dsh-api-remotes@0.1.7-rc.2/README.md:73` still states, verbatim:
> The capability set is fixed by explicit build-time value imports; the Client
> does not discover the Host's active Services or Remote definitions at runtime.

The README changed elsewhere (account/schedule namespaces, forwarded-event
descriptions) but not that line. An out-of-tree plugin still cannot add a
`ctx.remote.<namespace>` status method, so the client card's live-counter
limitation stands.

### 8(c) Does any pinned non-DSH devDependency now have a peer conflict?

**No peer conflict for any of the seven pinned non-DSH devDependencies; two
adjacent resolution problems do exist.**

Checked against every `peerDependencies` block in the 0.1.7-rc.2 packages this
project depends on (collected from each extracted `package.json`):

* `typescript@6.0.3`, `vitest@4.1.11`, `tsdown@0.22.2`, `jsdom@30.1.0`,
  `@testing-library/react@16.3.3` — no 0.1.7-rc.2 package peers any of them. No conflict.
* `react@18.3.1` — the only peer on React is
  `@deepseek-ai/dsh-client-test-runtime@0.1.7-rc.2` with `react: ^18.2.0` (and
  `react-dom: ^18.2.0`, unchanged from 0.1.6-alpha.2). `18.3.1` satisfies it. No conflict.
  (`react-dom` is still absent from our `devDependencies` — pre-existing, unchanged.)
* `@types/react@18.3.12` — no 0.1.7-rc.2 package peers `@types/react` (the
  `~18.3.1` range is a *devDependency* of the client packages, not a peer). No conflict.

Adjacent resolution problems that are **not** peer conflicts but will break installs:

1. `@deepseek-ai/dsh-settings-file@0.1.7-rc.2` **does not exist** while
   `packages/dsh-jev/package.json:92` pins it (B-7). This is an unsatisfiable pin,
   not a peer conflict.
2. `@deepseek-ai/schemastery` is pinned `3.18.2` (`package.json:54` and `:77`), while
   `@deepseek-ai/dsh-settings@0.1.7-rc.2` peers `@deepseek-ai/schemastery: ~3.18.4`
   and `@deepseek-ai/dsh-client-ui-settings@0.1.7-rc.2` *depends* on `~3.18.4`.
   `3.18.2` violates that peer range (B-8). Schemastery is `@deepseek-ai`-scoped, so
   strictly this is a DSH-family pin, but it is the only range violation found.
3. Every DSH package now peers `@deepseek-ai/cordis: ~4.0.4`; the plugin's own
   `peerDependencies["@deepseek-ai/cordis"]` is `^4.0.2` (`package.json:57`).
   `4.0.4` satisfies `^4.0.2`, so our declaration stays valid, but it no longer
   matches upstream convention and should be tightened to `~4.0.4`.

---

## 9. No change observed (do not re-litigate)

Byte-identical declarations — verified by whole-tarball SHA-256 per file:

* `dsh-agent/lib/types/runtime-types.d.ts` — the entire agent surface used here:
  `agent.ctx`, `agent/pre-step`, `agent/request`, `agent.inject`, `agent/disposed`,
  `AgentOptions`, `CreateAgentOptions` field set (only a JSDoc sentence on
  `seed` changed; that is in `index.d.ts`).
* `dsh-tools` — `tools/pre-execute` (`:47`), `tools/result` (`:92`),
  `restrict` (`:644`), `guard` (`:655`), `get` (`:690`), `schemas` (`:711`),
  `ToolExecution`, `ToolExecutionResult`, `ToolErrorInfo`, `ToolRestriction`,
  `ToolGuard`, `Scoped`, `ToolRuntime` layout apart from the new private
  `contentProjectors` field.
* `dsh-skill` — the whole package's declarations (`list`, `isModelInvocable`,
  `SkillSummary`).
* `dsh-skill-filesystem` — the whole package's declarations (discovery roots,
  `parseSkillFile` frontmatter contract).
* `dsh-agent-loop-testkit` — the whole package's declarations
  (`mountAgentLoopTestDependencies`, `mountAgentLoopTestHarness`, `AgentLoopTestHarness`).
* `dsh-scope` — the whole package's declarations (`createScope`) and its README text.
* `dsh-session-projection` — the whole package's declarations.
* `dsh-client-ui-slots` — the whole package's declarations (`SlotMap` machinery,
  `LocaleNamespaceMap`, `HostObservable`, `PropsRuntime/PropsLocale/PropsRenderSlots`).
* `dsh-client-ui-renderer/lib/types/client/*` beyond one JSDoc sentence on
  `SlotRegistry.bindStoreScope` (`client/registry.d.ts:138-147`) — `SlotRegistry.register`,
  `installScope`, `bindStoreScope` signatures are unchanged.
* `dsh-user-approval` — `approval/request` (`types.d.ts:81`), `ApprovalOutcome` (`:26`),
  `ctx.approval`; only an additive optional field and a `MessageSourceMap` augmentation.
* `dsh-llm/lib/types/message.d.ts` — `createUserMessage` (`:213`) and `ContextFormed` vocabulary
  (`form: 'notice'` still requires `summary`, `:85-88`).
* `dsh-llm/lib/types/types.d.ts` — `ToolSchema.name/description/parameters`,
  `SystemPromptUpdate`.
* `dsh-session` — `Session.deriveMessages()` (`index.d.ts:303`),
  `snapshotEvents`, `ownEvents`, `SessionHeader`, `SessionStore` service surface.
* `dsh-api-remotes` — the `remote-events.d.ts` waterfall/emit **mode** of every
  pre-existing forwarded event; `RemoteResult`/`RemoteErrorCode` vocabulary re-exports.
* `cordis` — `src/service.ts`, `src/context.ts`, `src/registry.ts`, `src/reflect.ts`,
  `src/utils.ts` and their declarations; therefore the service-proxy / `private #field`
  behaviour.
* `schemastery` — `Meta.default` semantics, `Schema.required/hidden/loose/role/link/
  comment/description/disabled/collapse/deprecated/experimental/pattern/max/min/step/set/
  push/simplify/i18n/extra` signatures other than the added `Mode` parameter;
  `Schema.resolve` handling of `null`/optional fields.
* `dsh-client-modules` — `window.__ModuleLoader__.load({ id, factory })`,
  `createClientModuleSystem`, `<id>/client` resolution, the `PLATFORM_MODULES`
  baseline description (`README.md:46`), and `dsh.client.external` semantics.
* `dsh-package-manifest` — `DshClientManifest` (`platform`, `inject`, `immediately`,
  `external`) and `DshProfileManifest.bundles`.
* The base bundle's `dsh.bundle.patch: "./cordis.patch.yml"` declaration itself.

Structural non-changes worth recording explicitly:

* `tools/pre-execute` still cannot rewrite arguments (`dsh-tools/README.md`,
  "Known Limitations" — text unchanged).
* `ctx.tools.guard` is still synchronous and monotonic (README text unchanged;
  declaration unchanged).
* A Jev `ask` still runs only after `allowed-once`; approval is still per request
  and still requires an open turn (`dsh-user-approval/README.md`).
* Model-catalog membership is still advisory for core routing
  (`dsh-llm/lib/types/index.d.ts:344-350`).

---

## 10. Not verified

Stated as open, never asserted:

1. **`ConfigForms.get(entryId)` keying.** The shipped declarations say
   `get<T>(entryId: string)` is *"Unique Host plugin entry id"*
   (`config-form.d.ts:138-142`) while `ConfigFormSpec.namespace` is *"Settings
   namespace registered by the owning Host plugin"* (`config-form.d.ts:10-13`),
   and `dsh-settings/README.md` says forms *"identify each plugin by its profile
   entry id"*. Whether this bundle must pass `'jev'` (the `cordis.patch.yml:4` row
   id) or a different id is not decidable from the published artifacts alone.
   It must be settled by a live `settings.describe` read.
2. **Whether `.volatile()` on this plugin's nested objects is accepted by
   `validateVolatileSchema`.** The runtime rejects volatile fields inside a
   volatile ancestor or under a dynamic key/index
   (`schemastery@3.18.4/lib/index.mjs`, `validateVolatileSchema`). The exact
   placement rule for `selection`/`assessment`/`loopDetection`/`skills`/
   `modelRouting` sub-objects was not executed; only the type level was probed.
3. ~~**Whether `@deepseek-ai/dsh-api-session-controller@0.1.7-rc.2` ships `src/`.**~~
   **CLOSED by execution — see `docs/adaptation/05-tests.md` §5 (task-5, `test-adapt`).**
   `dsh-client-test-runtime@0.1.7-rc.2/lib/index.js:12` imports
   `@deepseek-ai/dsh-api-session-controller/src/client/scope.ts`, and that import is
   unsatisfiable for **two independent, executed reasons**:
   1. the package is a declared peer of the test runtime
      (`dsh-client-test-runtime/package.json:37`,
      `"@deepseek-ai/dsh-api-session-controller": "0.1.7-rc.2"`) that is **not installed
      anywhere in this workspace** (`node_modules/.pnpm` has no
      `@deepseek-ai+dsh-api-session-controller*` entry); and
   2. decisively, the **published 0.1.7-rc.2 tarball ships no `src/`** either —
      inspected in the real product install
      (`%APPDATA%\in.dsh-plug.dsh-launcher\versions\0.1.7-rc.2\node_modules\.pnpm\node_modules\@deepseek-ai\dsh-api-session-controller`):
      `src/` → `False`, `src/client/scope.ts` → `False`, with `files` =
      `["lib/index.js","lib/client.js","lib/types/**/*.js","lib/types/**/*.d.ts","lib/typert.host.js","lib/typert.host.d.ts","lib/typert.remote-client.js","lib/typert.remote-client.d.ts"]`
      while `exports` still advertises `"./src/*": "./src/*"`.
   This is the same defect class as the renderer `src/` import in §8(a), so the
   **8(a) limitation is doubly grounded**: the published test runtime imports
   unpublished `src/` paths from *two* different packages, neither of which can
   resolve.
   A related measurement the Lead can use: `@deepseek-ai/dsh-api-remotes@0.1.7-rc.2`
   **does** exist (dist-tag `next`). The plugin names it in `dsh.client.inject`
   (`packages/dsh-jev/package.json:48`) — that list is *informational*, not Cordis
   service injection (`dsh-package-manifest/lib/types/types.d.ts:79`) — and the
   workspace now also declares it as a devDependency
   (`packages/dsh-jev/package.json:86`, `"@deepseek-ai/dsh-api-remotes": "0.1.7-rc.2"`).
   When it was resolved only through the inject list and not installed, its
   `SettingsPathOpView` degraded to `any` under `skipLibCheck` instead of failing
   loudly; with the devDependency in place that degradation no longer applies.
   **Not verified here:** the exact resolution path that produced the `any` at the
   time — this report asserts only the two facts above.
4. **Behavioural equivalence of the changed `lib/*.js` files** for
   `dsh-tools` (`lib/index.js`), `dsh-agent` (`lib/index.js`),
   `dsh-agent-loop`, `dsh-settings`, `dsh-session`, `dsh-client-*`. Only
   declarations and shipped READMEs were read in depth; a minified-bundle diff was
   not attempted for every package.
5. **Whether the whole 0.1.7-rc.2 dependency set actually installs in this
   workspace with pnpm.** Every `npm install` probe launched in the scratch
   directory stalled and was abandoned; packaging/install behaviour is owned by
   the concurrent lockfile task, not by this report.
6. **The `@deepseek-ai/cordis-plugin-loader` `loader/volatile-update` event's
   DSH-side wiring** (mentioned only in `cordis@4.0.4/README.md`); the loader
   package itself was not fetched.
7. **Counts of `package.json` `dsh.engines.dsh` ranges** in the 0.1.7-rc.2
   packages — `engines` was not part of the extracted comparison.

---

## 11. Module augmentation the plugin will need (quick reference)

For a settings-integrated, message-injecting plugin under 0.1.7-rc.2 the minimum
new declarations are:

```ts
// src/service.ts (or a small d.ts) — the plugin's own message source kind
declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    'dsh-jev': { kind: 'dsh-jev' } & ContextFormed
  }
}
```

```ts
// src/config.ts — volatile fields (shape A, verified to compile)
export interface Config { /* input shape, plain values */ }
export interface LiveConfig { /* output shape, Volatile<T> fields */ }
export const Config: z<Config, LiveConfig> = z.object({ /* …  .volatile() … */ })
```

```ts
// src/client/index.tsx — the client data path
// Three members, not four: `settingsScope` became `configForms` (B-4), and
// `remote` must NOT be declared by a consumer of the forms service.
export const inject = ['slots', 'locale', 'configForms']   // [observed] packages/dsh-jev/src/client/index.tsx:41
const form = ctx.configForms.get<JevSettings>('jev')       // [observed] :57
```

**Do not add `'remote'` back.** The 0.1.6 list was
`['slots', 'locale', 'remote', 'settingsScope']`; only `settingsScope` was renamed,
so a one-token edit produces a four-member row that looks plausible and is wrong.
In 0.1.7-rc.2 the `remote.settings` namespace is held by the **providing** fiber of
the config-forms service, not by each caller. `@deepseek-ai/dsh-client-ui-settings/lib/types/client/config-form.d.ts:113-118`
says so outright — the providing fiber is kept because "a Service reads `ctx` as its
*consumer's* fiber: letting a shared form write through the caller's context would
make every caller declare `remote.settings` in its own `inject`." A caller that
declares `remote` would over-declare its dependencies.

Provenance: the source array and the `get('jev')` call are **[observed]** in
`packages/dsh-jev/src/client/index.tsx:41` and `:57`. The emitted
`packages/dsh-jev/lib/client.js` has **not** been inspected, so this is not
classified as executed — the verifier must still confirm the built artifact.

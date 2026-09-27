# 00 — Adaptation to DSH `0.1.7-rc.2`: consolidated record

**This file is the authoritative index.** The per-task files (`01`–`07`) are
time-stamped snapshots written while the work was in flight; where any of them
still shows a mid-run number, this file and the final section below supersede
it.

| | |
|---|---|
| Target | `@deepseek-ai/dsh-*` **0.1.7-rc.2** (npm dist-tag `next`), `@deepseek-ai/cordis` **4.0.4**, `@deepseek-ai/schemastery` **3.18.4** |
| Previous verified matrix | `0.1.6-alpha.2` / cordis 4.0.2 / schemastery 3.18.2 |
| Repository HEAD at start | `87e29e2` |
| Baseline | **green** on the old matrix before any change: `jev-core` 8 files / 85 tests, `dsh-jev` 7 files / 62 tests |
| Result | **green on the same counts**: `jev-core` 85, `dsh-jev` 62 — **zero delta** |

The baseline was captured *before* the first pin change on purpose: it is what
makes every post-bump failure attributable to the upgrade rather than to a
pre-existing condition.

---

## 1. What changed, and why — grouped by kind

### 1.1 Dependencies

| Change | Reason (evidence) | Impact |
|---|---|---|
| 6 `peerDependencies` + 19 `devDependencies` `0.1.6-alpha.2` → `0.1.7-rc.2`; `examples/coding` 6 pins likewise | The upgrade target. Registry dist-tags confirmed `next = 0.1.7-rc.2` for every package. | The plugin now compiles and runs against the 0.1.7-rc.2 APIs. |
| `@deepseek-ai/cordis` dev `4.0.2` → `4.0.4`; **peer `^4.0.2` → `~4.0.4`** | Every `0.1.7-rc.2` package declares `cordis ~4.0.4`. A plugin must not claim a wider compatible range than the platform it was verified against. | Peer range narrowed to the tested line. Resolution still 4.0.4. |
| `@deepseek-ai/schemastery` `3.18.2` → `3.18.4` | `.volatile()` exists only in 3.18.4, and `dsh-settings` peers `~3.18.4`. Without it the settings form contract cannot be implemented at all. | Enables the `.volatile()` schema contract (§1.2.3). |
| **Removed** `@deepseek-ai/dsh-settings-file` | There is **no `0.1.7-rc.2` release** (the registry stops at `0.1.6-alpha.2`), the package appears **zero** times in the real 0.1.7-rc.2 product tree, and `dsh-base` dropped its row — upstream abandoned it and folded the storage into `@deepseek-ai/dsh-settings`. Holding the old pin would also have dragged `@deepseek-ai/dsh-util-values@0.1.6-alpha.2` into the test tree. | `pnpm install` removed 4 packages (the dep + 3 transitives). **Zero** `0.1.6-alpha.2` references remain in any `package.json` or in `pnpm-lock.yaml`. |
| **Added** `@deepseek-ai/dsh-api-remotes@0.1.7-rc.2` (type-only) | `config-form-types.d.ts` imports `SettingsPathOpView` from it; it is a peer of `dsh-client-ui-settings` but was not declared and absent from `node_modules`, so with `skipLibCheck: true` the type degraded to `any` and the new `mutate` op objects were **unchecked**. | A deliberately bogus op (`op:'typo'`, `path:42`, `value:Symbol()`) compiled at exit 0 before and fails with three precise `TS2322`s after. It immediately caught a real `unknown` → `JsonValue` defect in our own controller. Type-only, so the artifact is unchanged. |
| **Added** test-only: `@deepseek-ai/dsh-config-editor@0.1.7-rc.2`, `@deepseek-ai/dsh-app-boot@0.1.7-rc.2`, `@deepseek-ai/cordis-plugin-loader@1.0.5` | The settings test must boot the **real** stack; `AGENTS.md` forbids claiming a path without an executed test, and the settings document's only real transport is the Loader + config editor. | Test-only. No runtime dependency added. |
| `.gitattributes` (new) `*.sh text eol=lf` | Pre-existing: with `core.autocrlf=true` and no attributes, `scripts/verify.sh` was checked out CRLF, so `set -euo pipefail\r` died with `set: pipefail: invalid option name` and **the repo's own gate could not run at all**. | `pnpm verify` now executes end to end (§3). |

Exact pins only; no ranges and no `latest` were introduced.

### 1.2 Breaking API changes and how each was adapted

Seven upstream surfaces moved. Everything else the plugin binds to was classified
**identical** (§1.2.8).

**1.2.1 `MessageSourceMap['plugin']` removed** — `src/adapters/pre-step.ts`
The skill-hint message used `source: { kind: 'plugin', plugin: 'dsh-jev', … }`.
The declaration states outright that the union is *merge-extensible* and that
`each producer declares its own kind in its own module; there is no shared
catch-all `plugin` kind` (`dsh-llm/lib/types/message.d.ts:94-108`).

- **Adaptation:** declare the plugin's own member by module augmentation
  (`'dsh-jev': { kind: 'dsh-jev' } & ContextFormed`) and bound the notice
  summary with the real `boundContextSummary()` (120 chars,
  `message.d.ts:114-120`). Nine upstream packages augment the union the same way.
- **Impact:** the only runtime delta is the string `'plugin'` → `'dsh-jev'`,
  which is durable metadata, not model prose. Every installed consumer of
  `source.kind` guards on `rpcId`, so no behaviour changes; the hint text still
  reaches the model (proven by two executed agent-loop tests). **Deliberately not
  done:** the alternative members were refuted rather than merely rejected by the
  compiler — `user` would make the hint displace the real task text in
  `extractTask`, and `skill-invocation` would falsely record that a skill body had
  been injected.
- **Known limit:** the new member is not visible to a consumer that imports only
  the package root (reproduced by two agents independently, with a positive
  control). Types only, no runtime consequence, and the union is *designed* for
  consumers to fall through unknown kinds — so the public surface was
  deliberately **not** widened.

**1.2.2 `ctx.settings.installSection` and its hooks removed** — `src/settings-section.ts`
The settings document is now the active profile's Cordis patch; the old
`installSection` / `setSource` / `onChange` / `validate` surface is gone.

- **Adaptation:** rewritten as the three contributions the new contract wants —
  the page policy (`configure({ auto: false })`), the write gate on the
  `internal/config` waterfall, and `loader/volatile-update` → `reconfigure`.
  `next()` is called first, as the repo rules require.
- **Impact:** the user-visible capability is unchanged, and both hard invariants
  survive: `apiKey` keeps `role('secret')` (the redacted value carries only a
  presence marker), and `provider: 'live'` with an empty key while the mode is
  enabled is still **refused before anything is persisted** — so the document and
  the running runtime can never disagree.
- **Non-obvious:** the gate now sees the *raw* candidate rather than a
  schema-resolved value, so an omitted `mode` counts as enabled (it defaults to
  `shadow`). That is stricter than the old hook, and deliberate.

**1.2.3 Form-editable config leaves must be `.volatile()`** — `src/config.ts`, `src/service.ts`
A form exists only for schema fields marked `.volatile()`; the document keys forms
by Loader entry id.

- **Adaptation:** mark every form-editable leaf `.volatile()`, add a
  `ParsedConfig` type, add `plainConfig()` to unwrap live references, and annotate
  the schema as `z<Config, ParsedConfig>`. `src/service.ts` unwraps at its two
  read sites. `apiKey` stays `role('secret')`.
- **Why `z<Config, ParsedConfig>` and not inference:** `z.dict(...)` leaks
  cosmokit's `Dict` into the inferred type, which cannot be named in a declaration
  (`TS2883`). The two-parameter form compiles *and* adds a compile-time check that
  the schema produces the declared shape; the plain `Config` meaning is preserved
  for all ten existing call sites.
- **Impact:** the web configuration page keeps working. `.volatile()` cannot nest
  (the schema rejects volatile-inside-volatile), so marking is per-leaf inside
  plain nested objects.

**1.2.4 `ctx.settingsScope` / `SettingsScope` removed** — `src/client/**`
- **Adaptation:** the client now reads and writes through
  `ctx.configForms.get('jev')`, which returns a `ConfigForm`; the controller's
  types move from `SettingsScope*` to `ConfigForm*`.
- **Impact:** same card, same controls. `inject` becomes
  `['slots','locale','configForms']` — `remote` is dropped because the
  *providing* fiber holds `remote.settings`, so a caller must not declare it.

**1.2.5 `ConfigForm.set(field)` addresses ONE path segment** — `src/client/jev-card-controller.ts`
Not a rename: `set('selection.enabled', …)` would have written a literal
top-level `"selection.enabled"` key, because the implementation forwards
`mutate([{ op: 'set', path: [field], value }])`.

- **Adaptation:** all nested writes now go through
  `mutate([{ op: 'set', path: ['selection','enabled'], value: true }])`, and a
  Host-refused write (`false`) is rethrown so the card can no longer report
  success for a write that did not land.
- **Impact:** avoids a silent data-shape defect. Two **independent** guards now
  cover this: the compiler rejects a malformed op shape, and a deliberately
  strict test double rejects a correctly-typed but wrongly-addressed write.

**1.2.6 Tool results are first-class `role:'tool'` messages** — `tests/agent-loop.spec.ts`
The `tool-result` content block was removed from the closed `ContentBlockMap`;
`isError` now rides the message (`dsh-llm/lib/types/message.d.ts:152-160`).

- **Adaptation:** the failure-text reader was updated. No assertion was touched.
- **Impact — coverage *improved*:** the sibling negative assertion
  `expect(toolFailureTexts(agent)).toEqual([])` had been passing **vacuously**
  against 0.1.7-rc.2; it is a real negative assertion again.

**1.2.7 `PreToolDecision.ask` gained an optional `displayReason`** — deliberately not adopted
The plugin emits no user-facing prose (only rule ids and measured values, per
`AGENTS.md`), there is no host-side locale dictionary, the field is optional, and
the client falls back to `reason`. Adopting it would advertise a localization
that does not exist. Recorded as a possible follow-up feature, not a gap.

**1.2.8 Everything else is identical — no changes made**
`tools/pre-execute`, `tools/result`, `ctx.tools.restrict`/`guard`/`get`/`schemas`,
`agent.ctx`, `agent/pre-step`, `agent/request`, `agent.inject`, `agent/disposed`,
`ctx.skills.list`, `isModelInvocable`, `approval/request` + `allowed-once`, the
Cordis service-proxy `private`-vs-`#` hazard, the
`window.__ModuleLoader__.load({ id, factory })` client artifact contract, and
`dsh-agent-loop-testkit` (declarations byte-identical). **Speculative edits were
deliberately avoided** at every one of these call sites.

### 1.3 Behaviour, configuration, and non-functional

- No behaviour was silently changed. The two intentional behaviour deltas are
  named above: a Host-refused settings write now surfaces as a card failure
  (§1.2.5), and the live-without-key write gate is now evaluated on the raw
  candidate so an omitted `mode` counts as enabled (§1.2.2).
- `cordis.patch.yml` and the bundle/profile install path are unchanged (the patch
  contract is compatible; it was merely widened to accept a list).
- The emitted client artifact is unchanged in contract: `id`, only
  `react` / `react/jsx-runtime` resolved, zero cross-plugin value imports.
- No new `as any`, `@ts-ignore`, `@ts-expect-error`, or lint suppression was added
  anywhere — verified across 2,445 added lines.
- No test was deleted, skipped, weakened, or `.only`'d. Test counts are identical
  before and after: **85** and **62**.

---

## 2. How each change was verified

| Layer | Evidence |
|---|---|
| Dependency resolution | `pnpm install --frozen-lockfile` exit 0; every `@deepseek-ai/dsh-*` resolves to 0.1.7-rc.2, cordis 4.0.4, schemastery 3.18.4; a breadth-first walk of all 297 installed links found **zero** reachable stale versions |
| Upstream delta | `docs/upstream-delta-0.1.7-rc.2.md` — built from the shipped 0.1.6-alpha.2 and 0.1.7-rc.2 tarballs, every claim citing a file and line |
| Types and build | both `tsc` projects clean; `tsdown` clean |
| Tests | `85` + `62`, re-run twice; a third agent re-ran both suites independently and re-measured the same counts |
| Client artifact | loaded with stub globals by two agents independently: `id` correct, `inject` = `[configForms, locale, slots]`, only React resolved, zero cross-plugin value imports |
| Repo hard rules | five `AGENTS.md` invariants re-read and pointed at by `file:line` in `docs/adaptation/07-verification.md` |
| Test hermeticity | the settings spec was proven machine-independent by running it under four ambient `DSH_HOME` conditions (decoy-missing, decoy-empty, unset, live) with identical results; the live harness home was byte-identical afterwards |
| Real product (strongest proof) | the installed real `dsh` **0.1.7-rc.2**: `dsh --version` OK; a throwaway profile composed the `# == @buberlo/dsh-jev` layer; a real boot **instantiated `JevRuntime`** through cordis 4.0.4 and failed closed with the exact apiKey error, then reached `MISSING_CREDENTIAL` at the LLM stage |
| Whole gate | `pnpm verify` — see §3 |

### 2.1 Defects an independent verifier found, and their disposition

The verifier's job was to falsify, and it did. Five defects, all dispositioned:

| # | Severity | Finding | Disposition |
|---|---|---|---|
| D2 | high | `pnpm verify` could not run at all (CRLF checkout) | **Fixed** — `.gitattributes` + renormalize; the gate now passes |
| D3 | medium | `scripts/packaging-test.mjs` cannot spawn `pnpm`/`tsc` on Windows; **pre-existing**, and it was hiding three genuinely green checks | **Fixed** — platform-correct spawns, POSIX path unchanged; the packaging test now passes |
| D5 | medium | `03-host.md` misdiagnosed D3 as a sandbox limitation | **Fixed** — corrected by its author, attributed, labelled a misdiagnosis |
| D4 | low | The `MessageSourceMap` member is absent from the published type surface | **Accepted as a documented limit** (§1.2.1) |
| D1 | low | Unreachable leftover `.pnpm` store directories from the two-phase install (baseline, then bump) | **Explained**: a consequence of installing 0.1.6-alpha.2 first, then bumping. None are reachable; a fresh clone would not have them |

Both D2 and D3 are **pre-existing** repository/tooling defects, not fallout from
the upgrade. They were fixed rather than merely documented because `AGENTS.md`
names `pnpm verify` as the gate that must be run, and because D3 was concealing
three real passing checks.

---

## 3. The gate

```
== install (frozen lockfile) ==   Lockfile is up to date… Done
== build ==                       tsc ×2 + tsdown, ✔ Build complete
== typecheck ==                   clean (both projects)
== unit + integration tests ==    jev-core 85 passed (8 files); dsh-jev 62 passed (7 files)
== offline evaluation (mock) ==   25/25 cases; regression 9/9; held-out 5/5
== threshold calibration ==       ran to completion (verify.sh redirects its output)
== examples ==                    coding / ops / game / dsh all ran
== packaging test ==              PASSED (real plugin load, fail-closed, single cordis, clean tsc)
verify: OK
```

`pnpm verify` was **impossible to run** before this work (D2) and had therefore
never been executed on this checkout. It now completes with **exit 0**
(`verify: OK`) — run twice by `docs-adapt`, and independently by the Lead, whose
run is the basis of the block above.

Two cosmetic residuals, disclosed rather than hidden:

- `tests/client-card.spec.ts` emits two pre-existing React warnings about mixing
  a `border` shorthand with `borderColor`. They existed before the upgrade and are
  not errors.
- The packaging test prints Node's `DEP0190` deprecation warning on Windows,
  because the fix for D3 passes `shell: true`. All arguments are internal
  constants or paths the script itself created. The POSIX path uses no shell, so
  CI is unaffected.

---

## 4. Scope of the support claim — what is *not* verified

Stated plainly, because a support claim beyond the evidence is the one thing this
repository forbids:

- **Not executed:** serving and interacting with the web client at 0.1.7-rc.2, and
  the in-browser → Host write round trip (no browser available). The Host half, the
  built artifact load, and a strict client-form double *are* executed.
- **Not executed:** a live TypeSafe run (no credentials; without a key the runner
  reports *not executed*, never a pass).
- **Not re-executed at 0.1.7-rc.2:** the benchmark and evaluation measurements
  dated 2026-09-19/23, the PTC conclusion, and the `@buberlo/*` registry facts.
  These are kept, dated, and labelled as carried over.
- **Not established:** behavioural equivalence of the changed upstream `lib/*.js`
  bundles (declarations and READMEs were read in depth; no full bundle diff);
  `engines` ranges of the 0.1.7-rc.2 packages; the `loader/volatile-update`
  wiring beyond what the settings test exercises.
- **Not provable here:** a pristine-machine install (the verifier could not delete
  `node_modules` while other agents were working, so D1's leftovers cannot be shown
  to be absent from a clean install).
- **Known pre-existing gate gap:** `pnpm typecheck` compiles `src/**` only, so
  stale type imports inside `tests/**` are invisible to it. Three such pre-existing
  imports remain; the one the upgrade caused was fixed.

---

## 5. Team structure and division of labour

Seven agents with **disjoint write scopes**, coordinated through a shared task
board. Only the foundation task ran first; the rest were parallelised.

| # | Agent | Task | Write scope | Outcome |
|---|---|---|---|---|
| T1 | `dep-upgrade` | Pins + lockfile | all `package.json`, `pnpm-lock.yaml` | Baseline green, 25 pins bumped, error inventory |
| T2 | `api-delta` | Upstream delta report | `docs/upstream-delta-…md` | 836 lines, every claim from a shipped tarball |
| T3 | `host-adapt` | Host plane, non-settings | `src/adapters/**`, `state`, `usecases`, examples | 1 file changed; both typechecks clean |
| T4 | `settings-adapt` | Settings subsystem + client | `src/config.ts`, `service.ts`, `settings-section.ts`, `src/client/**`, settings spec | The large migration; 62/62 |
| T5 | `test-adapt` | Remaining tests + bench | `tests/**` (except settings), `bench/**` | 2 files changed; found the unchecked-`mutate` hole |
| T6 | `docs-adapt` | Version matrix + docs + tooling | `README`, `docs/**`, `scripts/**` | Docs reconciled; later fixed the gate (T8) |
| T7 | `verifier` | Independent adversarial verification | `docs/adaptation/07-…md` only | 483 lines, 5 defects, falsified the gate claim |

Sequencing decisions the Lead made, and why:

- **`src/config.ts` + `src/service.ts` were moved from T3 to T4** after T4 showed
  the `.volatile()` migration is one entangled change with `settings-section.ts`.
  Splitting it would have guaranteed a conflict.
- **T4's two blockers were approved with constraints:** editing those two files,
  and adding the test-only dependencies needed to keep the settings test *real*
  rather than faking it.
- **T3/T4/T5 were unblocked from T2** (the delta report) once the compiler had
  produced an authoritative empirical error list — the report enriches, it does not
  gate, and serialising three writers behind one reader cost more than it bought.
- **The Lead performed the shared-resource mutations serially** (removing the dead
  dependency, tightening the peer range, adding `dsh-api-remotes`) so that only one
  writer ever touched `package.json` and `node_modules` at a time.
- **Routing on guidance over hard gates:** T3 was told to complete without waiting
  for T4, and the verifier started on a frozen code state while the docs were
  reconciled in parallel.

### 5.1 Lead verification performed directly

Not delegated, because it decided other agents' work:

- Repaired a broken `pnpm` (the global shim pointed at a pruned store path) — the
  toolchain was unusable at session start.
- Verified from the installed declarations, before briefing the team:
  `PreToolDecision.ask` gained `displayReason?`; `MessageSourceMap` is
  merge-extensible with no catch-all kind; `ConfigForm.set` is single-segment and
  `mutate` is the path-addressed API; `Schema.simplify` unwraps `Volatile` via
  `isVolatile(value) ? value.get() : value` and recurses.
- Decided the `dsh-settings-file` question (remove, not hold) after confirming the
  package is absent from the real 0.1.7-rc.2 tree.
- **Was corrected by the team on two points, and accepted both:** T4 refuted the
  Lead's hypothesis for the "overridden by a home patch" error (the real trigger is
  the config editor's layer recomposition, not the home layer), and T4 showed the
  Lead's suggested schema-annotation option (B) does not compile.
- Caught a test-hermeticity gap: the settings spec resolved the *live* harness home
  because DSH home resolution is process-global and ignores `profileContext`. Fixed,
  and proven with the four-way ambient-`DSH_HOME` run. No damage had occurred.

---

## 6. Per-task logs: what to read, and their known staleness

`01`–`07` are time-stamped working records, kept as written for provenance. Three
still contain mid-run numbers that were true when written and are labelled
superseded:

| File | Stale statement | Authoritative value |
|---|---|---|
| `01-deps.md` | "`pnpm test` not re-run post-bump; counts will differ from 85+62" | 85 + 62, exact |
| `03-host.md` | §1/§10 mid-run "settings spec cannot collect / 56 tests" | 85 + 62 (labelled superseded by T9) |
| `05-tests.md` | §7 reproduction comment carrying the mid-run figure | 85 + 62 |

`03-host.md` §7.3b previously misdiagnosed the packaging failure; it is corrected
and attributed. Everything else in these files is accurate as observed at the time
it was written.

---

## 7. One-line summary

The plugin is adapted to DSH `0.1.7-rc.2`: **four** upstream breaking changes were
migrated (message-source union, settings subsystem, volatile schema contract, and
the single-segment form write), **one** abandoned dependency was removed, **two**
real type-safety holes were closed, the test suite is at its original **85 + 62**
with zero delta, the repo's own gate now runs and passes for the first time, a real
0.1.7-rc.2 product boot was proven, and the remaining unverified paths are named
rather than implied.

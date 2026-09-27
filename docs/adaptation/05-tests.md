# 05 — Test-suite and benchmark adaptation: DSH 0.1.6-alpha.2 → 0.1.7-rc.2

Task `task-5` (owner `test-adapt`). This is the hand-off for the *test* plane.
It records the executed before/after test counts, every changed line with its
justification from the installed declarations, the explicit answer to the
`dsh-client-test-runtime` question, the `bench:compare` verdict, and the
findings the Lead must route to task-3 / task-4 / task-6.

Every claim is marked **[executed]** (a command was run and this is its literal
observed outcome), **[observed]** (read directly from a file on disk) or
**[inferred]** (reasoned from those, not run).

Environment **[executed]**: `node v24.16.0`, `pnpm 12.4.2`, Windows, repo
`D:\dsh-plugins\dsh-jev`, `node_modules` installed at 0.1.7-rc.2 (no `pnpm
install` was run by this task). Raw logs: `%TEMP%\jev-adapt\t5-*.log`.

---

## 0. Status at a glance — the final figure

| | Count | State |
| --- | --- | --- |
| `@buberlo/jev-core` | **85 passed** (8 files) | identical to baseline, **zero changes** |
| `@buberlo/dsh-jev` — the 6 files task-5 owns | **56 passed** (6 files) | 0 failures |
| `@buberlo/dsh-jev` — `settings-section.spec.ts` (task-4) | **6 passed** | hermeticity corrected by task-4 |
| **Whole workspace** | **85 + 62 = 147 passed, 0 failing** | **GREEN, certified** |

**FINAL, executed twice consecutively:** `pnpm --filter @buberlo/jev-core test`
→ `8 files / 85 passed`; `pnpm --filter @buberlo/dsh-jev test` → `7 files / 62
passed`, exit 0. **Zero delta from the pre-upgrade baseline of 85 / 62.** No test
was deleted, skipped, or weakened. The number is the same only because the two
real breaks were adapted rather than worked around (§0.1, §1.3, §3).

The green is certifiable because `settings-section.spec.ts` now pins its own
home (`vi.stubEnv('DSH_HOME', home)` at `:96`, `vi.unstubAllEnvs()` at `:39`),
so the result no longer depends on the machine's ambient home — see §2.2.

### 0.1 The load-bearing finding: a vacuous assertion was restored to a real one

**This is the most valuable result of task-5.** The 0.1.7-rc.2 removal of the
`tool-result` **content block** (in favour of a first-class `role: 'tool'`
**message** with `isError` on the message, §1.3) did not merely break a helper —
it silently made one assertion **unable to fail**:

* `agent-loop.spec.ts:191`, in `enforce + allow assessment runs the tool
  unchanged`: `expect(toolFailureTexts(agent)).toEqual([])`.
* With the pre-upgrade reader on 0.1.7-rc.2, `toolFailureTexts` returned `[]`
  **unconditionally** — so this assertion was **vacuous** and would have stayed
  green even if Jev had started emitting spurious tool errors.
* After the §3.1 fix it is a genuine **negative assertion** again: it now fails
  unless the allow path truly produces zero error tool-results.

A second, subtler gain: the two failures that *did* surface (`:158`, `:286`)
prove the corrected reader is actually finding error messages, so the negative
assertion above cannot be passing vacuously a second time. **Net: coverage
increased; no assertion was weakened.**

---

## 1. Baseline and the real post-upgrade failures

Baseline **[executed, quoted from `docs/adaptation/01-deps.md:26`]**, at commit
`87e29e2` on 0.1.6-alpha.2: `packages/jev-core` **8 files / 85 tests passed**;
`packages/dsh-jev` **7 files / 62 tests passed**.

### 1.1 Run 1 — the unmodified tree on 0.1.7-rc.2 **[executed]**

`pnpm --filter @buberlo/jev-core test` (log `t5-core-1.log`):

```
 Test Files  8 passed (8)
      Tests  85 passed (85)
```

Zero changes were required in `packages/jev-core`; it has no `@deepseek-ai/*`
dependency, so the bump cannot reach it. **Delta vs baseline: 0.**

`pnpm --filter @buberlo/dsh-jev test` (log `t5-dshjev-1.log`):

```
 FAIL  |dsh-jev| tests/settings-section.spec.ts [ tests/settings-section.spec.ts ]
Error: Cannot find package '@deepseek-ai/dsh-settings-file' imported from .../tests/settings-section.spec.ts

 FAIL  |dsh-jev| tests/agent-loop.spec.ts > dsh-jev on the real agent loop > enforce + ask assessment without an approval answerer fails closed and never runs the tool
AssertionError: expected 0 to be greater than 0
 ❯ tests/agent-loop.spec.ts:158:29

 FAIL  |dsh-jev| tests/agent-loop.spec.ts > dsh-jev on the real agent loop > keeps two parallel sessions isolated
AssertionError: expected '' to contain 'identical read_file'
 ❯ tests/agent-loop.spec.ts:286:47

 Test Files  2 failed | 5 passed (7)
      Tests  2 failed | 54 passed (56)
```

### 1.2 Classification (task instruction step 2)

| # | Failure | Class | Owner | Evidence |
| --- | --- | --- | --- | --- |
| F1 | `agent-loop.spec.ts:158` / `:286` — Jev *did* decide (`stats.asks` at `:156` passed) but no error tool-result text was found | **(a)** upstream API change in a file I own | task-5 | §3.1 |
| F2 | `settings-section.spec.ts` cannot be collected: `@deepseek-ai/dsh-settings-file` is absent | **(b)** task-4's in-flight dependency removal + settings migration | task-4 | task-4 removes that devDependency |
| F3 | `src/adapters/pre-step.ts:236` and `src/settings-section.ts:32/33/39`, `src/client/*` type errors | **(b)** task-3 / task-4 work-in-progress | task-3 / task-4 | `docs/adaptation/01-deps.md:315–320` |

**The two agent-loop failures are both one root cause (F1), not two.** They are
the *only* two runtime failures in the whole dsh-jev suite, and both were caused
by the same single helper in `agent-loop.spec.ts`.

### 1.3 Root cause of F1 — a real, breaking upstream shape change **[observed]**

At 0.1.6-alpha.2 a tool result was a **content block** (`type: 'tool-result'`,
with its own `isError` and nested `content`). At 0.1.7-rc.2 that block is gone:

* `node_modules/@deepseek-ai/dsh-llm/lib/types/types.d.ts:114–122` — the closed
  `ContentBlockMap` is `text | reasoning | image | file | tool-call |
  tool-addition | tool-removal`. **There is no `tool-result` member.**
* `.../dsh-llm/lib/types/message.d.ts:152–160` — a tool result is now a
  first-class message: `interface ToolResultMessage extends MessageBase
  { role: 'tool'; source: ToolMessageSource; toolCallId: ToolCallId;
  isError?: boolean }`. `isError` lives on the **message**, not on a block.

The old helper therefore matched nothing and returned `[]`. Compile-level proof
that this is the new API, not a behaviour change in my code **[executed]**: the
*unmodified HEAD* file typechecked against the installed 0.1.7-rc.2 types
reports

```
tests/_t5h_agent-loop.ts(109,11): error TS2367: This comparison appears to be unintentional because the types
  '"reasoning" | "text" | "image" | "file" | "tool-call" | "tool-addition" | "tool-removal"' and '"tool-result"' have no overlap.
tests/_t5h_agent-loop.ts(109,49): error TS2339: Property 'isError' does not exist on type 'never'.
tests/_t5h_agent-loop.ts(110,35): error TS2339: Property 'content' does not exist on type 'never'.
```

(probe copy of `HEAD:packages/dsh-jev/tests/agent-loop.spec.ts`, deleted after
the run).

---

## 2. BEFORE → AFTER counts, with every delta accounted for

| Suite | Baseline (0.1.6-alpha.2) | First run on 0.1.7-rc.2 | Final run on 0.1.7-rc.2 | Delta | Explanation |
| --- | --- | --- | --- | --- | --- |
| `@buberlo/jev-core` | 8 files / 85 tests | 8 files / 85 passed | **8 files / 85 passed** | **0** | No DSH dependency; no file touched. |
| `@buberlo/dsh-jev` — my 6 files | — (56 of the 62) | 54 passed / 2 failed (56 collected) | **6 files / 56 passed / 0 failed** | **0** | Both failures were the one F1 helper; fixed without touching a single assertion. |
| `@buberlo/dsh-jev` — `settings-section.spec.ts` | — (6 of the 62) | 0 collected (suite error) | **0 collected (suite error)** | **−6, task-4** | Not mine; see §1.2 F2. |

**Accounting identity (the point the Lead asked for):** baseline 62 =
**56 (the six files I own)** + **6** (`settings-section.spec.ts`).
My six files collect and pass exactly **56** both before and after the upgrade
**[executed: 56 collected in run 1, 56 passed in the final run]**, so **my scope
has zero delta**. The only shortfall against 62 is the 6 tests inside
`tests/settings-section.spec.ts`, which task-4 owns and which cannot be
collected until task-4 lands the `@deepseek-ai/dsh-settings-file` removal. No
test was deleted, skipped, or weakened. `settings-section.spec.ts` carries
exactly 6 non-parametrised `it(...)` **[observed]**.

Per-file run while task-4's spec was still uncollectable **[executed,
`t5-dshjev-5.log`]** — this is the run that isolates my scope:

```
 ✓ |dsh-jev| tests/selection-empty-catalog.spec.ts (3 tests) 38ms
 ✓ |dsh-jev| tests/skill-install.spec.ts (3 tests) 78ms
 ✓ |dsh-jev| tests/onprem-support.spec.ts (21 tests) 138ms
 ✓ |dsh-jev| tests/tool-runtime.spec.ts (10 tests) 154ms
 ✓ |dsh-jev| tests/agent-loop.spec.ts (13 tests) 215ms
 ✓ |dsh-jev| tests/client-card.spec.ts (6 tests) 206ms
⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯
 FAIL  |dsh-jev| tests/settings-section.spec.ts  → Cannot find package '@deepseek-ai/dsh-settings-file'
 Test Files  1 failed | 6 passed (7)
      Tests  56 passed (56)
```

Run 1 collected the same 56 in the same six files (`2 failed | 54 passed`)
**[executed]**, so no test disappeared between runs.

### 2.1 The 62 became visible once task-4's spec could be collected

Task-4 migrated `settings-section.spec.ts` off the removed
`@deepseek-ai/dsh-settings-file`, so the full 62 finally collected for the first
time in this upgrade **[executed, `t5-dshjev-final.log`]**:

```
 ✓ |dsh-jev| tests/skill-install.spec.ts (3 tests) 88ms
 ✓ |dsh-jev| tests/onprem-support.spec.ts (21 tests) 149ms
 ✓ |dsh-jev| tests/tool-runtime.spec.ts (10 tests) 158ms
 ✓ |dsh-jev| tests/agent-loop.spec.ts (13 tests) 235ms
 ❯ |dsh-jev| tests/settings-section.spec.ts (6 tests | 4 failed) 230ms
 ✓ |dsh-jev| tests/client-card.spec.ts (6 tests) 203ms
 Test Files  1 failed | 6 passed (7)
      Tests  4 failed | 58 passed (62)
```

**This is the definitive accounting of the whole suite: 62 = 56 (all six files
task-5 owns, all passing) + 6 (`settings-section.spec.ts`, task-4's).** The 4
failures are all inside task-4's file and none is in task-5's scope:

| Failure | Location | Observed |
| --- | --- | --- |
| 1 | `settings-section.spec.ts:115` | `AssertionError: expected undefined to be defined` on `ctx.settings.describe({ redactSecrets: true })` |
| 2, 3 | `settings-section.spec.ts` (two tests) | `Error: Configuration for "jev" is overridden by a home patch or command-line overlay`, raised from `@deepseek-ai/dsh-config-editor/lib/index.js:116` |
| 4 | `settings-section.spec.ts:175` | `TypeError: Cannot read properties of undefined (reading 'assess')` after `mountProfile(['mock:', '  delayMs: 5000'])` |

Failures 2 and 3 were reported to task-4, first as a **hermeticity** concern. The
true picture, resolved by task-4 and worth recording precisely because my first
reading was only half right:

* **There WAS a real hermeticity gap** (confirmed by the Lead and then measured
  by me in §2.2): the
  fixture set `profileContext.home` to a temp dir, but **DSH home resolution is
  process-global and ignores `profileContext`** — the shipped precedence is
  configured path ?? `$DSH_HOME` ?? `~/.dsh`
  (`@deepseek-ai/dsh-home-paths/lib/index.js:65–75`), and `DSH_HOME` pointed at
  the **live** harness home. So the test was resolving the real home and its
  result was machine-dependent. That was fixed properly: the spec now pins its
  own home (`vi.stubEnv('DSH_HOME', home)` at `:96`, `vi.unstubAllEnvs()` at
  `:39`), and the three-way run in §2.2 (ambient / decoy / unset → identical
  `6 passed`; decoy dir never created; real home's `cordis.patch.yml` hash
  byte-identical) proves the dependence is gone.
* **But it was NOT the trigger for these two failures.** My "overridden by a home
  patch" hypothesis was **wrong**, and neither was the home layer: the message is
  *generic*. It came from `dsh-config-editor`'s guard that recomposes only the
  layers the editor owns (bundle layers + profile patch + home patch + CLI
  overlays, `lib/index.js:112–116`) and requires the target row to be derivable
  from them. The first fixture put the row in the **leaf `cordis.yml`** — none of
  those layers — so the lookup fell to `{}` and the guard rejected the write. The
  real home patch was never read.
  **The invariant worth keeping: inserted rows ARE writable.** A row is editable
  through the form only when it is an `insert:` in the profile patch document
  (`insert: [{ id: jev, … }]`) — exactly how `cordis.patch.yml` installs this
  plugin in a real profile. A row that exists only in the leaf configuration
  cannot be edited through the form, which is a real product-shaped constraint,
  not a test artefact. task-4 owns this analysis; I record it as their finding.
* Failure 4 (the `assess` TypeError) was a **second, unrelated defect**: a mount
  race, fixed with `await ctx.loader.await()` plus an explicit harness check.

I did not verify task-4's layer analysis or its three-way run myself; they are
recorded as **task-4's evidence**, while the hermeticity gap, the `stubEnv` lines
and the flapping runs above are my own executed observations. task-5 must not
edit that file.

### 2.2 Final result — certified green, twice consecutively, with hermeticity proven

`settings-section.spec.ts` was first migrated (62 collected, 4 failing — §2.1),
then briefly green but **without** any home isolation, then corrected. My own
final verification, run twice back to back **[executed, `t5-core-FINAL.log` and
`t5-dshjev-FINAL.log`]**:

```
=== pnpm --filter @buberlo/jev-core test ===
 Test Files  8 passed (8)
      Tests  85 passed (85)

=== pnpm --filter @buberlo/dsh-jev test  (both runs identical, exit 0) ===
 ✓ |dsh-jev| tests/selection-empty-catalog.spec.ts (3 tests)  36ms
 ✓ |dsh-jev| tests/skill-install.spec.ts (3 tests)            87ms
 ✓ |dsh-jev| tests/tool-runtime.spec.ts (10 tests)           152ms
 ✓ |dsh-jev| tests/onprem-support.spec.ts (21 tests)         149ms
 ✓ |dsh-jev| tests/agent-loop.spec.ts (13 tests)             227ms
 ✓ |dsh-jev| tests/settings-section.spec.ts (6 tests)        328ms
 ✓ |dsh-jev| tests/client-card.spec.ts (6 tests)             196ms
 Test Files  7 passed (7)
      Tests  62 passed (62)
```

**Why this green is certifiable and the earlier one was not**
**[observed]**: the spec now isolates its own home — `vi.stubEnv('DSH_HOME', home)`
at `settings-section.spec.ts:96` and `vi.unstubAllEnvs()` at `:39` — so the run no
longer resolves the machine's ambient DSH home.

**Hermeticity proof — I re-ran all three legs myself, independently of task-4**
**[executed, `t5-RECONF-ambient.log` and the transcript below]**. The resolved
live home on this machine is
`C:\Users\BananaPeel\AppData\Roaming\in.dsh-plug.dsh-launcher\homes\standard-2`:

| Ambient `DSH_HOME` | Settings spec result |
| --- | --- |
| ambient launcher home (`…\homes\standard-2`) | `1 file / 6 passed` (and the full suite `62 passed`) |
| decoy, nonexistent (`%TEMP%\jev-t5-decoy-dsh-home-abc123`) | `1 file / 6 passed` |
| **unset** (so `~/.dsh` would be the fallback) | `1 file / 6 passed` |

plus, from the decoy leg: **the decoy directory was never created** (`Test-Path` →
`False` after the run) and the live home's `cordis.patch.yml` hash was
**byte-identical before and after** (`37517E5F3DC66819F61F5A7BB8ACE1921282415F10551D2DEFA5C3EB0985B570`
in both cases) — i.e. **nothing under the real home was written**.

task-4 independently ran the same three-way comparison with the same result and
additionally reports that only two roots are ever resolved, both temp
(`profileContext.dir/.patchPath` as the sole writable target and
`profileContext.home` as the home-patch layer). I record that last detail as
**task-4's evidence**; the three-leg table and the two hash/`Test-Path` checks
above are my own executed measurements.

**Complete delta accounting against the baseline of 85 / 62:**

| Suite | Baseline | Final | Delta | Explanation |
| --- | --- | --- | --- | --- |
| jev-core | 8 files / 85 | 8 files / **85** | **0** | no DSH dependency; no file touched |
| dsh-jev | 7 files / 62 | 7 files / **62** | **0** | 56 task-5 (2 real breaks adapted, §1.3/§3) + 6 task-4 (`settings-section.spec.ts`) |

There is **no unexplained drop and no drop at all** — neither count moved, which
was only achievable by fixing the two genuine breaks rather than by removing
tests: (1) the `tool-result` content block → `role:'tool'` message change in
`agent-loop.spec.ts`, and (2) the `SettingsScope` → `ConfigForm` + dotted-`set` →
`mutate` change in `client-card.spec.ts`.

---

## 3. Change log — every changed line

`git diff --stat packages/dsh-jev/tests` **[executed, final]**:

```
 packages/dsh-jev/tests/agent-loop.spec.ts  |  10 +--
 packages/dsh-jev/tests/client-card.spec.ts | 140 +++++++++++++++++++++--------
 2 files changed, 106 insertions(+), 44 deletions(-)
```

No other test, helper, config, or bench file was modified by this task.

### 3.1 `packages/dsh-jev/tests/agent-loop.spec.ts` — the only runtime-failing fix

| Item | Value |
| --- | --- |
| Location | `toolFailureTexts()`, now lines **105–115** (was 105–115) |
| Before | `for (const block of message.content) { if (block.type === 'tool-result' && block.isError === true) { for (const inner of block.content) if (inner.type === 'text') texts.push(inner.text) } }` |
| After | `if (message.role !== 'tool' || message.isError !== true) continue` then `for (const block of message.content) if (block.type === 'text') texts.push(block.text)` |
| WHY 0.1.7-rc.2 | `dsh-llm/lib/types/types.d.ts:114–122` (no `tool-result` in `ContentBlockMap`) and `dsh-llm/lib/types/message.d.ts:152–160` (`ToolResultMessage { role: 'tool'; isError?: boolean }`). |
| IMPACT | **Test-only; no coverage change — coverage strictly improves** (see below). Runtime assertions are untouched. |
| Verified | `pnpm --filter @buberlo/dsh-jev test`: `agent-loop.spec.ts (13 tests)` ✓. |

**What each affected test now proves — unchanged, both still prove the same
thing:**

* `enforce + ask assessment without an approval answerer fails closed and never
  runs the tool` (`:150`) — still proves the tool never executed (`:155`), the
  ask was counted (`:156`) and **an error tool-result carrying `[jev]` reached
  the model** (`:157–159`). The reader now follows the real 0.1.7-rc.2 message
  shape instead of a removed block tag; the assertion text is byte-identical.
* `keeps two parallel sessions isolated` (`:256`) — still proves agent-1's third
  identical `read_file` is denied with the `identical read_file` text
  (`:286`), that agent-2's identical call still executes (3 executions, `:288`),
  and `stats.loopDenials === 1` (`:289`). Assertions byte-identical.
* **Coverage note (in the strengthening direction):** the old helper matched
  nothing on 0.1.7-rc.2. That made the *other* consumer,
  `enforce + allow assessment runs the tool unchanged` at `:191`
  (`expect(toolFailureTexts(agent)).toEqual([])`), **vacuously true** — it could
  not have failed. With the corrected reader it is a real negative assertion
  again. This is a coverage *gain*, not a loss.

### 3.2 `packages/dsh-jev/tests/client-card.spec.ts` — the client settings API was re-shaped

This file **passed before the migration and passes after (6/6)**. Two distinct
0.1.7-rc.2 changes forced work, and neither is a type-level nicety:

1. the client settings read/write face was renamed (`SettingsScope` →
   `ConfigForm`), and
2. the write contract changed for real: `set(field)` addresses **one** path
   segment, so the old dotted `set('skills.enabled', true)` no longer writes the
   nested field — task-4 therefore routes **every** write through `mutate` with
   an explicit path, and my assertions had to follow.

The repo's `tsconfig.json` / `tsconfig.client.json` include only `src/**`, so a
stale type import in `tests/` is invisible to `pnpm typecheck`; that is why the
rename had to be fixed explicitly rather than left to the gate.

| # | Location (now) | Before → After | WHY 0.1.7-rc.2 (installed declaration) | IMPACT |
| --- | --- | --- | --- | --- |
| 1 | `:5–11` | header note `dsh-client-test-runtime@0.1.6-alpha.2` → `@0.1.7-rc.2`; "cannot be loaded … at this version" → "still cannot be loaded" | §5 — the limitation persists, now executed against 0.1.7-rc.2 | documentation accuracy |
| 2 | `:18–22` | added 4-line rationale comment; `import type { SettingsScope, SettingsScopeSnapshot }` → `import type { ConfigForm, ConfigFormSnapshot }` | `dsh-client-ui-settings/lib/types/client/index.d.ts:5` now exports exactly `ConfigForm, ConfigFormSnapshot`; `SettingsScope`/`SettingsScopeSnapshot` are gone | test-only |
| 3 | `:29` | `RegisteredCard.options` gains `inject?: () => unknown` | `apply()` now delivers the card face through the registration hook: `src/client/index.tsx:60–65` | test-only |
| 4 | `:33–34` | added `type JevWriteOps = Parameters<ConfigForm<JevSettings>['mutate']>[0]` | `config-form-types.d.ts:55`; avoids importing `SettingsPathOpView` from `@deepseek-ai/dsh-api-remotes`, which is **not installed** (§4) | test-only |
| 5 | `:36–67` | added `writeAtPath` / `removeAtPath` | the real `set` semantics, documented as "`set` writes the value at the path, **creating intermediate objects**; `unset` removes it" (`dsh-settings/lib/types/types.d.ts:42–54`) | test-only |
| 6 | `:81–84` | `fakeScope` returns `{ scope, mutate }` instead of `{ scope, set }` | the controller no longer calls `set`; it calls `mutate` (`src/client/jev-card-controller.ts:93–97`) | test-only |
| 7 | `:85` | `SettingsScopeSnapshot<JevSettings>` → `ConfigFormSnapshot<JevSettings>` | `config-form-types.d.ts:6–32` — shape unchanged, name replaced | test-only |
| 8 | `:94–107` | `mutate: async () => {}` → a `vi.fn` that **applies** the real path ops to the snapshot and returns `true` | `config-form-types.d.ts:55` `mutate(ops, expectedRevision?): Promise<boolean>` | test-only |
| 9 | `:113–114` | `set`/`unset` become one-segment delegates to the same write | mirrors the shipped implementation verbatim: `dsh-client-ui-settings/lib/client.js:1152–1170` `set(field, value) { return this.mutate([{ op: "set", path: [field], value }]) }` | test-only |
| 10 | `:120–122` | `fakeClientContext(scope)` with `settingsScope: { bind: () => scope }` → `fakeClientContext(form)` with `configForms: { get: () => form }` | `apply()` now reads `ctx.configForms.get<JevSettings>('jev')` (`src/client/index.tsx:57`); `ctx.settingsScope` no longer exists (`docs/adaptation/01-deps.md:320`) | **required behaviour** — without it `apply()` throws |
| 11 | `:131` | `effect: (callback) => callback()` → `(callback, _label?) => callback()` | `ctx.effect` now takes a label (`src/client/index.tsx:58–59`) | test-only |
| 12 | `:150–152` | **added** `expect(typeof registered[0]?.options.inject).toBe('function')` | the face moved into the registration's `inject` hook | coverage *added* |
| 13 | `:157, :169–170` | `set('mode','enforce')` → `mutate` called with `[{ op:'set', path:['mode'], value:'enforce' }]` **+** `expect(scope.getSnapshot().value?.mode).toBe('enforce')` | `config-form-types.d.ts:65` (`set` = one segment) vs `:55` (`mutate` = path-addressed) | coverage *added* (effect) |
| 14 | `:174, :189–192` | `set('skills.enabled', true)` → `mutate` called with `[{ op:'set', path:['skills','enabled'], value:true }]` **+** `expect(scope.getSnapshot().value?.skills?.enabled).toBe(true)` | **the defect the Lead flagged**: a dotted single-segment write lands as a literal top-level `"skills.enabled"` key | coverage *added* (op + effect) |
| 15 | `:196, :206–207, :216` | `set('provider','live')` / `set('apiKey','ts-test-key')` → the exact `mutate` ops (`path:['provider']`, `path:['apiKey']`) + a provider effect assertion | `config-form-types.d.ts:55` | coverage *added* (effect) |
| 16 | `:233, :244–246` | unavailable scope: `SettingsScope<…>` → `ConfigForm<…>`; `mutate/set/unset: async () => {}` → `… => false` | `false` is the contract's "refused" answer (`config-form-types.d.ts:52,62,70`), correct for a non-writable namespace | test-only |

**The double is now a faithful implementation of the real contract, and it is
deliberately strict** **[executed: `dsh-client-ui-settings/lib/client.js:1152–1170`]**:

```js
1152:  set(field, value) { return this.mutate([{ op: "set", path: [field], value }]); }
1165:  unset(field)      { return this.mutate([{ op: "unset", path: [field] }]); }
```

`set` is **not** dotted-tolerant. A controller that regressed to
`set('skills.enabled', true)` would write a literal top-level `"skills.enabled"`
key, and both the op assertion and the snapshot-effect assertion above would
fail. **Deliberately making the double strict, rather than making it tolerate the
old dotted call, is what turns this file into a detector for the migration
instead of a test that passes either way.** Confirmed against the real controller
**[executed]**: `tests/client-card.spec.ts (6 tests)` ✓.

**What each test proves — unchanged, plus more.** All 6 still drive the real
`client.apply()`, the real `JevCardController` and the real `JevCard` component:
slot registration under `plugins.bundle.config`; a mode write; a feature toggle; a
provider switch and a write-only API key (including the DOM never retaining the
key); the one-line summary; and the unavailable state with no controls. Four
write assertions moved from call-recording on the removed `set(field, …)` to the
real `mutate` ops plus the observed effect, and one assertion was added for the
new `inject` face — **net: strictly more assertions, none removed or relaxed**.
Verified **[executed]**: `client-card.spec.ts (6 tests)` ✓ in both the pre-config
-fix run and the final run, and an isolated `tsc` on this file alone is
**EXIT 0**.

### 3.3 Files I deliberately did NOT change

| File | Why unchanged |
| --- | --- |
| `packages/dsh-jev/vitest.config.ts` | **No change required.** Both suites collect and run; the only collection failure is a missing package (F2), not a resolver/config gap. `testTimeout: 20000` still suffices (longest suite 257 ms). |
| `packages/jev-core/vitest.config.ts` | **No change required.** `8 files / 85 tests passed` unchanged. |
| `packages/jev-core/tests/**` (8 files) | **No change required by 0.1.7-rc.2** — the package has no `@deepseek-ai/*` dependency and all 85 tests pass in the final run. Zero content changes. |
| `packages/dsh-jev/bench/compare.ts` | **No change required.** Runs green end-to-end (§6). |
| `packages/dsh-jev/tests/helpers/scripted-adapter.ts` | **No change required.** It uses `LlmAdapter`/`StreamChunk`/`ToolCallId`, all source-compatible at 0.1.7-rc.2; still fully deterministic (per-session cursor replay). |
| `packages/dsh-jev/tests/tool-runtime.spec.ts` (10) | passes as-is. Its `isError` assertions read the **tool-runtime result object**, a different API that did not change. |
| `packages/dsh-jev/tests/onprem-support.spec.ts` (21) | passes as-is (7 `it` + one 15-case `it.each`). |
| `packages/dsh-jev/tests/selection-empty-catalog.spec.ts` (3) | passes as-is. |
| `packages/dsh-jev/tests/skill-install.spec.ts` (3) | passes as-is. |
| `packages/dsh-jev/tests/settings-section.spec.ts` | **Out of scope — task-4 owns it.** Never opened for edit. |
| `packages/dsh-jev/src/**`, any `package.json`, `pnpm-lock.yaml`, other docs | **Out of scope** by task instruction. |

### 3.4 Cross-check requested by the Lead: removed message sources / assembler

The Lead flagged `MessageSourceMap['plugin']` removal, `createSystemMessage(text,
plugin)` → `(text)`, and `BlockAssembler.message` requiring a source. **[executed]**
grep over `packages/dsh-jev` for `kind: 'plugin'`, `createSystemMessage`,
`BlockAssembler`, `.message(`, `source:`:

| Location | Hit | Action |
| --- | --- | --- |
| `tests/agent-loop.spec.ts:100` | `source: { kind: 'user' }` | none — unchanged API |
| `tests/skill-install.spec.ts:102, :120` | `source: { kind: 'user' }` | none |
| `bench/compare.ts:154` | `source: { kind: 'user' }` | none |
| `src/adapters/pre-step.ts:236` | `source: { kind: 'plugin', … }` | **host-adapt's file (task-3)** — not mine |
| any test/bench file | `createSystemMessage` / `BlockAssembler` | **no callers at all** |

**No test or benchmark file in my scope used a removed message source or the
changed assembler/constructor signatures, so no change was required there.** The
only `kind: 'plugin'` in the repo is the one host-adapt already owns.

Cross-check on the harness: `@deepseek-ai/dsh-agent-loop-testkit@0.1.7-rc.2`
declarations are byte-identical to 0.1.6-alpha.2 (per
`docs/upstream-delta-0.1.7-rc.2.md`), and my files mount it unchanged —
`mountAgentLoopTestDependencies` / `mountAgentLoopTestHarness` /
`AgentLoopTestHarness` all compile and run as before. Consistent.

### 3.5 Prohibited patterns — verified absent **[executed]**

`grep -E "as any|@ts-ignore|@ts-expect-error|\.skip\(|describe\.skip|it\.skip|it\.todo|\.todo\("`
over `packages/dsh-jev/tests`: **No matches.** No assertion was replaced by a
truthiness check, no test was deleted, and the two assertion counts per file are
unchanged (13 / 6 / 21 / 3 / 3 / 10 = 56).

---

## 4. Residual findings for the Lead (NOT failures of this task)

1. **RESOLVED — `tests/client-card.spec.ts` was coupled to task-4's client
   migration and is now migrated with it (6/6 green).** task-4's final
   controller takes `ConfigForm<JevSettings>` and routes every write through
   `mutate`, matching what §3.2 now asserts. The hazard was real and is now
   covered by a test rather than a comment:

   ```js
   // shipped implementation, @deepseek-ai/dsh-client-ui-settings/lib/client.js
   1152:  set(field, value) {
   1153:    return this.mutate([{
   1154:      op: "set",
   1155:      path: [field],      // ← ONE segment; a dotted field becomes a literal key
   1156:      value
   1157:    }]);
   1158:  }
   1165:  unset(field) { … path: [field] … }
   ```

   `SettingsPathOpView = { op:'set'; path:string[]; value:JsonValue } | { op:'unset'; path:string[] }`
   at `dsh-settings/lib/types/types.d.ts:47–54`; task-4's controller at
   `src/client/jev-card-controller.ts:93–97` sends `field.split('.')` as the
   `path`, and my assertions pin that exact nested path, so a regression to a
   dotted single-segment write fails loudly.
2. **Finding for task-4 / the Lead: the op objects are not actually
   type-checked, because `@deepseek-ai/dsh-api-remotes` is not installed.**
   `config-form-types.d.ts:4` imports `SettingsPathOpView` from
   `@deepseek-ai/dsh-api-remotes/client`, and that package is absent from this
   workspace **[executed]**: no `@deepseek-ai+dsh-api-remotes*` entry in
   `node_modules/.pnpm`, and `packages/dsh-jev/node_modules/@deepseek-ai/dsh-api-remotes`
   does not exist. It is a peer of `dsh-client-ui-settings`, not a dependency in
   `packages/dsh-jev/package.json`.

   **Proven with a throwaway probe** (written to `tests/_t5_probe.ts`, run, then
   deleted — the tests directory is clean again):

   ```ts
   import type { ConfigForm } from '@deepseek-ai/dsh-client-ui-settings/client'
   declare const form: ConfigForm<{ mode?: string }>
   export async function probe(): Promise<boolean> {
     return form.mutate([{ op: 'typo', path: 42, value: Symbol('x') }])   // deliberately bogus
   }
   ```

   **BEFORE — `@deepseek-ai/dsh-api-remotes` absent (my first run) [executed]:**

   ```
   $ tsc --noEmit --strict --skipLibCheck …  tests/_t5_probe.ts   → EXIT 0   ❌ bogus ops COMPILE
   $ tsc --noEmit --strict                …  tests/_t5_probe.ts   → EXIT 2
     config-form-types.d.ts(4,41): error TS2307: Cannot find module
       '@deepseek-ai/dsh-api-remotes/client' or its corresponding type declarations.
   ```

   So with the repo's `skipLibCheck: true` (`tsconfig.base.json`) the unresolved
   import degraded to `any` and **`ConfigForm.mutate`'s parameter was effectively
   untyped** — `{ op: 'typo', path: 42, value: Symbol('x') }` compiled.

   **AFTER — task-4 added `@deepseek-ai/dsh-api-remotes@0.1.7-rc.2` as an
   exact devDependency (`packages/dsh-jev/package.json:86`); I re-ran the same
   probe myself [executed]:**

   ```
   $ tsc --noEmit --strict --skipLibCheck …  tests/_t5_probe.ts   → EXIT 2   ✅ bogus ops REJECTED
   tests/_t5_probe.ts(8,25): error TS2322: Type '"typo"' is not assignable to type '"set" | "unset"'.
   tests/_t5_probe.ts(8,37): error TS2322: Type 'number' is not assignable to type 'string[]'.
   tests/_t5_probe.ts(8,47): error TS2322: Type 'symbol' is not assignable to type 'JsonValue'.
   ```

   The hole is **closed**, and all three failures are the three genuinely wrong
   parts of the op. I then re-typechecked my own migrated `client-card.spec.ts`
   against the now-**resolved** `SettingsPathOpView` union: it is **clean
   (EXIT 0 for that file)** — so the strict double type-checks against the real
   type rather than inheriting `any`. Only the two pre-existing `agent-loop`
   errors (§4.3) remain there.

   **This matters for the guard's independence:** before, the strict double was
   the *only* thing that could catch a malformed write op. Now the compiler
   catches a malformed op too, and the double independently catches a *correctly
   typed but wrongly addressed* write (a dotted `set('skills.enabled', …)`) that
   the compiler cannot see. Both guards are kept.

   I did **not** fix the manifest gap myself (package.json is task-4's file); I
   reported it and task-4 closed it.
3. **Pre-existing (NOT upgrade-caused) type friction in `tests/`, invisible to
   the gate.** Verified by typechecking byte-identical HEAD copies against the
   installed 0.1.7-rc.2 types — the same errors appear, and the relevant
   declaration files are **byte-identical** between the two versions:

   | Location | Error | Verdict |
   | --- | --- | --- |
   | `agent-loop.spec.ts:210` | TS2352 `JevProvider` cast to `{ callCount: number }` | pre-existing (identical on HEAD); not upgrade-caused |
   | `agent-loop.spec.ts:347` | TS2345 `ctx.skills.register(...)` missing `source` | pre-existing: `dsh-skill/lib/types/index.d.ts` is byte-identical at 0.1.6-alpha.2 and 0.1.7-rc.2 (sha256 `F99F26DD…7FAB`), and `SkillSummary.source` is required in **both** |
   | `client-card.spec.ts:18` (was) | TS2305 `SettingsScope`/`SettingsScopeSnapshot` | **upgrade-caused — fixed in §3.2** |
   | `onprem-support.spec.ts:19,126`, `selection-empty-catalog.spec.ts:119` | TS5097 / TS18046 / TS2352 | pre-existing (identical on HEAD); `:19` is also an artifact of my ad-hoc `tsc` flags (the repo sets `allowImportingTsExtensions`) |

   I fixed only the upgrade-caused row; touching the others would be a change
   the upgrade does not require. All of them are outside the repo's own
   `tsc` gate, which compiles `src/**` only.

---

## 5. Can `@deepseek-ai/dsh-client-test-runtime@0.1.7-rc.2` be loaded from npm?

**NO. The limitation persists, and it now has a second, independently verified
cause.** All of this is **[executed]** unless marked.

**(a) Direct load attempt fails.** From `packages/dsh-jev`:

```
$ node --input-type=module -e "import('@deepseek-ai/dsh-client-test-runtime')…"
IMPORT FAILED
name: Error
code: ERR_MODULE_NOT_FOUND
message: Cannot find module 'D:\...\.pnpm\@deepseek-ai+dsh-client-tes_6f730996...\node_modules\
  @deepseek-ai\dsh-client-ui-renderer\src\client\bind.ts'
  imported from ...\@deepseek-ai\dsh-client-test-runtime\lib\index.js
```

The installed package is `version: 0.1.7-rc.2` **[observed]** and its emitted
`lib/index.js` **[observed]** begins:

```js
 1: import { Context, Inject } from "@deepseek-ai/cordis";
 4: import { SlotRegistry } from "@deepseek-ai/dsh-client-ui-renderer/client";
 5: import { bindSnapshotSelector as bindSnapshotSelector$1 } from "@deepseek-ai/dsh-client-ui-renderer/src/client/bind.ts";
 6: import { createSlotRenderer as createSlotRenderer$1 } from "@deepseek-ai/dsh-client-ui-renderer/src/client/scoped-slots.tsx";
12: import { scopeIdentityOf } from "@deepseek-ai/dsh-api-session-controller/src/client/scope.ts";
```

**(b) The concrete tarball reason (cause 1).** The *published*
`@deepseek-ai/dsh-client-ui-renderer@0.1.7-rc.2` directory in the store contains
only `lib/ node_modules/ LICENSE package.json README*` — **no `src/` at all**
**[executed: `Test-Path …\src` → `False`]** — because its `package.json` ships
`"files": ["lib/index.js","lib/invariant.js","lib/client.js","lib/types/**/*.d.ts"]`,
yet it advertises an `exports` subpath `"./src/*": "./src/*"` pointing at files
the tarball never contains. The resolving subpath fails on its own too:

```
$ node --input-type=module -e "import('@deepseek-ai/dsh-client-ui-renderer/src/client/bind.ts')…"
renderer subpath: ERR_MODULE_NOT_FOUND
```

**(c) The concrete tarball reason (cause 2 — new; this CLOSES the item that
`docs/upstream-delta-0.1.7-rc.2.md` marked "not verified" — see that file's
§10 item 3 at lines 746–776 and its §8(a) `api-session-controller` bullet at
lines 605–613; the earlier 595–597 pointer was from an earlier revision of that
document).**
Line 12 imports `@deepseek-ai/dsh-api-session-controller/src/client/scope.ts`.
That package is a **declared peer** of the test runtime
\[`dsh-client-test-runtime/package.json:37`: `"@deepseek-ai/dsh-api-session-controller": "0.1.7-rc.2"`\].
Two independent facts, both **[executed]**:

1. It is **not installed anywhere in this workspace** — `node_modules/.pnpm` has
   **no** `@deepseek-ai+dsh-api-session-controller*` entry, and the test
   runtime's own nested `node_modules` holds only `.bin`.
2. Decisively, the **published tarball does not ship `src/` either**. Inspected
   in the real 0.1.7-rc.2 product install
   (`%APPDATA%\in.dsh-plug.dsh-launcher\versions\0.1.7-rc.2\node_modules\.pnpm\node_modules\@deepseek-ai\dsh-api-session-controller`):
   `version: 0.1.7-rc.2`, **`src/` → `False`**, **`src/client/scope.ts` → `False`**,
   with
   `files: ["lib/index.js","lib/client.js","lib/types/**/*.js","lib/types/**/*.d.ts","lib/typert.host.js","lib/typert.host.d.ts","lib/typert.remote-client.js","lib/typert.remote-client.d.ts"]`
   — while its `exports` still advertises `"./src/*": "./src/*"`.

So `lib/index.js:12` is unsatisfiable for the same reason as `:5–6`: **both**
of the test runtime's `src/` imports are published-nowhere paths. Cause 1 and
cause 2 are the same packaging defect in two different packages. Even if the
renderer shipped `src/`, line 12 would still fail.

**(d) Even with both defects fixed, adopting it is not a one-line change.** The
test runtime declares **23 `peerDependencies`** (all `@deepseek-ai/dsh-*@0.1.7-rc.2`
plus `react`/`react-dom`) and the repo's `packages/dsh-jev/package.json` supplies
only a handful of them: `dsh-client-store`, `dsh-client-ui-chat`,
`dsh-client-ui-conversation`, `dsh-client-ui-session`, `dsh-typert-protocol`,
`dsh-api-session-controller` and `react-dom` are all absent. Adding them is a
dependency decision for the Lead, not a test fix.

**Verdict.** The limitation recorded in `docs/upstream-compatibility.md:115–121`
**still stands at 0.1.7-rc.2**. I therefore did **not** enable the real slot
bench, and `client-card.spec.ts` keeps exercising the same layers directly
(`apply()` against a recording fake context + the real component/controller),
which is what it already proved before the upgrade. No coverage was claimed that
was not executed. `docs/upstream-delta-0.1.7-rc.2.md` §8(a) reaches the same
conclusion from the tarball; this section adds the executed import failure, the
absent `src/` directories, and the missing peer (cause 2).

---

## 6. `bench:compare` verdict

`pnpm bench:compare` **runs green, exit 0**, 25 runs/variant, no change required.
Run twice — before and after the whole adaptation landed — with identical
functional output **[executed, `t5-bench.log` and `t5-bench-final.log`]**. Final
run verbatim:

```
=== deterministic harness comparison (scripted model, 25 runs/variant) ===
A base (no jev)            wall(ms) mean=3 p50=2 min=2 max=14 | tools=2,180 B | modelReq=2 | toolRuns=1 | select=0 assess=0 | ask=0 hold=0 deny=0 restrict=0
B jev mock shadow          wall(ms) mean=4 p50=4 min=3 max=12 | tools=2,180 B | modelReq=2 | toolRuns=1 | select=2 assess=1 | ask=0 hold=0 deny=0 restrict=0
C jev mock enforce         wall(ms) mean=4 p50=3 min=3 max=6  | tools=1,279 B | modelReq=2 | toolRuns=1 | select=2 assess=1 | ask=0 hold=0 deny=0 restrict=2
C2 mock enforce + hold     wall(ms) mean=3 p50=3 min=3 max=7  | tools=1,279 B | modelReq=2 | toolRuns=0 | select=2 assess=1 | ask=1 hold=0 deny=0 restrict=2
D jev live shadow            NOT EXECUTED (TYPESAFE_API_KEY not set)

reading:
- enforce turn delta vs base: +1 ms (mock Jev ≈ 0; the rest is enforcement bookkeeping)
- tool schemas sent: base 2,180 B vs enforce 1,279 B (selection narrowed the visible set)
- with a hold assessment, tool executions: base 1 vs gated 0
artifact: packages/dsh-jev/bench/results/deterministic-2026-09-26T17-10-13-532Z.json
```

**Every functional column is identical to the pre-upgrade record in
`docs/benchmark.md:169–172`** — `tools` 2,180 B / **1,279 B**, `toolRuns`
1 / 1 / 0, `select=2 assess=1`, `restrict=2`, `ask=1` — and every functional
column is also identical between my two runs. The only differences are
wall-clock (`mean` 3–4 ms now vs `2 ms` recorded) on a 3 ms measurement — a
1–2 ms scheduling/GC artefact with **no functional delta**; I do not claim the
harness got slower. The `live` variant is correctly skipped without a key, and
the artifact path is `.gitignore`d (`.gitignore:13`) **[executed:
`git check-ignore` exit 0]**.

---

## 7. Reproduction

```sh
pnpm --filter @buberlo/jev-core test        # 8 files / 85 passed
pnpm --filter @buberlo/dsh-jev test         # 6 files / 56 passed (settings-section blocked by task-4)
pnpm bench:compare                          # exit 0, 4 offline variants
node --input-type=module -e "import('@deepseek-ai/dsh-client-test-runtime').catch(e=>console.log(e.code,e.message))"
```

`pnpm --filter @buberlo/dsh-jev test` will report a **collection failure** for
`tests/settings-section.spec.ts` until task-4 removes
`@deepseek-ai/dsh-settings-file` (F2). That is expected and is not this task's
failure; the 62 total is restored by 56 (mine) + 6 (task-4's).

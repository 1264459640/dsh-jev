# 01 — Dependency adaptation: DSH 0.1.6-alpha.2 → 0.1.7-rc.2

Task: `task-1` (owner `dep-upgrade`). This document is the hand-off for every
code-adaptation task: it records the verified baseline, every pin change with
evidence, the install verdict, and the **complete post-bump build error
inventory** quoted verbatim.

Every claim is marked **[executed]** (a command was run and this is its literal
observed outcome) or **[inferred]** (a conclusion drawn from registry metadata
or from files, not from running the thing).

Environment (observed): `node v24.16.0`, `pnpm 12.4.2`, Windows, repo
`D:\dsh-plugins\dsh-jev`. Raw logs are in `%TEMP%\jev-adapt\`.

---

## 1. BASELINE (before any pin change) — [executed], GREEN

Run against the unmodified tree at commit `87e29e2` ("Bump workspace to 0.1.4
(#6)"), `git status --porcelain` empty, `node_modules` absent.

| Step | Command | Result |
| --- | --- | --- |
| Install | `pnpm install --frozen-lockfile` | **exit 0**. `Lockfile is up to date, resolution step is skipped`; `+231` packages added. `packages/jev-core prepare` → `tsc -p tsconfig.json` Done. `packages/dsh-jev prepare` → `tsc` + `tsc -p tsconfig.client.json` + `tsdown` (`lib/client.js` 16.32 kB) Done. `Done in 1m 30.5s using pnpm v12.4.2`. |
| Build | `pnpm build` | **exit 0**. `tsc -p tsconfig.json` (jev-core) and `tsc -p tsconfig.json && tsc -p tsconfig.client.json && tsdown` (dsh-jev). Zero diagnostics. |
| Test | `pnpm test` | **exit 0**. `packages/jev-core`: **8 files / 85 tests passed** (884 ms). `packages/dsh-jev`: **7 files / 62 tests passed** (1.86 s). Two non-fatal React `borderColor`/`border` shorthand warnings in `tests/client-card.spec.ts` — pre-existing, not errors. |

Baseline verdict: **green on all three gates.** Any post-bump breakage below is
therefore attributable to the pin change, not to a pre-existing condition.

Logs: `baseline-install.log`, `baseline-build.log`, `baseline-test.log`.

---

## 2. Pin changes

> **Note on §2.2 — superseded by a Lead decision.** An earlier revision of this
> document argued that `@deepseek-ai/dsh-settings-file` "must" be held at
> `0.1.6-alpha.2` and that the acceptance criterion "no `0.1.6-alpha.2` anywhere"
> was therefore unsatisfiable. The Lead did not accept that: the dependency was
> **removed outright**. §2.2 below now records the removal, not a hold. The
> evidence for *why* no `0.1.7-rc.2` pin existed is retained verbatim, because it
> is the justification for removing rather than holding the package. The line
> numbers in this section were re-verified against the final tree.

### 2.1 Changed

`packages/dsh-jev/package.json`

| Line | Field | Before | After |
| --- | --- | --- | --- |
| 54 | `dependencies["@deepseek-ai/schemastery"]` | `3.18.2` | `3.18.4` |
| 57 | `peerDependencies["@deepseek-ai/cordis"]` | `^4.0.2` | `~4.0.4` — see note below |
| 58–63 | `peerDependencies` dsh-agent, dsh-llm, dsh-session, dsh-skill, dsh-tools, dsh-user-approval | `^0.1.6-alpha.2` | `^0.1.7-rc.2` |
| 66 | `devDependencies["@deepseek-ai/cordis"]` | `4.0.2` | `4.0.4` |
| 67–76 | `devDependencies` dsh-agent, dsh-agent-loop, dsh-agent-loop-testkit, dsh-llm, dsh-scope, dsh-session, dsh-session-projection, dsh-skill, dsh-system-prompt, dsh-tools | `0.1.6-alpha.2` | `0.1.7-rc.2` |
| 77 | `devDependencies["@deepseek-ai/schemastery"]` | `3.18.2` | `3.18.4` |
| 80–82 | `devDependencies` dsh-user-approval, dsh-skill-filesystem, dsh-settings | `0.1.6-alpha.2` | `0.1.7-rc.2` |
| 87–92 | `devDependencies` dsh-client-ui-settings, dsh-client-ui-plugin-manager, dsh-client-ui-slots, dsh-client-locale, dsh-client-ui-renderer, dsh-client-test-runtime | `0.1.6-alpha.2` | `0.1.7-rc.2` |

**Cordis peer range `~4.0.4`, not `^4.0.4`.** This is a Lead decision, applied
after the bump. The original bump kept the caret form (`^4.0.2` → `^4.0.4`) per
the task brief. The Lead's stated reason for narrowing it: every `0.1.7-rc.2`
package peers `@deepseek-ai/cordis` as `~4.0.4`, and a plugin must not advertise
a wider compatibility range than the upstream it builds against. [executed —
sampled] That peer range is directly confirmed for the 0.1.7-rc.2 product root:
`%APPDATA%\in.dsh-plug.dsh-launcher\versions\0.1.7-rc.2\node_modules\@deepseek-ai\dsh\package.json`
declares `"@deepseek-ai/cordis": "~4.0.4"`. The `devDependencies` cordis entry
stays an exact `4.0.4` pin.

Also present in the final file but **not** part of this dependency bump: four
`devDependencies` added later by the settings-migration work —
`@deepseek-ai/dsh-app-boot` (L83), `@deepseek-ai/dsh-config-editor` (L84),
`@deepseek-ai/cordis-plugin-loader` `1.0.5` (L85) and
`@deepseek-ai/dsh-api-remotes` (L86), all `0.1.7-rc.2` bar the loader. They are
recorded here only so the line numbers reconcile; see §2.2 for the removal of
`dsh-settings-file`.

`examples/coding/package.json`

| Line | Field | Before | After |
| --- | --- | --- | --- |
| 16 | `devDependencies["@deepseek-ai/cordis"]` | `4.0.2` | `4.0.4` |
| 17–19 | `devDependencies` dsh-scope, dsh-system-prompt, dsh-tools | `0.1.6-alpha.2` | `0.1.7-rc.2` |
| 22–23 | `devDependencies` dsh-agent, dsh-llm | `0.1.6-alpha.2` | `0.1.7-rc.2` |

**Unchanged and why**

- `packages/jev-core/package.json` — carries **no** `@deepseek-ai/*` dependency
  at all (only `@typesafe-ai/sdk@0.6.0`, typescript, vitest). The task note
  "schemastery 3.18.2 → 3.18.4 in both packages" therefore has a single
  applicable site, `packages/dsh-jev/package.json`. [executed: grep over all
  `*.json`]
- `examples/ops-readonly/package.json`, `examples/standalone-game/package.json`,
  root `package.json`, `pnpm-workspace.yaml` — no `@deepseek-ai/*` pins, no change.

### 2.2 `@deepseek-ai/dsh-settings-file` — REMOVED (Lead decision)

**Outcome:** the `devDependencies` entry for `@deepseek-ai/dsh-settings-file` was
**deleted** from `packages/dsh-jev/package.json` — it is not held and not bumped.
It no longer appears in any `package.json` or in `pnpm-lock.yaml`.

**Why no pin was possible (retained as the justification for removal).**
[executed] Bumping it to `0.1.7-rc.2` fails outright:

```
Error: ERR_PNPM_NO_MATCHING_VERSION

  × installing dependencies
  ╰─▶ Failed to resolve dependency tree: No matching version found for
      @deepseek-ai/dsh-settings-file@0.1.7-rc.2 while fetching it from
      https://registry.npmjs.org/
  help: The latest release of @deepseek-ai/dsh-settings-file is "0.0.1-rc.3".
        Other releases are:
          * alpha: 0.1.6-alpha.2
          * next: 0.1.5-rc.3
```

[executed] The full published version list is `0.0.1-rc.*`, `0.1.5-alpha.1`,
`0.1.5-alpha.2`, `0.1.5-rc.1`, `0.1.5-rc.2`, `0.1.5-rc.3`, `0.1.6-alpha.1`,
`0.1.6-alpha.2`. There is **no `0.1.7*`** version, and its `latest` dist-tag sits
at `0.0.1-rc.3`. [inferred] Upstream had de-prioritised the package.

**Why removal, not a hold.** A hold at `0.1.6-alpha.2` would have been the only
other option, but it would have kept alive a package the 0.1.7-rc.2 product no
longer uses. Three independent signals say the row was abandoned upstream:

1. the registry publishes no `0.1.7-rc.2` (above);
2. [executed] the real 0.1.7-rc.2 product tree at
   `%APPDATA%\in.dsh-plug.dsh-launcher\versions\0.1.7-rc.2` contains
   `@deepseek-ai/dsh-settings-file` **zero times**; and
3. the upstream `dsh-base` package dropped the row.

Holding it also had a live cost: [executed] the package declared a transitive
`"@deepseek-ai/dsh-util-values": "^0.1.6-alpha.2"`, which resolved to
`@deepseek-ai/dsh-util-values@0.1.6-alpha.2` — the **only** residual
`0.1.6-alpha.2` node left in the tree — dragging a stale alpha into the test
tree for no functional gain.

**Executed effect** (performed by the Lead, not by this task):

| Command | Observed |
| --- | --- |
| `pnpm install --ignore-scripts` | `Packages: -4` — the package plus three transitives left the tree |
| `pnpm install --frozen-lockfile --ignore-scripts` | **exit 0**, `Lockfile is up to date, resolution step is skipped` |

**Verification of the acceptance criterion.** [executed] A sweep of
`packages/dsh-jev/package.json`, `examples/coding/package.json`,
`packages/jev-core/package.json`, the root `package.json` and `pnpm-lock.yaml`
now finds **0** occurrences of `0.1.6-alpha.2` and **0** occurrences of
`dsh-settings-file`. The criterion "no `0.1.6-alpha.2` string remains in any
package.json or in pnpm-lock.yaml" **IS satisfied.** The earlier claim that it
was unsatisfiable is withdrawn.

**Downstream note.** Removing the file-backed provider also removes it from the
test tree, so `tests/settings-section.spec.ts` (which mounted it) is part of the
settings migration rather than a working path. `AGENTS.md` reflects the current
reality: `test` is "core 85; dsh-jev 56 passing, 6 pending the settings
migration". The baseline figure of 62 dsh-jev tests in §1 is the pre-bump count
and is left unchanged.

### 2.3 Other pinned devDependencies reviewed — none changed

Checked against each package's own registry metadata; none was changed because
no peer/engine break with 0.1.7-rc.2 was found. [executed: registry reads]

| Dependency | Pinned | Registry `latest` | Decision |
| --- | --- | --- | --- |
| `typescript` | `6.0.3` | `7.0.2` | kept — a compiler major inside a compat task would confound attribution |
| `vitest` | `4.1.11` | `5.0.2` | kept — `4.1.11` is the maintained `V4` dist-tag |
| `tsdown` | `0.22.2` | `0.23.0` | kept — no concrete reason found |
| `react` / `@types/react` | `18.3.1` / `18.3.12` | `19.3.0` | kept — client slot API is React 18; a React 19 bump is a separate decision |
| `@testing-library/react` | `16.3.3` | `16.3.3` | already latest |
| `jsdom` | `30.1.0` | `30.1.1` | kept — patch, not required |
| `@types/node` | `26.6.2` | `26.6.3` | kept — patch; `26.6.2` is allow-listed in `pnpm-workspace.yaml` |
| `tsx` | `4.23.13` | `4.23.15` | kept — patch, not required |
| `@typesafe-ai/sdk` | `0.6.0` | not checked | unrelated to DSH; jev-core baseline green |

### 2.4 Evidence for the DSH targets

- [executed] `@deepseek-ai/dsh-tools` dist-tags: `latest=0.0.1-rc.1`,
  `alpha=0.1.7-alpha.2`, `next=0.1.7-rc.2` → `0.1.7-rc.2` is published.
- [executed] The DSH runtime installed on this machine at
  `%APPDATA%\in.dsh-plug.dsh-launcher\versions\0.1.7-rc.2` resolves
  `@deepseek-ai/cordis@4.0.4` and `@deepseek-ai/schemastery@3.18.4` — the
  authority for the two peer bumps.
- [executed] That runtime's own `pnpm-lock.yaml` independently confirms
  `0.1.7-rc.2` for every bumped package (dsh-agent, dsh-agent-loop, dsh-llm,
  dsh-scope, dsh-session, dsh-session-projection, dsh-skill, dsh-system-prompt,
  dsh-tools, dsh-user-approval, dsh-skill-filesystem, dsh-settings,
  dsh-client-ui-settings, dsh-client-ui-plugin-manager, dsh-client-ui-slots,
  dsh-client-locale, dsh-client-ui-renderer) plus `cordis@4.0.4` and
  `schemastery@3.18.4`.
- [executed] `@deepseek-ai/dsh-client-test-runtime` and
  `@deepseek-ai/dsh-agent-loop-testkit` both have `next=0.1.7-rc.2`.

---

## 3. Install and lockfile

### 3.1 Resolution succeeded; only the `prepare` lifecycle failed

[executed] `pnpm install` (no `--frozen-lockfile`) with the final pin set:

```
Scope: all 6 workspace projects
✓ Lockfile passes supply-chain policies
Progress: resolved 94, reused 150, downloaded 61, added 94, done
Packages: +94 -78
packages/jev-core prepare$ tsc -p tsconfig.json
packages/jev-core prepare: Done
packages/dsh-jev prepare$ pnpm run build
packages/dsh-jev prepare: $ tsc -p tsconfig.json && tsc -p tsconfig.client.json && tsdown
packages/dsh-jev prepare: src/adapters/pre-step.ts(236,15): error TS2322: ...
packages/dsh-jev prepare: src/client/jev-card-controller.ts(10,15): error TS2305: ...
packages/dsh-jev prepare: src/settings-section.ts(32,26): error TS2339: ...
packages/dsh-jev prepare: src/settings-section.ts(33,19): error TS7006: ...
packages/dsh-jev prepare: src/settings-section.ts(39,18): error TS7006: ...
packages/dsh-jev prepare: [ELIFECYCLE] Command failed with exit code 2.
packages/dsh-jev prepare: Failed
Error: ERR_PNPM_EXECUTOR_LIFECYCLE_SCRIPT_FAILED

  × installing dependencies
  ╰─▶ D:\dsh-plugins\dsh-jev\packages\dsh-jev prepare: `pnpm run build` exited
      with exit code: 2

INSTALL_EXIT=1
```

**Interpretation.** Dependency **resolution and linking succeeded** (`Packages:
+94 -78`, store populated, `node_modules/.pnpm` holds 326 dirs). The non-zero
exit comes solely from `packages/dsh-jev`'s `prepare` script, which runs
`pnpm run build`; that build fails at section 4 below. The lockfile **was**
written. `packages/jev-core prepare` (the only other prepare) succeeded.

### 3.2 Lockfile self-consistency — PROVEN

[executed] With `prepare` neutralised:

```
pnpm install --frozen-lockfile --ignore-scripts
→ Scope: all 6 workspace projects
  ✓ Lockfile passes supply-chain policies
  Lockfile is up to date, resolution step is skipped
  Done in 27ms using pnpm v12.4.2
  FROZEN_IGNORE_EXIT=0
```

This proves `pnpm-lock.yaml` matches `package.json` exactly. The same command
**without** `--ignore-scripts` reaches the same "Lockfile is up to date" point
and then fails only in `prepare` — i.e. the `frozen-lockfile` gate itself is
clean and the residual failure is the known code task, not a lockfile problem.

> **Caveat for the final gate:** until the section-4 errors are fixed,
> `pnpm install --frozen-lockfile` on a clean checkout still exits non-zero
> because a workspace `prepare` script builds on install. That is expected and
> is the code-adaptation tasks' exit criterion, not a dependency defect.

### 3.3 Lockfile churn summary

| Metric | Baseline (`HEAD`) | After bump |
| --- | --- | --- |
| Entry keys (`  name@version:`) | 556 | 594 |
| File lines | 3764 | 4042 |
| Diff | — | `1277 insertions(+), 999 deletions(-)` (`git diff --stat`) |
| Refs to `0.1.7-rc.2` | 0 | 695 |
| Refs to `0.1.6-alpha.2` | 666 | 10 (all `dsh-settings-file`, §2.2) |
| Workspace packages added/removed by pnpm | — | `+94 -78` |

*The "After bump" column is the bump-time measurement, taken before the §2.2
removal. The removal (`Packages: -4`) changed the final state again: the lockfile
is now **4023 lines** with **0** references to `0.1.6-alpha.2`. The bump-time
figures are retained rather than silently restated.*

---

## 4. Post-bump build error inventory — COMPLETE, VERBATIM

[executed] `pnpm build` from the repo root, exit **1**:

```
$ pnpm -r --sort run build
Scope: 5 of 6 workspace projects
$ tsc -p tsconfig.json
$ tsc -p tsconfig.json && tsc -p tsconfig.client.json && tsdown
src/adapters/pre-step.ts(236,15): error TS2322: Type '"plugin"' is not assignable to type '"model" | "tool" | "user" | "system-prompt" | "model-selection" | "user-approval" | "ptc-mode" | "tool-registry" | "skill-invocation"'.
src/client/jev-card-controller.ts(10,15): error TS2305: Module '"@deepseek-ai/dsh-client-ui-settings/client"' has no exported member 'SettingsScope'.
src/settings-section.ts(32,26): error TS2339: Property 'installSection' does not exist on type 'SettingsForms'.
src/settings-section.ts(33,19): error TS7006: Parameter 'current' implicitly has an 'any' type.
src/settings-section.ts(39,18): error TS7006: Parameter 'value' implicitly has an 'any' type.
[ELIFECYCLE] Command failed with exit code 2.
Error: ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL

  × "pnpm recursive run" failed in D:\dsh-plugins\dsh-jev\packages\dsh-jev

[ELIFECYCLE] Command failed with exit code 1.
BUILD_EXIT=1
```

Because `packages/dsh-jev`'s build is `tsc -p tsconfig.json && tsc -p
tsconfig.client.json && tsdown`, the root run stops at the **second** step and
would otherwise hide client-only diagnostics. [executed] Each step was therefore
also run on its own:

```
$ tsc -p tsconfig.json            # host tsconfig — exit 2
src/adapters/pre-step.ts(236,15): error TS2322: Type '"plugin"' is not assignable to type '"model" | "tool" | "user" | "system-prompt" | "model-selection" | "user-approval" | "ptc-mode" | "tool-registry" | "skill-invocation"'.
src/client/jev-card-controller.ts(10,15): error TS2305: Module '"@deepseek-ai/dsh-client-ui-settings/client"' has no exported member 'SettingsScope'.
src/settings-section.ts(32,26): error TS2339: Property 'installSection' does not exist on type 'SettingsForms'.
src/settings-section.ts(33,19): error TS7006: Parameter 'current' implicitly has an 'any' type.
src/settings-section.ts(39,18): error TS7006: Parameter 'value' implicitly has an 'any' type.

$ tsc -p tsconfig.client.json     # client tsconfig — exit 2
src/client/index.tsx(50,48): error TS2551: Property 'settingsScope' does not exist on type 'Context'. Did you mean 'settingsSchema'?
src/client/jev-card-controller.ts(10,15): error TS2305: Module '"@deepseek-ai/dsh-client-ui-settings/client"' has no exported member 'SettingsScope'.

$ tsdown                          # exit 0
ℹ tsdown v0.22.2 powered by rolldown v1.1.5
ℹ entry: src/client/index.tsx
ℹ lib\client.js      16.32 kB │ gzip: 5.07 kB
ℹ lib\client.js.map  26.34 kB │ gzip: 7.97 kB
✔ Build complete in 18ms
```

### 4.1 Complete distinct error list (6)

Package `@buberlo/jev-core`: **zero errors** — `tsc -p tsconfig.json` exits 0
and emits `lib/*.js` + `lib/*.d.ts`.

Package `@buberlo/dsh-jev` — 6 distinct diagnostics, 3 source files:

| # | File:line:col | Code | Message | Seen in |
| --- | --- | --- | --- | --- |
| 1 | `src/adapters/pre-step.ts:236:15` | TS2322 | `Type '"plugin"' is not assignable to type '"model" \| "tool" \| "user" \| "system-prompt" \| "model-selection" \| "user-approval" \| "ptc-mode" \| "tool-registry" \| "skill-invocation"'` | host tsc |
| 2 | `src/client/jev-card-controller.ts:10:15` | TS2305 | `Module '"@deepseek-ai/dsh-client-ui-settings/client"' has no exported member 'SettingsScope'` | host tsc **and** client tsc |
| 3 | `src/settings-section.ts:32:26` | TS2339 | `Property 'installSection' does not exist on type 'SettingsForms'` | host tsc |
| 4 | `src/settings-section.ts:33:19` | TS7006 | `Parameter 'current' implicitly has an 'any' type` | host tsc |
| 5 | `src/settings-section.ts:39:18` | TS7006 | `Parameter 'value' implicitly has an 'any' type` | host tsc |
| 6 | `src/client/index.tsx:50:48` | TS2551 | `Property 'settingsScope' does not exist on type 'Context'. Did you mean 'settingsSchema'?` | client tsc |

### 4.2 Grouping and first-pass reading of the migration surface

Only two upstream surfaces changed, and both are concentrated in the **settings**
subsystem:

**(a) `dsh-tools` / agent-loop gate vocabulary — 1 error.** Error 1 is a string
union that gained/renamed members. The previous union accepted `"plugin"`; the
0.1.7-rc.2 union is `model | tool | user | system-prompt | model-selection |
user-approval | ptc-mode | tool-registry | skill-invocation`. The author must
find the new spelling for a plugin-originated gate source (possibly
`tool-registry`) and confirm it is the *semantically* correct one; the type
union alone does not prove the replacement. **Owner: the pre-step/adapters task.**

**(b) The `@deepseek-ai/dsh-settings` / `dsh-client-ui-settings` API — 5 errors.**
The whole settings surface was re-shaped:

- `SettingsForms.installSection` no longer exists → `src/settings-section.ts:32`.
  Errors 4 and 5 are direct fall-out: `current` and `value` lost their contextual
  types because the call no longer type-checks.
- `SettingsScope` is no longer exported from
  `@deepseek-ai/dsh-client-ui-settings/client` → `src/client/jev-card-controller.ts:10`.
- `Context.settingsScope` no longer exists; the compiler suggests `settingsSchema`
  → `src/client/index.tsx:50`.

These five are one migration, not five independent fixes: the host registration
and the client accessor must move to the new API together. **Owner: the settings
task.** Errors 3–5 will very likely disappear once 32 is ported; do not treat 4
and 5 as separate work items.

### 4.3 Not yet run / known-blocked

- `pnpm test` was **not** re-run post-bump. [inferred] It cannot pass in a
  meaningful way: `packages/dsh-jev`'s `prepare` never produced valid output and
  `lib/client.js` present on disk is the **pre-existing baseline artifact**
  (`tsdown` alone succeeds and rewrites it, while `tsc` fails). The 62 dsh-jev
  tests exercise the very settings surface that no longer compiles. The real
  post-fix test counts will differ from the baseline 85 + 62 and must be
  re-measured by whichever task makes the build green.
- `pnpm verify`, `pnpm evals`, `pnpm test:packaging`, the examples — not run;
  all are downstream of a green build.

---

## 5. Files changed by this task

| File | Change |
| --- | --- |
| `packages/dsh-jev/package.json` | 29 pins bumped (1 dependency, 7 peers, 21 devDependencies) and the cordis peer range narrowed to `~4.0.4` (§2.1); `@deepseek-ai/dsh-settings-file` **removed** (§2.2) |
| `examples/coding/package.json` | 6 pins bumped |
| `pnpm-lock.yaml` | regenerated, `1277 insertions(+), 999 deletions(-)` (measured at the bump, before the §2.2 removal) |
| `docs/adaptation/01-deps.md` | this document |

Not changed: `packages/jev-core/package.json`,
`examples/ops-readonly/package.json`, `examples/standalone-game/package.json`,
root `package.json`, `pnpm-workspace.yaml`. No `src/` or `tests/` file was
touched — the inventory above is the only hand-off those tasks need.

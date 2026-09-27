# 06 — Documentation, version matrix, and hard-coded tooling versions

Task `task-6` (owner `docs-adapt`). Records every documentation change made for
the `0.1.6-alpha.2 → 0.1.7-rc.2` upgrade, the evidence behind each one, and every
remaining version-string hit with its disposition.

Every claim is marked **[executed]** (a command was run and this is its literal
outcome), **[observed]** (read directly from a file on disk), or **[inferred]**.

Environment **[executed]**: `node v24.16.0`, `pnpm 12.4.2`, Windows, repo
`D:\dsh-plugins\dsh-jev`, HEAD `87e29e2`, run date **2026-09-27 00:58**.

Scope rule applied: this task edited only `README.md`, `docs/**` (except
`docs/upstream-delta-0.1.7-rc.2.md` and all of `docs/adaptation/` except this
file), `packages/*/README.md`, `AGENTS.md`, `scripts/packaging-test.mjs` and
`.github/`. No `package.json`, `pnpm-lock.yaml`, `src/`, `tests/` or `bench/`
file was touched.

---

## 1. Files changed

| # | File | One-line reason |
|---|---|---|
| 1 | `scripts/packaging-test.mjs` | `DSH_VERSION` 0.1.6-alpha.2 → 0.1.7-rc.2, `CORDIS_VERSION` 4.0.2 → 4.0.4, client `inject` assertion updated to the migrated service set |
| 2 | `docs/upstream-compatibility.md` | central rewrite: version matrix, settings redesign, re-checked limitations, and the executed/carried-over/not-verified split |
| 3 | `README.md` | "Verified DSH" row, test-count rows, and the two carried-over `dsh`-loader/served-client claims re-labelled |
| 4 | `docs/roadmap.md` | settings write path, client-test-runtime limitation refreshed, new typecheck-gate limitation |
| 5 | `docs/architecture.md` | host/browser settings description rewritten for the redesigned settings API |
| 6 | `docs/getting-started.md` | "host settings document" → the active profile's Cordis patch |
| 7 | `packages/dsh-jev/README.md` | web-client write path (settings document → config-forms service / profile patch) |
| 8 | `AGENTS.md` | `pnpm test` count: temporarily changed to the uncollectable-suite wording, then restored at revision 4 — **net-zero diff** (`git status` shows it unmodified vs HEAD) |
| 9 | `docs/adaptation/06-docs.md` | this change log |

Net files with a diff at revision 4: the seven non-log files above minus
`AGENTS.md` (restored to its HEAD text), so `README.md`,
`docs/upstream-compatibility.md`, `docs/roadmap.md`, `docs/architecture.md`,
`docs/getting-started.md`, `packages/dsh-jev/README.md` and
`scripts/packaging-test.mjs`, plus this log.

Not changed, and why:

| File | Why unchanged |
|---|---|
| `packages/jev-core/README.md` | No `@deepseek-ai/*` version, settings API, or test count appears in it. Its Node-engine line is still correct. |
| `.github/workflows/verify.yml`, `scripts/verify.sh` | No hard-coded version and no changed command: both just invoke the same pnpm scripts. [observed] |
| `scripts/bench-cli.mjs`, `scripts/bench-*.mjs`, `scripts/run-evals.ts`, `scripts/calibrate.ts`, `scripts/lib/fixtures.ts` | grep for `0.1.x` / `4.0.x` / `3.18.x` / `settingsScope` / `installSection` over `scripts/**`: **only `packaging-test.mjs` matches.** [executed] |
| Other `docs/*.md` (`policy`, `evaluation`, `benchmark`, `skills`, `publishing`, `use-cases`) | They name only `@buberlo/*` registry versions and dated measurements (`2026-09-19`, `2026-09-23`), all still true and already attached to the date they were obtained on. No DSH version is asserted. [observed] |

---

## 2. `scripts/packaging-test.mjs` — detail

| Line | Before | After | WHY (evidence) | IMPACT |
|---|---|---|---|---|
| 22 | `const DSH_VERSION = '0.1.6-alpha.2'` | `'0.1.7-rc.2'` | The workspace pins `0.1.7-rc.2` [observed: `packages/dsh-jev/package.json:58-88`, `examples/coding/package.json:17-23`] | The consumer project the packaging test creates now installs the same DSH release as the packages under test |
| 23 | `const CORDIS_VERSION = '4.0.2'` | `'4.0.4'` | The authority is the plugin's own `devDependencies["@deepseek-ai/cordis"] = "4.0.4"` and the resolved lockfile [observed]; delta §2/§6.2 | The "no second Cordis runtime" check resolves the right version |
| 170 | `assert.deepEqual([...clientExports.inject].sort(), ['locale','remote','settingsScope','slots'])` | `... ['configForms','locale','slots'])` | `settings-adapt` (task-4) states the final `src/client/index.tsx` is `export const inject = ['slots', 'locale', 'configForms']` **[observed from the task-4 hand-off]**, i.e. the sorted set is `['configForms','locale','slots']`. `settingsScope` is removed by the redesign (delta B-4) and `remote` was only declared alongside it — in `0.1.7-rc.2` the `configForms` **providing fiber** holds `remote.settings`, so a caller must not declare it (`dsh-client-ui-settings/lib/types/client/config-form.d.ts:113-118`). | Without this the packaging smoke would fail on a **correct** client artifact. **See the caveat below.** |

**Corroborated at revision 4 (was `[inferred]`).** The emitted
`packages/dsh-jev/lib/client.js` was loaded with stub globals by task-4 and
reports `exports = ["apply","inject"]` with `inject` sorted
`["configForms","locale","slots"]` — exactly the assertion now in the script
(`docs/adaptation/04-client.md` §5). The assertion is therefore corroborated
against the artifact rather than inferred from source. What remains unexecuted is
the packaging run itself: `pnpm test:packaging` has not been run end to end
(task-7 owns it), so the packaging path is not described anywhere as tested.

**Two corrections to the delta report recorded here** (they do not change
`docs/upstream-delta-0.1.7-rc.2.md`, which is task-2's file):

1. `docs/upstream-delta-0.1.7-rc.2.md` §11 shows
   `inject = ['slots', 'locale', 'remote', 'configForms']`. That row is **wrong**
   for `remote`: it was a duplicate of the old list with `settingsScope` renamed.
   The executed/inspected final set has **three** members.
2. `docs/upstream-delta-0.1.7-rc.2.md` §10.3 marks the
   `dsh-api-session-controller/src/client/scope.ts` import "not verified".
   `test-adapt` **closed** it: the published tarball ships no `src/` either, so
   the import is unsatisfiable (see §5 below). The compatibility doc uses the
   executed version, not the "not verified" phrasing.

---

## 3. `docs/upstream-compatibility.md` — detail

The file was rewritten (was 268 lines, now 532). The main structural addition is
the explicit three-state convention at the top
(`[executed, 0.1.7-rc.2]` / `[carried over, 0.1.6-alpha.2]` / `[not verified]`)
and the consolidated "What is verified at 0.1.7-rc.2" section at the end.

### 3.1 Version matrix

| Row | Before | After | WHY |
|---|---|---|---|
| Header dates | single "Verification date 2026-09-19 / npm view 2026-09-23" | a provenance table naming 2026-09-19, 2026-09-23 and 2026-09-27 and what each date covers | The three dates cover different material; collapsing them was the root of the old ambiguity |
| `@deepseek-ai/dsh-*` | `0.1.6-alpha.2` | `0.1.7-rc.2` | Workspace pins + `pnpm install --frozen-lockfile --ignore-scripts` exit 0 (`docs/adaptation/01-deps.md` §3.2) |
| `@deepseek-ai/cordis` | `4.0.2` | `4.0.4` | lockfile; delta §2 |
| `@deepseek-ai/schemastery` | *(absent)* | `3.18.4` | lockfile (`dependencies` + `devDependencies`) |
| `@deepseek-ai/dsh` (CLI) | `0.1.6-alpha.2` | `0.1.7-rc.2`, **present on this machine only**; explicitly "no `--dump-config` or profile boot executed" | The launcher runtime exists at `%APPDATA%\in.dsh-plug.dsh-launcher\versions\0.1.7-rc.2` (`01-deps.md` §2.4) but no profile was composed from it |
| harness source commit | `ddefc45…` = `0.1.6-alpha.2` | same commit, now explicitly labelled **`0.1.6-alpha.2`**, with "no `0.1.7-rc.2` source checkout was made; evidence is the shipped tarballs" | The old row presented the 0.1.6 commit as the source for a 0.1.6 claim; it cannot be reused for 0.1.7 |
| cordis peer range | (implied `^4.0.2`) | a row stating the plugin declares `~4.0.4` | Lead decision + `packages/dsh-jev/package.json:57` [observed] |
| `@buberlo/*` | registry `0.1.4` | unchanged, marked **[carried over, 0.1.6-alpha.2 era]** | `npm view` 2026-09-23 was not re-run |
| Node | `26.9.0` | this upgrade ran `24.16.0`; engines requirement kept | `01-deps.md` environment [executed] |

A new paragraph documents `@deepseek-ai/dsh-settings-file`: **no `0.1.7-rc.2`
release exists** (registry stops at `0.1.6-alpha.2`), upstream dropped it, and
this repository **removed** the pin rather than holding it. The old "held at
0.1.6-alpha.2" framing is gone from the doc because it is no longer true.

### 3.2 "Settings and the web client" — the section that described a removed API

| Before | After | WHY (evidence) |
|---|---|---|
| `ctx.settings.installSection(owner, ns, schema, entry, hooks)` registers a namespace; `setSource`/`onChange`; `settings.update(ns, patch)` | `ctx.settings` **is** `SettingsForms`; `installSection`, `SettingsSectionHooks`, `SettingsScope`, `SettingsProvider`, `SettingsRegisterOptions`, `SettingsUpdateSource`, `settings/updated` and the `/invariant` subpath are **removed**; writes are keyed by **profile entry id**; `settings/document-updated` is the only event | delta §3.4, B-1, B-2 |
| *(nothing)* | Form-editable leaves must be `.volatile()` in the plugin's `Config`; reads become `.get()`; the settings document **is** the profile patch, written through `@deepseek-ai/dsh-config-editor` | delta §6.1, §7.3, §7.4 |
| Client: `ctx.settingsScope.bind({ namespace })` returns a revision-fenced `SettingsScope` | Client: `ctx.settingsScope` and the `SettingsScope*` exports are **gone**; the replacement is `ctx.configForms.get<T>(entryId)` with `ConfigForm` `getSnapshot/subscribe/mutate/set/unset`; `set(field)` takes **one path segment**, so nested writes use `mutate([{op:'set', path:[...]}])` | delta §3.8, B-4; `dsh-client-ui-settings/lib/client.js:1152-1158`; executed in `docs/adaptation/05-tests.md` §4.1 |
| Line references `packages/settings/...`, `packages/core/tools/src/index.ts:146` (a source checkout) | references to the shipped `0.1.7-rc.2` tarball declarations, with a note on the provenance change | delta §1.1: the new evidence is tarballs, not a checkout |
| Slots paragraph | kept, with the additive slots and `PluginConfigViewProps.form?` noted | delta §3.8 |

### 3.3 Limitations — re-checked one by one

| Limitation | Verdict | Evidence |
|---|---|---|
| Client live counters blocked by the fixed Remote capability set | **Still holds**; evidence refreshed to `dsh-api-remotes@0.1.7-rc.2/README.md:73` (verbatim identical) | delta §8(b) |
| `dsh-client-test-runtime` unusable from npm | **Still holds**; kept, with the executed two-cause proof; the `0.1.5-rc.2`/`0.1.6-alpha.2` form is labelled history | delta §8(a) + `docs/adaptation/05-tests.md` §5 |
| Remote capability restriction | unchanged (same row as above) | delta §8(b) |
| PTC / code mode not mounted | **Kept as [carried over]**; explicitly marked "not re-checked" | delta says nothing about it; the upgrade did not exercise it |
| Model catalog advisory | **Still holds**, wording tightened upstream; the adapter's fallback stays legal | delta §5 |
| Live TypeSafe run recorded 2026-09-19 | **Kept, dated, [carried over]** | not re-executed |
| Desktop `0.1.5-rc.2` below the verified range | **Kept**, wording changed: the matrix is now `0.1.7-rc.2`, so `0.1.5-rc.2` **and** `0.1.6-alpha.2` are both older bundles | the version move itself |
| Approval requires an open turn | **Kept**, unchanged | delta §9 |
| Registry line `0.1.4` | **Kept**, dated 2026-09-23, labelled carried over | `npm view` not re-run |
| **NEW**: `pnpm typecheck` compiles `src/**` only, so stale `tests/**` type imports are invisible | added as a **pre-existing** limitation, with the four locations and the explicit note that it is not upgrade fallout | `docs/adaptation/05-tests.md` §4.2 [executed] |

No limitation was deleted. No limitation was upgraded from "unknown" to "fixed"
without evidence; nothing in the delta shows a limitation being fixed.

### 3.4 Honesty relabelling (the most important change)

| Old text | New text | WHY |
|---|---|---|
| "Installation path that was actually executed" presenting the CLI install, `--dump-config`, headless boot and served-client proof as current | the same content under a heading marked **[carried over, 0.1.6-alpha.2] — reproduced registry proof (2026-09-19)**, followed by a blockquote: "**Not re-executed at `0.1.7-rc.2`** … the profile layer this proof exercised has changed" | None of these was re-run in this upgrade; the `0.1.7-rc.2` product tree also no longer mounts `dsh-settings-file` (delta §6.4), so the composition differs |
| "Web client served proof (2026-09-19)" presented as current | same proof labelled **[carried over]**, with a note that the served module's `settings.jev` namespace string no longer exists at `0.1.7-rc.2` | the settings redesign removed that namespace |
| "All DSH packages named below are published and externally installable at `0.1.6-alpha.2`" | "every `@deepseek-ai/dsh-*` package this repo depends on is published at `0.1.7-rc.2`", with the `dsh-settings-file` exception spelled out | delta §1.3 / B-7 (no `0.1.7-rc.2` release for `dsh-settings-file`) |
| "**Registry line is `0.1.4`** … The end-to-end profile install was verified on 2026-09-19" | kept verbatim in substance, prefixed **[carried over, 0.1.6-alpha.2 era, 2026-09-23]**, plus one new sentence: a `0.1.5` release of these packages would be the first to carry the new matrix | it is an `@buberlo/*` fact, unrelated to the DSH bump, and was not re-verified |

---

## 4. Other file changes — detail

### 4.1 `README.md`

| Line | Before | After | WHY |
|---|---|---|---|
| "Verified DSH" row | `0.1.6-alpha.2` (commit `ddefc45`), cordis 4.0.2 | `0.1.7-rc.2`, cordis 4.0.4, schemastery 3.18.4, pointing at the compatibility doc for the executed/carried-over split | the version move; AGENTS.md's "no claim of support without an executed test" |
| "Tests" row | `147 (85 core + 62 DSH integration)` | core **85** + DSH integration **62**, zero delta (revision 4 — see §10) | at revisions 1–3 the settings suite was not collectable, so `62` was not a true total then; it is now |
| Status table, `jev-core` / `dsh-jev` rows | "82 unit tests" / "38 integration tests (… real settings provider)" | 85 passed / 62 passed (revision 4), stale "real settings provider" phrase removed | the old counts (`82`/`38`) were stale even before the upgrade |
| "Web client configuration page" row | "settings write and card interactions tested; module served by a running web app" | card interactions tested against the real `ConfigForm` contract; the served-module proof labelled carried over and not re-run | honesty rule |
| "Real `dsh` CLI profile/loader" row | "verified" | "verified at `0.1.6-alpha.2` (2026-09-19); **not re-executed at `0.1.7-rc.2`**" | honesty rule |
| "No implicit live access" bullet | "verified through the real `dsh` loader" | same, with "(the constructor rejects it; … that loader proof was not re-executed at `0.1.7-rc.2`)" | the constructor-level property is still true; the loader proof is old |
| Web-client section | "Provider, model, and API key stay in `cordis.yml`" | plus: writes land in the active profile's Cordis patch through the config-forms service, and the edited fields are `.volatile()` | delta §6.1, §7.3 |
| Development block | `pnpm test # 147 tests (85 core + 62 DSH)` | `core 85, dsh-jev 62` (revision 4 — see §10) | after task-4's fix both suites are green again |
| "Current registry release is `0.1.4`" paragraphs | unchanged | unchanged | `@buberlo/*` registry fact, dated 2026-09-23, still correct |

### 4.2 `docs/roadmap.md`

| Location | Change | WHY |
|---|---|---|
| "Implemented and tested" → web client page | writes described as going through the config-forms service into the profile patch; the served-module proof labelled `0.1.6-alpha.2`, not re-executed | delta §6.1; honesty rule |
| "Implemented with documented limits" → client test runtime | version `0.1.6-alpha.2` → `0.1.7-rc.2`, both import causes recorded, `ERR_MODULE_NOT_FOUND` cited | `docs/adaptation/05-tests.md` §5 |
| "Implemented with documented limits" → **new** bullet | `pnpm typecheck` does not compile `tests/**`; pre-existing | Lead's cross-cutting finding + `05-tests.md` §4.2 |
| "Implemented with documented limits" → web client page | "model and base URL stay in `cordis.yml`" → "are not exposed as form fields" | the page edits volatile fields; the non-volatile ones stay in the composed profile entry |

### 4.3 `docs/architecture.md`

The "Host and browser halves" bullets described `ctx.settings.installSection` and
`ctx.settingsScope`, both removed. Rewritten to: volatile `Config` fields
projected by the settings service for the `jev` profile entry; writes into the
active profile's Cordis patch; the client reading and writing through
`ctx.configForms.get(entryId)`, including the one-path-segment rule for
`set(field)` and `mutate([{op:'set', path:[…]}])`. Evidence: delta B-1, B-4, §6.1;
`05-tests.md` §4.1. No other block of that file names a version or a changed
interface.

### 4.4 `docs/getting-started.md`

Section 8, one paragraph: "Writes go into the host settings document (the same
place a user-edited `settings.yaml` would)" → "Writes go into the active
profile's Cordis patch — the document the settings service edits at
`0.1.7-rc.2` (a legacy `$DSH_HOME/settings.yaml` is imported once)". Evidence:
delta §6.1.

### 4.5 `packages/dsh-jev/README.md`

"Web client" paragraph: "Writes go to the host settings document" → "Writes go
into the active profile's Cordis patch through the config-forms service … the
page edits only fields the plugin declares `.volatile()`". Evidence: delta §6.1.
The registry/install paragraphs (`0.1.4`, 2026-09-23) are unchanged and still
correct.

### 4.6 `AGENTS.md`

Revision 1–3 changed the `pnpm test` comment to reflect the temporarily
uncollectable settings suite; **revision 4 restored `(core 85, dsh-jev 62)`
(see §10)**. The measured figure is now 85 + 62 with zero delta, so the original
line is again the true one — the intermediate wording is gone, and the file is
**byte-identical to HEAD** (`git status` reports no `AGENTS.md` change). No
command changed at any point.

---

## 5. Evidence folded in from the other tasks

1. **`dsh-client-test-runtime@0.1.7-rc.2` limitation — explained from execution,
   not from the delta's tarball reading.** My spawn brief said to record
   `lib/index.js:12`'s import of
   `@deepseek-ai/dsh-api-session-controller/src/client/scope.ts` as
   **unverified** (matching delta §10.3). `test-adapt` executed it and closed it
   (`docs/adaptation/05-tests.md` §5(c)): the package is a declared peer that is
   not installed here **and** the published tarball ships no `src/` either, so
   the import is unsatisfiable for the same reason as `:5-6`. The compatibility
   doc now records the executed two-cause version and notes that the delta's
   "not verified" tag was closed by execution.
2. **`ConfigForm.set` is single-segment.** `docs/adaptation/05-tests.md` §4.1
   read the shipped implementation
   (`@deepseek-ai/dsh-client-ui-settings/lib/client.js:1152-1158`) and showed
   `set(field)` forwards `path: [field]`. This is recorded in the compatibility
   doc and `docs/architecture.md` so the next reader does not assume a dotted
   path works.

### Executed evidence folded in from `docs/adaptation/03-host.md`

`03-host.md` landed while this task was running and was re-read before
finalising. Facts promoted into `docs/upstream-compatibility.md`:

- `tsc -p tsconfig.json` is **clean for `src/adapters/**`** and reports 3
  remaining diagnostics in `src/settings-section.ts` (task-4's migration)
  (`03-host.md` §7.2). The compatibility doc records this as a **partial** row,
  not as a green typecheck.
- 5 test files / 50 tests pass against the real ToolRuntime and the real agent
  loop at `0.1.7-rc.2` (`03-host.md` §7.1).
- The plugin declares its own message source kind `'dsh-jev'` by module
  augmentation and bounds the `notice` summary with `boundContextSummary`
  (120 chars) — a concrete instance of the delta's B-3 rule, and the executed
  proof that the injected hint still reaches the model (`03-host.md` §1.2, §2.4).

Not promoted: `03-host.md` §7.3's examples typecheck, because that run resolves
`@buberlo/dsh-jev` to the stale on-disk `lib/types` (its own caveat) and so does
not prove the freshly edited source through the package boundary.

---

## 6. Grep sweep — commands, hits, disposition

Counts are **occurrences** (not lines), produced by walking every tracked text
file and summing `Select-String -AllMatches`:

```powershell
Get-ChildItem -Recurse -File -Include *.md,*.mjs,*.sh,*.yml,*.json,*.yaml,*.ts,*.tsx |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\\.git\\' }
# then, per pattern, Select-String -AllMatches and sum the match counts
```

Scope tags: **M** = my file, **F** = foreign/other task's file, **H** =
intentionally historical.

### 6.1 `0.1.6-alpha.2`

**152 occurrences at revision 5** (counted with
`Select-String -AllMatches`, so this is matches, not lines). The count only grows
because the foreign hand-offs landed and because this change log must quote the
strings it sweeps:

| File | Hits | Tag | Disposition |
|---|---|---|---|
| `docs/adaptation/01-deps.md` | 19 | F | The bump record's own before/after table; task-1 has annotated §2.2 with the removal decision. |
| `docs/adaptation/05-tests.md` | 7 | F | Baseline labels and byte-identity comparisons for the before/after table. |
| `docs/adaptation/03-host.md` | 2 | F | Its own title plus one mid-run statement that the settings package was still pinned (accurate when written). |
| `docs/adaptation/04-client.md` | 4 | F | Its own title, the OLD→NEW mapping header, and the removal evidence. |
| `docs/adaptation/07-verification.md` | 15 | F | The verifier's own evidence tables and probes. Not mine to edit. |
| `docs/upstream-delta-0.1.7-rc.2.md` | 43 | F | The report's own subject matter. |
| `docs/adaptation/06-docs.md` (this file) | 26 | **H** | Self-referential: this change log must *quote* the strings it sweeps. Not a straggler. |
| `README.md` | 3 | **H** | Each is an explicit "carried over from `0.1.6-alpha.2`" / "zero delta from the … baseline" label (Verified-DSH row, Tests row, web-client row). |
| `docs/roadmap.md` | 1 | **H** | "proof was obtained at `0.1.6-alpha.2`; not re-executed". |
| `docs/upstream-compatibility.md` | 32 | **H** | The document's explicit legacy labels: the `[carried over]` convention, the provenance table, the `dsh-settings-file` registry fact, the historical proof headings and their "not re-executed" blockquotes, and the clearly-labelled pre-bump baseline row. |
| `scripts/**`, `packages/**`, `AGENTS.md`, any `package.json`, `pnpm-lock.yaml`, `.gitattributes`, all other docs | **0** | — | Clean. |

Representative executed check: `grep -n "0\.1\.6-alpha\.2" packages/dsh-jev/package.json pnpm-lock.yaml examples/coding/package.json` → **no matches** [executed]. Consistent with the Lead's decision: `@deepseek-ai/dsh-settings-file` was removed, not held.

Outside the documentation set the count is **zero**: no `scripts/**` file, no
`AGENTS.md` line, no `package.json` and no `pnpm-lock.yaml` entry contains the
string.

### 6.2 `4.0.2` and `3.18.2`

**66 occurrences at revision 5**: `docs/upstream-delta-0.1.7-rc.2.md` (19, F — the
report's own before/after), `docs/adaptation/07-verification.md` (20, F — the
verifier's probes), `docs/adaptation/06-docs.md` (13, **H** — self-referential),
`docs/adaptation/01-deps.md` (7, F — the pin diff, now corrected to `~4.0.4`),
four **H** in `docs/upstream-compatibility.md` (`4.0.2` used only in
"byte-identical to `4.0.2`" comparisons), and three in `pnpm-lock.yaml` (the
false positive below). `README.md`, `scripts/**`, `packages/**`, `.github/**` →
**0 hits** [executed]. Disposition: keep the historical comparisons; no current
version statement remains.

**One false positive**, recorded so the next sweep does not chase it:
`pnpm-lock.yaml` matches `4.0.2` three times on the unrelated transitive
`@types/deep-eql@4.0.2` (lines 1589, 3392, 3395 at this revision), not on
`cordis`. It is not a cordis/schemastery straggler and must not be "fixed".

### 6.3 `0.1.5-rc.2`

**11 occurrences at revision 5**: 5 in `docs/upstream-compatibility.md`
(**M/H** — the Desktop bullet "`0.1.5-rc.2` … is below the verified range" and two
"historical form of this limitation" notes; all true statements about an older
bundle), 1 in `docs/adaptation/01-deps.md` (F, registry version list), and 5
self-referential in this change log. Disposition: kept and explicitly labelled as
an older bundle. Zero outside the documentation set.

### 6.4 Stale dates

| Date | Where | Disposition |
|---|---|---|
| `2026-09-19` | `docs/benchmark.md` (measurements), `docs/evaluation.md` (live run), `docs/policy.md` (first live run), `docs/getting-started.md` + `README.md` + `packages/dsh-jev/README.md` (registry/profile), `docs/upstream-compatibility.md` (carried-over proofs) | **Kept.** Every occurrence is attached to a dated measurement or to a proof that is now explicitly labelled carried over. Rewriting them would falsify the record. |
| `2026-09-23` | `README.md`, `docs/publishing.md`, `docs/getting-started.md`, `docs/benchmark.md`, `packages/dsh-jev/README.md`, `docs/upstream-compatibility.md` | **Kept.** All are `@buberlo/*` registry facts from that `npm view`; they concern our own packages, not the DSH matrix, and were not re-run. |
| `2026-09-26` | bench artifact filename in `docs/adaptation/05-tests.md` | F, a literal log filename. |
| `2026-09-27` | added by this task as the upgrade date | new. |

### 6.5 Removed-API strings

`installSection` / `settingsScope` / `SettingsScope` → the only remaining
occurrences are in the foreign adaptation/delta reports (describing the old API)
and in `docs/upstream-compatibility.md`, where they appear **only** inside the
"these are removed / here is what replaced them" explanation. No doc still
describes the removed API as current [observed].

---

## 7. Warnings for the Lead (outside this task's write scope)

1. **Both cross-task corrections were actioned by their owners (revision 4).**
   `docs/adaptation/01-deps.md` now carries a "superseded by a Lead decision"
   note at §2, records the removal of `@deepseek-ai/dsh-settings-file` in place
   of a hold, and states the cordis peer as `~4.0.4` with the Lead's reason. It
   also **withdraws** the "unsatisfiable criterion" claim. No edit by me.
   - *Residual (low severity, foreign hand-offs):* three of them still carry
     mid-run "56 passing / 6 pending the settings migration" statements that
     were true when written — `01-deps.md`'s "Downstream note" (~line 155),
     `03-host.md` §10's residual row and its §1 framing, and `05-tests.md` §7's
     reproduction comment (`# 6 files / 56 passed (settings-section blocked by
     task-4)`). After task-4 landed the confirmed figure is **85 + 62**, which
     is what `AGENTS.md`, `README.md`, `docs/roadmap.md` and
     `docs/upstream-compatibility.md` now state. Flagged so the verifier does
     not read the foreign mid-run numbers as current; no edit made, as those
     files are not mine.
2. **`docs/upstream-delta-0.1.7-rc.2.md` §11's `inject` example was wrong** about
   `remote` (see §2 above). Task-2's file; flagged, not edited.
3. **`docs/adaptation/05-tests.md` §0 forbade writing "dsh-jev 62" or
   "85 + 62 = 147" while the settings suite was uncollectable.** That
   prohibition was scoped to revisions 1–3 and is now lifted: the confirmed
   post-task-4 figure is 85 + 62. The Lead explicitly decided (revision 4) to
   **keep** the pre-bump baseline row containing `62` in
   `docs/upstream-compatibility.md` table (a), since a before/after record needs
   its "before" number and the row is labelled as executed at the
   `0.1.6-alpha.2` pins. `README.md` and `AGENTS.md` now state `62` as the
   current figure as well.

---

## 8. Claims still unverified (recorded in the docs as such)

- Any `dsh` profile boot, `--dump-config`, or served web client at `0.1.7-rc.2`
  (the product tree exists on this machine; no profile was composed from it).
- The in-browser → Host settings write round trip (no browser is available here).
- `pnpm test:packaging` end to end, `pnpm verify` as a whole, and the examples at
  `0.1.7-rc.2`.
- Behavioural equivalence of the changed upstream `lib/*.js` bundles.
- `cordis-plugin-loader`'s `loader/volatile-update` DSH-side wiring.
- `engines` ranges of the `0.1.7-rc.2` packages.

Closed at revision 4 (all were listed here at revisions 1–3): the final test
total (**85 + 62**); the host **and** client typechecks (both exit 0); runtime
acceptance of `.volatile()` on this plugin's nested objects
(`validateVolatileSchema` passed at parse); the `ConfigForms.get(entryId)` keying
(profile entry id = `jev`); the built-artifact `inject` array (corroborated
against the emitted file). Evidence per item is in §9.

## 9. Final reconciliation pass — task-6 revision 4

Reopened by the Lead after task-4 landed. Every edit below and its evidence
source:

| # | Edit | Evidence source |
|---|---|---|
| 1 | `AGENTS.md`: restored `pnpm test … (core 85, dsh-jev 62)`. **Net-zero**: the line is byte-identical to HEAD, so `git status` lists no `AGENTS.md` change | Lead's confirmed figure; `04-client.md` §0 (`7 files, 62/62 passed`); `05-tests.md` §0 |
| 2 | `README.md`: Tests row → core 85 + DSH 62, zero delta; `dsh-jev` status row → 62 passed incl. the real settings service; Development block → `core 85, dsh-jev 62`; web-client status row scoped to what is executed | same; `04-client.md` §5, §7 |
| 3 | `docs/roadmap.md`: web-client bullet now states what is executed and that the in-browser → Host call is not; two new documented-limits bullets (settings write-path constraint; message-source kind visibility) | `04-client.md` §5, §7, §9; `03-host.md` §1.2 |
| 4 | `docs/upstream-compatibility.md` table (a): typecheck row → both projects exit 0; `dsh-jev` row → 7 files / 62 passed with zero delta; new rows for the hermetic settings test and for build + artifact load; the "pending" artifact row removed | `04-client.md` §0, §5, §7; Lead |
| 5 | `docs/upstream-compatibility.md` (c): removed the now-closed keying and `.volatile()` items; added the in-browser round trip and the non-string-`apiKey` refusal; scoped the packaging item to "not executed" while noting its `inject` expectation is corroborated | `04-client.md` §1, §3, §5, §9.1–9.2 |
| 6 | `docs/upstream-compatibility.md` Settings section: nested-object `.volatile()` accepted at parse; entry id = profile entry id (settled by execution, not by declarations); new "which rows a form can write" bullet; `@deepseek-ai/dsh-api-remotes` type-only dependency noted; the "cannot be decided from the declarations alone" bullet replaced | `04-client.md` §1, §3, §5, §7 |
| 7 | `docs/upstream-compatibility.md` Messages/Approval sections: documented the message-source visibility limit; recorded the deliberate non-adoption of `displayReason` | `03-host.md` §1.2, §4 |
| 8 | `docs/getting-started.md` §8 and `docs/architecture.md`: the settings write-path constraint (patch-layer `insert` rows are editable; rows only in the leaf `cordis.yml` are not; the editor's refusal message is misleading) | `04-client.md` §7 |
| 9 | `06-docs.md` §2, §4.6, §7.3: the `inject` caveat is now corroborated against the emitted artifact; the AGENTS.md entry records the restore; the "do not write 62" note is recorded as lifted | this file; Lead |
| 10 | `06-docs.md` §6: sweep counts refreshed at this revision | re-run grep at revision 4 |

Two deliberate non-claims, stated so the verifier can check them:

- `pnpm test:packaging` is **not** described as tested anywhere. Only its
  `inject` expectation is corroborated against the emitted artifact.
  → **Superseded by §10**: task-8 fixed the Windows spawns and the packaging test
  now runs green end to end.
- The client is **not** described as verified in a browser. The claims are: the
  artifact loads and honors the loader contract; the host-side settings write
  path passes against the real Loader/profile-patch/settings stack; the card's
  write ops are asserted against a strict one-segment/path-op double.

---

## 10. Task-8 — making the repository gate executable, and the post-verification reconciliation

Owner: `docs-adapt`. Trigger: `docs/adaptation/07-verification.md` (task-7,
independent) falsified two claims and found stale doc rows. **Both defects are
PRE-EXISTING** — neither was introduced by the `0.1.7-rc.2` upgrade; at HEAD
neither file had a diff beyond the version constants and the `inject` assertion.

### 10.1 D2 — shell-script checkout (`scripts/verify.sh` + new `.gitattributes`) — pre-existing

| Item | Detail |
|---|---|
| Change | New repo-root `.gitattributes` (`*.sh text eol=lf`, with a comment recording the symptom). `scripts/verify.sh` renormalized to a working-tree LF checkout. **No script logic was changed.** |
| WHY | `git ls-files --eol scripts/verify.sh` was `i/lf w/crlf` — `core.autocrlf=true` comes from `C:/Program Files/Git/etc/gitconfig` and the repo shipped no `.gitattributes`. Under `bash` (WSL) the CR survived into the token and `set -euo pipefail\r` became `set: pipefail: invalid option name`. |
| Evidence (before) | `07-verification.md` §2.2: `pnpm verify` → exit 2 before stage 1. |
| Evidence (after) | `git ls-files --eol scripts/verify.sh` → **`i/lf w/lf attr/text eol=lf`**; the file content is byte-identical to HEAD (`git hash-object` = `git rev-parse HEAD:scripts/verify.sh` = `ef4aaa707e8d3238406b615026332a3feec37d07`), zero CR bytes; `pnpm verify` runs (see §10.3). |
| IMPACT | The gate executes. The `*.sh text eol=lf` rule also protects any future shell script; nothing else in the repo is affected. |

**Which bash the gate actually uses (determined, not assumed).**
`where.exe bash` → `C:\Windows\System32\bash.exe` first (WSL), then
`C:\Program Files\Git\usr\bin\bash.exe`. The run prints WSL's own localhost-proxy
notice, and a probe under the same bash reports
`BASH_VERSION=5.3.9(1)-release`, `Linux 6.6.87.2-microsoft-standard-WSL2`. So the
LF fix alone was **sufficient** (outcome A from the Lead's two options) — no
launcher was added and `verify.sh` was not rewritten. Two WSL caveats are worth
recording because they explain why this is fragile on other machines:

1. WSL bash cannot resolve an **absolute Windows path** argument — reproduced:
   `bash C:\...\probe.sh` → `/bin/bash: C:Users…probe.sh: No such file or
   directory`, exit 127. The package script's **relative** `bash scripts/verify.sh`
   is what makes it work; `verify.sh`'s own `cd "$(dirname "$0")/.."` then lands
   on the `/mnt/d/...` translation.
2. `node` is **not** on WSL's PATH; `command -v pnpm` resolves to the Windows npm
   global shim `/mnt/c/Users/BananaPeel/AppData/Roaming/npm/pnpm` through WSL's
   `appendWindowsPath` interop, which is why the stages still print Windows-style
   paths (`D:\dsh-plugins\…`, `C:\Users\BANANA~1\…`).

On a machine where `bash` is Git Bash instead, the identical script runs
identically (`07-verification.md` §2.3). The environment condition to record is
therefore: *the gate needs a POSIX bash; on Windows a WSL or Git Bash both work,
provided the script is invoked by a relative path.*

### 10.2 D3 — Windows process spawning in `scripts/packaging-test.mjs` — pre-existing

| Item | Detail |
|---|---|
| Change (a) | `const isWindows = process.platform === 'win32'`, `const shim = name => isWindows ? \`${name}.cmd\` : name`, `const shimOptions = isWindows ? { shell: true } : {}`. Applied to the three shim spawns: `pnpm pack`, `npm install`, and the `node_modules/.bin/tsc` invocation. |
| Change (b) | `run('mkdir', ['-p', packs, consumer])` → `mkdirSync(packs, { recursive: true })` + `mkdirSync(consumer, { recursive: true })`. |
| Change (c) | `--pack-destination` is quoted on Windows (`packsArg`), because Node's shell mode concatenates argv **without** escaping. |
| WHY | `execFileSync('pnpm', …)` → `spawnSync pnpm ENOENT` (Windows ships `pnpm.cmd`); passing `pnpm.cmd` as the file → `EINVAL` (Node refuses `.cmd`/`.bat` without a shell since the CVE-2024-27980 fix). The `.bin/tsc` shim is extensionless on POSIX and `tsc.cmd` on Windows. `mkdir -p` run **through a shell** is parsed by `cmd` as directory names, not flags. |
| Evidence | `07-verification.md` §2.4 isolated the failure (not environmental) and proved a scratch copy with the two spawn fixes passes. After the fix here: `pnpm test:packaging` → **exit 0**, `[packaging] packaging test PASSED`, `smoke: OK (standalone core, real plugin load, fail-closed enforcement, single cordis, client artifact)`, `tsc: no output (clean)`. Logs: `%TEMP%\jev-adapt\t8-packaging.log`, `t8-packaging2.log`. |
| IMPACT | Three checks that were hidden behind the bug now execute: the packed-manifest assertions, the real plugin load with the single-Cordis check, and the consumer typecheck. POSIX/CI is unchanged: `shimOptions` is `{}` and `packsArg` is the unquoted path off Windows. |
| Residual, stated not hidden | Node prints `[DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.` on Windows. Non-functional: every argv is an internal constant or a path this script created, and the one path-bearing argument is quoted per change (c). Removing the warning would mean hand-assembling every command line, a larger change than this defect warrants. |
| Repo hygiene, same class | A stray empty directory `-p` was present in the repo root, left by an earlier shell-mode scratch run of this same defect; it has been removed. |

### 10.3 The gate, executed — `pnpm verify`

Run **twice** from `D:\dsh-plugins\dsh-jev`. Both runs: **`EXIT=0`**, final line
`verify: OK`. Raw logs `%TEMP%\jev-adapt\t8-verify.log`, `t8-verify2.log`.

| # | Stage | Observed |
|---|---|---|
| 1 | install (frozen lockfile) | `Lockfile is up to date, resolution step is skipped`; `Done in 35ms using pnpm v12.4.2` |
| 2 | build | `tsc` ×2 + `tsdown`; `lib\client.js 16.57 kB`; `✔ Build complete` |
| 3 | typecheck | both projects; no output (clean) |
| 4 | unit + integration tests | `jev-core` 8 files / **85 passed**; `dsh-jev` 7 files / **62 passed** |
| 5 | offline evaluation (mock) | `cases: 25, pass: 25, fail: 0`; on-prem `regression: 9/9 (model 8/8)`, `held-out: 5/5 (model 5/5)`, unsafe executions 0, false denials 0 |
| 6 | threshold calibration | ran under `set -e` and did not fail; **its printed output is not observable** — `verify.sh` redirects it to `/dev/null` |
| 7 | examples | coding, ops, game and dsh all ran; `stats: {"…","assessments":2,"asks":2,…}` |
| 8 | packaging test | `[packaging] packaging test PASSED` + `smoke: OK (… single cordis …)` + `tsc: no output (clean)` |

### 10.4 Documentation reconciliation — `docs/upstream-compatibility.md` (and `README.md`)

| # | Edit | Evidence source |
|---|---|---|
| 1 | §(a) **new row**: real `0.1.7-rc.2` product profile composition + boot (`dsh --version`, throwaway profile, `--dump-config` layer, `JevRuntime` via `cordis@4.0.4`, fail-closed apiKey error, `MISSING_CREDENTIAL`), with the live-home byte-identity note | `07-verification.md` §2.9 |
| 2 | §(a) **new rows**: `pnpm verify` (exit 0 twice, per-stage results, calibrate caveat) and `pnpm test:packaging` PASSED | this file §10.3 |
| 3 | §(a) typecheck row evidence re-pointed from the pre-task-4 partial (`03-host.md` §7.2) to the gate run; artifact row now also cites the verifier's independent reproduction | §10.3; `07-verification.md` §2.6 |
| 4 | §(a) bench row also cites the verifier's re-run | `07-verification.md` §2.10 |
| 5 | "Installation path → Executed in this upgrade" rewritten from 5 items to 7, adding the real-product boot and the gate, and naming the `.gitattributes` / spawn fixes as pre-existing defects; the "what was not executed" sentence narrowed to the web client | §10.1–§10.3 |
| 6 | §(b) carried-over profile proof re-headed as the *tarball/registry* form of the same path, pointing to (a) item 4 for the `0.1.7-rc.2` result | `07-verification.md` §2.9 |
| 7 | §(c) **item 1 replaced**: "any profile boot … no profile was composed" (now false) → "serving and interacting with the web client" only | `07-verification.md` §2.9, §4.8 |
| 8 | §(c) **old item 4 removed** (whole gate / packaging / examples are now (a)); replaced by a calibrate-observability item | §10.3 |
| 9 | §(c) **new item 8**: no pristine-machine install; the unreachable stale store dirs (`cordis@4.0.2`, `schemastery@3.18.2`, `dsh-llm@0.1.6-alpha.2`, `dsh-settings-file@0.1.6-alpha.2`) are hygiene only | `07-verification.md` D1 |
| 10 | Provenance-table row for this upgrade now names the real-product boot and the gate | §10.3 |
| 11 | `README.md`: "Real `dsh` CLI profile/loader" row → verified at `0.1.7-rc.2` (throwaway profile + fail-closed boot); **new** "Repository gate" row; the "No implicit live access" bullet now cites the real `0.1.7-rc.2` fail-closed boot instead of the old carried-over loader proof | `07-verification.md` §2.9, §5 |

### 10.5 Claims still not run after task-8

- Serving and interacting with the **web client** at `0.1.7-rc.2` (no browser), and
  the in-browser → Host settings write round trip.
- `pnpm calibrate`'s printed output (redirected to `/dev/null` by the gate).
- Behavioural equivalence of the changed upstream `lib/*.js` bundles.
- `cordis-plugin-loader`'s `loader/volatile-update` DSH-side wiring; `engines`
  ranges of the `0.1.7-rc.2` packages.
- The `@deepseek-ai/dsh-client-test-runtime@0.1.7-rc.2` import failure was not
  re-run by this task (it is recorded from `05-tests.md` §5).

### 10.6 Still stale elsewhere (not mine; flagged only)

- `docs/adaptation/01-deps.md` (~line 155) and `docs/adaptation/03-host.md` (§1,
  §10) still describe the mid-run "56 passing / 6 pending" state; the confirmed
  figure is 85 + 62. `05-tests.md`'s §7 reproduction note carries the same, and
  its §5 pointer is unchanged. See §7.1 above.
- `07-verification.md` D5 concerns `docs/adaptation/03-host.md` §7.3b, which is
  being corrected under task-9.

---

## 11. Task-10 — workspace `0.1.4` → `0.1.5` reconciliation (registry history untouched)

The Lead bumped the three manifests to **`0.1.5`** so the adapted code carries its
own version. Statements asserting the *workspace* version then contradicted the
manifests. **`0.1.5` has not been published**; the registry line is still `0.1.4`.

Rule applied, without exception:

- **Registry / `npm view` facts are historical measurements** — they stay exactly
  as they are, dates included. `0.1.5` has no registry row, and none was invented.
- **Workspace-version claims become `0.1.5`**, because that is what
  `package.json` now says.
- **Conflated sentences are split** into the two facts.

### 11.1 Edited

| File (line at edit time) | Before → After | Why |
|---|---|---|
| `README.md:47` | "Workspace is `0.1.4`." → "The **workspace** is `0.1.5` — this adaptation, **not yet published**; the registry line stays `0.1.4`." | workspace claim, split from the registry facts in the same row (which are unchanged) |
| `README.md:172` | "Workspace `package.json` is `0.1.4`." → "The **workspace** `package.json` is `0.1.5` (this adaptation, not yet published — every registry install above still resolves to `0.1.4`)." | workspace claim |
| `README.md:174` | "A checkout packs the same version." → "A checkout packs the workspace version." | removes the implication that the checkout tarballs are `0.1.4` |
| `README.md:179-180` | `./packs/buberlo-{dsh-jev,jev-core}-0.1.4.tgz` → `…-0.1.5.tgz` | the tarball name follows the workspace version; the command would otherwise not match the pack output |
| `docs/publishing.md:8-11` | "Dist-tag `latest` is **`0.1.4`** for both. Workspace `package.json` is **`0.1.4`**." → registry sentence kept; "The **workspace** `package.json` is **`0.1.5`** — this adaptation, **not yet published**, so the registry line above is unchanged and every install instruction still targets `0.1.4`." | split; the file is titled "Publishing", so the unpublished state must be explicit |
| `docs/getting-started.md:123-126` | "Current registry release is workspace `0.1.4` (`latest` …)" → "The **published registry line** is `0.1.4` (…); the **workspace in this checkout** is `0.1.5`, which is **not published yet**, so the commands below still install `0.1.4`." | this sentence conflated the two; the install commands stay at the registry version |
| `docs/getting-started.md:138` | "checkout of workspace `0.1.4`" → `0.1.5` | workspace claim |
| `docs/getting-started.md:145-146` | `./packs/buberlo-{dsh-jev,jev-core}-0.1.4.tgz` → `…-0.1.5.tgz` | same reason as `README.md:179-180` |
| `docs/roadmap.md:117-121` | "`latest` is `0.1.4` for both packages, matching the workspace." → registry sentence kept; added "The **workspace** is now `0.1.5` (this adaptation, **not yet published**), so the registry line above still governs every install." | the "matching the workspace" clause became false |
| `docs/policy.md:83` | "(workspace `0.1.4`; the wording landed in the `0.1.2` tree)" → "(workspace `0.1.5`; …)" | **judged a workspace claim**: the parenthetical qualifies the *current* source file, not the registry. The historical half ("landed in the `0.1.2` tree") is unchanged |
| `docs/upstream-compatibility.md` — **new top callout** | — | the one prominent sentence: workspace `0.1.5`, not published; every registry/install instruction still resolves to `0.1.4`, whose packages peer the `0.1.6-alpha.2`-era DSH ranges; no claim that `0.1.5` is installable and no `npm view` date changed |
| `docs/upstream-compatibility.md:43` | "workspace **`0.1.4`**; registry lists …" → "workspace **`0.1.5`** (this adaptation, **not published**); registry lists `0.1.0`, `0.1.2`, `0.1.3`, `0.1.4`; `latest` is `0.1.4`" | workspace claim + registry fact, now separated in one cell |
| `docs/upstream-compatibility.md:520` | "Dist-tag `latest` is `0.1.4` for both, matching workspace `package.json`." → registry sentence kept; "The workspace is now **`0.1.5`** (unpublished, see the note at the top), so this published line is what every install instruction still resolves to." | the "matching" clause became false |
| `docs/upstream-compatibility.md:~536` | "the workspace at HEAD declares `0.1.7-rc.2`, so a `0.1.5` release …" → "the current workspace (`0.1.5`) declares `0.1.7-rc.2`, so publishing `0.1.5` would be the first release …" | keeps the forward-looking statement true now that the workspace *is* `0.1.5` |
| `packages/dsh-jev/README.md:24` | registry release sentence kept; added "the workspace in this repository is `0.1.5`, **not yet published**, so the install above resolves to `0.1.4`" | the package README is a registry-install page; the clarification is what keeps it correct |

### 11.2 `0.1.4` occurrences deliberately KEPT (registry fact or publish history)

| Location | Kept content (abridged) | Justification |
|---|---|---|
| `README.md:47` | ``npm view`` 2026-09-23 lists `0.1.0`…`0.1.4`; `latest` is `0.1.4`; `npm install @buberlo/dsh-jev@0.1.4` resolves `^0.1.4` | registry measurement + install instruction for the *published* version |
| `README.md:157-165` | "Current registry release is `0.1.4` … boot … not repeated for `0.1.4`"; `dsh plugin … add @buberlo/dsh-jev@0.1.4` | registry fact, dated history, and the install command that is still correct |
| `README.md:329` | status row: `npm view` list, `latest` `0.1.4`, broken `0.1.2`/`0.1.3`, "not re-run for `0.1.4`" | registry facts + publish history |
| `docs/publishing.md:6-8` | `**Status (`npm view` 2026-09-23)**` … `latest` is `0.1.4` | registry measurement; the date must not change |
| `docs/publishing.md:19-31` | `0.1.4` replaced the abandoned `0.1.3`; "profile boot has not been repeated for `0.1.4`" | publish history |
| `docs/publishing.md:79-80` | "No `0.1.1`…`0.1.4` git tag exists yet. The published npm line is `0.1.4`." | publish history |
| `docs/getting-started.md:124-131` | registry install at `0.1.4`; broken `0.1.2`/`0.1.3`; "not been repeated for this `0.1.4` command" | registry fact + history |
| `docs/getting-started.md:134` | `dsh plugin --profile demo add @buberlo/dsh-jev@0.1.4` | the correct registry install command |
| `docs/roadmap.md:117-118` | `**Registry line is `0.1.4`.**` + the `npm view` list | registry measurement |
| `docs/roadmap.md:125-128` | `0.1.4` replaced `0.1.3`; `npm install …@0.1.4` resolves `^0.1.4`; boot verified for `0.1.0` only | publish history + registry install |
| `docs/policy.md:86-90` | `@buberlo/jev-core@0.1.2` and `@0.1.4` include the call-scoped text; `latest` is `0.1.4` | registry fact about which *published* versions contain the wording |
| `docs/benchmark.md:362-366` | wording "landed in workspace `0.1.2` and is what registry `0.1.4` publishes" | historical attribution for a past workspace version, plus a registry fact |
| `docs/upstream-compatibility.md:11,25,29,37` | `[carried over]` convention wording; provenance row "registry line `0.1.4` 2026-09-23"; HEAD commit message "Bump workspace to 0.1.4" | the registry fact, its date, and a quoted git commit subject |
| `docs/upstream-compatibility.md:509-535` | the whole "Registry line is `0.1.4`" bullet: `npm view` list, publish history, `0.1.2`/`0.1.3` breakage, `0.1.4` replaced `0.1.3`, latest install resolution | registry facts + publish history |
| `packages/dsh-jev/README.md:20,25-28` | `add @buberlo/dsh-jev@0.1.4`; `^0.1.4`; the `0.1.2`/`0.1.3` warnings | registry install command and history |
| `docs/adaptation/06-docs.md:102,132,145,163,198` | earlier task-6 entries describing the registry `0.1.4` line | the change log's own record of a registry fact |
| `docs/adaptation/01-deps.md:19` | commit subject "Bump workspace to 0.1.4" | quoted commit message (foreign file; not mine to edit) |

### 11.3 Verified, not assumed

- **[executed]** the three manifests read back: `package.json`,
  `packages/jev-core/package.json`, `packages/dsh-jev/package.json` → all
  `version = 0.1.5`.
- **[executed]** `packages/dsh-jev/package.json` declares
  `"@buberlo/jev-core": "workspace:^"`. A grep for `workspace:^` over every
  `*.md` returns 14 hits, **all scoped to the published `0.1.2`/`0.1.3`
  tarballs**; no document claims the workspace publishes a literal
  `workspace:^`.
- **No pack run was needed**: `README.md:169` and `docs/publishing.md:30-31`
  already document that pnpm rewrites `workspace:`, and the packaging test
  (task-8) proves the packed manifests are installable.
- **[not re-run]** `pnpm install --frozen-lockfile --ignore-scripts`: the
  `version` field is not a resolution input and the Lead reported it still exits
  0; I did not re-run it for this docs-only task.
- **Not changed, per instruction**: no `npm view` date, no registry row, no
  `0.1.5` install instruction, no release/changelog entry for an unpublished
  version.

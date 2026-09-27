# 07 — Independent adversarial verification of the 0.1.7-rc.2 adaptation

Owner: `verifier` (task-7). Role: falsify the team's claims; a `NOT VERIFIED`
answer is a valid result, a fabricated `PASS` is the only real failure.

Environment actually used (not inherited from the other agents' reports):

```
Windows, PowerShell 7 (full-access file policy, no sandbox), node v24.16.0, pnpm 12.4.2
cwd: D:\dsh-plugins\dsh-jev
DSH_HOME=C:\Users\BananaPeel\AppData\Roaming\in.dsh-plug.dsh-launcher\homes\standard-2
bash on PATH: C:\Windows\System32\bash.exe   (WSL;   Git Bash is second: C:\Program Files\Git\usr\bin\bash.exe)
git HEAD: 87e29e27e1766dbb572a363b9a18bc13ea7196db
```

Full raw logs for every command are in `%TEMP%\dsh-verify\` (`01-` … `21-`).
This report quotes the verdict-bearing lines verbatim.

---

## 1. Verdict table

| # | Claim | How I tested it | Observed | Verdict |
|---|---|---|---|---|
| 1a | Every `@deepseek-ai/dsh-*` pin is `0.1.7-rc.2`, cordis `4.0.4`, schemastery `3.18.4` in `package.json`; nothing in `pnpm-lock.yaml` is `0.1.6-alpha.2`/`dsh-settings-file` | read all 6 workspace `package.json`; `pnpm list --depth 1 -r`; `Select-String` over `pnpm-lock.yaml` | all pins 0.1.7-rc.2 / 4.0.4 / 3.18.4; lockfile: `0.1.6-alpha.2` **0 hits**, `cordis@4.0.2` **0**, `3.18.2` **0**, `settings-file` **0** | **PASS** |
| 1b | Nothing in the *installed tree* resolves to 0.1.6-alpha.2 / 4.0.2 / 3.18.2 | wrote a BFS over every `@deepseek-ai/*` link in the repo tree, seeded from the 6 workspace `node_modules` + the `.pnpm` hoist layer (297 links, 256 node_modules dirs) | stale reachable entries: **0**; plugin package resolves cordis `4.0.4`, schemastery `3.18.4`, dsh-llm `0.1.7-rc.2` | **PASS** |
| 1c | No leftover duplicate Cordis / schemastery store dirs | `.pnpm` dir listing + per-link realpath scan | stale orphan subtrees **do** exist: `@deepseek-ai+cordis@4.0.2_@_4abe98…` (76 links), `@deepseek-ai+schemastery@3.18.2` (25), `@deepseek-ai+dsh-llm@0.1.6-alpha.2_@deepseek-ai+cordis@4.0.2` (20), `@deepseek-ai+dsh-settings-f_0262476b…` + `@deepseek-ai+dsh-settings-f_ee115da2…` (both `dsh-settings-file@0.1.6-alpha.2`); **none reachable**. The two `dsh-settings-file` dirs are *already disclosed* by `04-client.md:238-242`; the rest of the orphan set is not | **documented residual, incomplete in docs** → **D1** |
| 2a | `pnpm install --frozen-lockfile` is clean | ran it | `Lockfile is up to date, resolution step is skipped` / `Done in 25ms` / `EXIT=0` | **PASS** |
| 2b | `pnpm verify` passes | ran `pnpm verify` twice; read `scripts/verify.sh`; isolated the failure | **exit 2**: `scripts/verify.sh: line 4: set: pipefail: invalid option name` | **FAIL** → **D2** |
| 2c | No `verify.sh` stage silently skipped or no-op'd | ran `bash scripts/verify.sh` under **Git Bash** | all 9 stages really ran; install/build/typecheck/tests/evals/calibrate/4× examples exit 0; stage 9 (packaging) fails | **PARTIAL** (see D3) |
| 3a | jev-core: 85 tests | ran the suite | `Test Files 8 passed (8)` / `Tests 85 passed (85)` | **PASS** |
| 3b | dsh-jev: 62 tests in 7 files | ran the suite | `Test Files 7 passed (7)` / `Tests 62 passed (62)` | **PASS** |
| 3c | Zero delta; nothing skipped, deleted or weakened | `it(`/`test(` counts HEAD vs worktree for the 3 changed specs; skip/todo/only grep now **and** at HEAD; read the whole `git diff` of `tests/` | 13→13, 6→6, 6→6; **0** skip/todo/only both sides; `client-card` assertions strengthened (`toHaveBeenCalledWith([{op:'set',path:['skills','enabled'],value:true}])` + state assertion), `settings-section` rewritten 1:1 onto the new API | **PASS** |
| 4 | No new `as any` / `@ts-ignore` / `@ts-expect-error` / `eslint-disable` | `git diff -U0`, grepped the **added** lines (2445 of them); repo-wide grep; grep at `HEAD` | 0 matches added, 0 under `packages/*/src`, `tests` and `scripts` now, 0 at HEAD. `03-host.md`'s claim of "no matches" for `as unknown as Agent` in `src` also holds; its cited pre-existing cast is real at `examples/coding/src/dsh-runtime.ts:69` | **PASS** |
| 5a | `tools/pre-execute` handler is async and calls `next()` first | read the code | `src/adapters/assessment.ts:22-23`: `ctx.on('tools/pre-execute', async (exec: ToolExecution, next): Promise<PreToolDecision> => { const downstream = await next()` | **PASS** |
| 5b | No Jev decision can turn deny/cancel into allow | read the code | `assessment.ts:26` and `:120` early-return on `deny`/`cancel`; `jev-core/src/policy.ts:15-20` `ACTION_PRECEDENCE {allow:0,ask:1,hold:2,deny:3}` with `combineActions` = strictest-wins (line 28-34); `:134-135` default returns `downstream` unchanged; `withFailureAction` never returns an allow | **PASS** |
| 5c | `provider: live` without an explicit `apiKey` throws; `TYPESAFE_API_KEY` never read implicitly | read the code **and** reproduced it in the real 0.1.7-rc.2 product | `src/service.ts:247-251` throws; `src/settings-section.ts:60-64` refuses a committed write; `TYPESAFE_API_KEY` has **0** occurrences in `packages/dsh-jev/src/`. Real product: `jev (@buberlo/dsh-jev): Error: dsh-jev: provider "live" requires an explicit apiKey (never read from the environment implicitly)…` with the stack showing `at new JevRuntime (…/packages/dsh-jev/lib/service.js:43:26)` via `@deepseek-ai+cordis@4.0.4` | **PASS** |
| 5d | No `#private` field on the Cordis Service | read the code | `src/service.ts:51-75` `class JevRuntime extends Service` uses `private settingsValue/coreValue/entryConfig/states/catalogRevision`. `#` fields exist only in `src/state.ts:26` `class AgentState`, which is **not** a `Service` | **PASS** |
| 5e | No persistent decision cache | grep `cache`/`#` in `src/`; `git diff` for the one hit | only `src/adapters/model-routing.ts:22-31` — an **in-memory 30 s model-target catalog TTL** cache, file **unmodified** by this upgrade; no decision/approval is cached, approvals stay per call | **PASS** |
| 6a | `lib/client.js` is `window.__ModuleLoader__.load({id, factory})`, `inject` sorted `['configForms','locale','slots']`, resolves only react | own probe with stub globals, independent of the other agents | `id="@buberlo/dsh-jev"`, `keys=id,factory`, `factory arity=1`, `exports=apply,inject`, `inject(raw)=["slots","locale","configForms"]`, `inject(sorted)=["configForms","locale","slots"]`, `resolved module ids=["react","react/jsx-runtime"]`, `@deepseek-ai` string literals in the bundle: **none** | **PASS** |
| 6b | `exports`/`files` still publish the artifacts they claim | `npm pack --dry-run` (parsed) + manifest read | 31 files / 41.9 kB; `lib/index.js`, `lib/client.js`, `lib/types/index.d.ts`, `lib/types/client/index.d.ts`, `cordis.patch.yml`, `README.md`, `package.json` all present; no `src/`, no `tests/`, no `tsconfig` | **PASS** |
| 7a | `pnpm test:packaging` passes | ran it as part of the gate **and** standalone | `[packaging] FAILED` / `spawnSync pnpm ENOENT` / `[ELIFECYCLE] Command failed with exit code 1.` | **FAIL** → **D3** |
| 7b | …and if it fails, is it environmental? | minimal repro from an unrestricted shell; isolated each POSIX assumption | **not environmental.** `execFileSync('pnpm',…)` → `ENOENT spawnSync pnpm ENOENT`; `{shell:true}` → `12.4.2`; `'pnpm.cmd'` → `EINVAL`. With `shell:true` + `tsc.cmd` in a **scratch copy** the whole run passes | **FAIL as a repo defect** (pre-existing) |
| 7c | The packaging *substance* (tarball manifest, real plugin load, single Cordis, consumer types) | ran a scratch copy of the script (2 spawn fixes, no logic change) | `smoke: OK (standalone core, real plugin load, fail-closed enforcement, single cordis, client artifact)`, `tsc: no output (clean)`, `packaging test PASSED` | **PASS** (only with the scratch fix) |
| L1 | `settings-section.spec.ts` is hermetic: decoy / unset / ambient all identical, no writes outside temp, live home untouched | 4 runs (decoy-missing, `DSH_HOME` unset, decoy-empty, live ambient) + byte-level snapshots of `$DSH_HOME` and `~/.dsh` + decoy content check + temp-dir leak measurement | all four: `Tests 6 passed (6)`; live home and `~/.dsh` **byte-identical** after every run; the decoy stayed empty; 0 new temp dirs after a run | **PASS** |
| L2 | The client `inject` set asserted by `scripts/packaging-test.mjs:170` | loaded the real artifact myself | sorted `["configForms","locale","slots"]` — matches the assertion | **PASS** |
| L5 | `MessageSourceMap` augmentation is invisible to a package-root consumer | built a real consumer program (junctions + `tsc --noEmit`), with a positive control | `'dsh-jev' extends keyof MessageSourceMap` = `false`; `Type '"dsh-jev"' is not assignable to type '"user" \| "model" \| "tool" \| "system-prompt" \| "model-selection"'`; deep import blocked by the `exports` map. Positive control: `'model-selection'` (from `dsh-agent`) **is** visible ⇒ the probe works | **reproduced (invisible)** → **D4** |
| 8a | Docs label executed vs carried over honestly | read `upstream-compatibility.md` §"What is verified", §(a)/(b)/(c); re-ran `pnpm bench:compare` | every §(a) row I re-ran holds; §(b) is explicitly labelled `[carried over, 0.1.6-alpha.2]` with "do not quote this as a 0.1.7-rc.2 result"; §(c)4 says the gate was **not** run end to end (honest, unlike the Lead's summary) | **PASS** (with one stale row, see §5) |
| 8b | Delta report file:line claims traceable to the real artifacts | 5 spot-checks against the installed 0.1.7-rc.2 packages | all 5 exact (quoted in §4) | **PASS** |
| 8c | `03-host.md` §7.3b diagnoses the packaging blocker | isolated the failure | doc says "the harness file sandbox blocks named-pipe stdio … **not a repo defect**" — falsified | **FAIL** → **D5** |
| 9 | The real 0.1.7-rc.2 product can compose and mount this plugin | `dsh --version`; throwaway profile from the shipped template; `dsh plugin … add`; real boot with a bad `live` patch | `dsh --version` → `0.1.7-rc.2`; `--dump-config` prints `# == @buberlo/dsh-jev` + `- id: jev`; the boot **instantiated `JevRuntime`** through `cordis@4.0.4` and failed closed with the exact apiKey error, then stopped at `MISSING_CREDENTIAL: llm-deepseek` | **PASS** |

Overall: **1 FAIL (high, D2) · 2 FAIL (medium, D3 + D5) · 1 low-severity
behavioural finding (D4) · 1 low-severity documentation gap (D1) · everything else
PASS.**

---

## 2. Raw command output (verdict lines only)

### 2.1 `pnpm install --frozen-lockfile` — PASS

```
Scope: all 6 workspace projects
✓ Lockfile passes supply-chain policies
Lockfile is up to date, resolution step is skipped
Done in 25ms using pnpm v12.4.2
EXIT=0
```

### 2.2 `pnpm verify` — **FAIL (exit 2)**

```
$ bash scripts/verify.sh
w s l :  … localhost … WSL …
scripts/verify.sh: line 4: set: pipefail
: invalid option name
[ELIFECYCLE] Command failed with exit code 2.
EXIT=2
```

(That garbled first line is WSL's own Chinese notice about a localhost proxy; the
`pipefail` / `: invalid option name` split across two lines is the `\r` of the
CRLF checkout being treated as part of the token name.)

Isolation:

```
where.exe bash
  C:\Windows\System32\bash.exe            <- PATH winner (WSL)
  C:\Program Files\Git\usr\bin\bash.exe

git ls-files --eol scripts/verify.sh
  i/lf    w/crlf  attr/           scripts/verify.sh
git config --show-origin --get core.autocrlf
  file:C:/Program Files/Git/etc/gitconfig   true
(no .gitattributes in the repo)

# Git Bash, same CRLF file            -> reached-crlf / exit 0
# Git Bash, LF copy                   -> reached-lf   / exit 0
# PATH bash (WSL), LF copy            -> /bin/bash: C:…\lf.sh: No such file or directory / exit 127
# `git diff HEAD -- scripts/verify.sh` -> empty (script unmodified by this upgrade)
```

### 2.3 `bash scripts/verify.sh` under Git Bash — every stage but packaging

```
== install (frozen lockfile) ==   Done in 155ms using pnpm v12.4.2
== build ==                       ℹ lib\client.js 16.57 kB … ✔ Build complete in 58ms
== typecheck ==                   (no output = clean)
== unit + integration tests ==    jev-core  Test Files 8 passed (8)  Tests 85 passed (85)
                                  dsh-jev   Test Files 7 passed (7)  Tests 62 passed (62)
== offline evaluation (mock) ==   cases: 25, pass: 25, fail: 0
                                  regression: 9/9, held-out: 5/5
== threshold calibration ==       (output redirected to /dev/null by verify.sh; exit 0)
== examples ==                    coding / ops / game / dsh all ran; dsh stats: {"assessments":2,"asks":2,…}
== packaging test ==              [packaging] FAILED / spawnSync pnpm ENOENT / exit 1
VERIFY_GITBASH_EXIT=1
```

### 2.4 Packaging failure and its isolation — **D3**

```
$ pnpm test:packaging
[packaging] packing @buberlo/jev-core and @buberlo/dsh-jev
[packaging] FAILED
spawnSync pnpm ENOENT
[ELIFECYCLE] Command failed with exit code 1.

$ node -e "require('child_process').execFileSync('pnpm',['--version'],{stdio:'inherit'})"
execFileSync(pnpm) FAILED: ENOENT spawnSync pnpm ENOENT
$ node -e "…execFileSync('pnpm.cmd',['--version'],…)"
execFileSync(pnpm.cmd) FAILED: EINVAL
$ node -e "…execFileSync('pnpm',['--version'],{stdio:'inherit',shell:true})"
12.4.2
execFileSync(pnpm,{shell:true}) OK
```

Run from a **scratch copy** (`%TEMP%\dsh-verify\packaging-test-win.mjs`) with only
`shell: process.platform==='win32'` on the `run()` helper, `root` hard-set, and
`tsc` → `tsc.cmd`:

```
[packaging] running the runtime smoke (real DSH services + installed plugin)
smoke: OK (standalone core, real plugin load, fail-closed enforcement, single cordis, client artifact)
[packaging] type-checking a consumer that uses the published types
tsc: no output (clean)
[packaging] packaging test PASSED
PACKAGING_WIN_EXIT=0
```

### 2.5 Installed-resolution truth — PASS 1a/1b, residual (partly disclosed) 1c

```
pnpm list --depth 1 -r  →  @deepseek-ai/cordis@4.0.4, @deepseek-ai/schemastery@3.18.4,
                           every @deepseek-ai/dsh-*@0.1.7-rc.2, 340 packages in 6 projects
lockfile grep:  0.1.6-alpha.2 → 0 hits | 3.18.2 → 0 hits | settings-file → 0 hits
                4.0.2 → only '@types/deep-eql': 4.0.2 (unrelated)

.pnpm dirs (stale set):
  @deepseek-ai+cordis@4.0.2_@_4abe98197ded15ace7cf291156f5191a
  @deepseek-ai+dsh-llm@0.1.6-alpha.2_@deepseek-ai+cordis@4.0.2
  @deepseek-ai+schemastery@3.18.2
  @deepseek-ai+dsh-settings-f_0262476b19d775b7a3d2627d66d709fd   -> @deepseek-ai/dsh-settings-file@0.1.6-alpha.2
  @deepseek-ai+dsh-settings-f_ee115da2324d251a49e34e0513237e4f   -> @deepseek-ai/dsh-settings-file@0.1.6-alpha.2

reachability probe:  seeds 7 node_modules dirs, 256 node_modules dirs visited,
                     244 of 326 .pnpm install dirs reachable
                     "stale reachable entries: 0"
plugin-package resolution:
  @deepseek-ai/cordis       -> @deepseek-ai+cordis@4.0.4_@_f26b922a7ef2f8fed990b442fc983a03
  @deepseek-ai/schemastery  -> @deepseek-ai+schemastery@3.18.4
  @deepseek-ai/dsh-llm      -> @deepseek-ai+dsh-llm@0.1.7-rc.2_@deepseek-ai+cordis@4.0.4
```

### 2.6 Artifact contract — PASS

```
artifact: …\packages\dsh-jev\lib\client.js (16534 bytes)
first 200 chars: "window.__ModuleLoader__.load({\n\tid: \"@buberlo/dsh-jev\",\n\tfactory: (require) => {…"
loaded.id          = "@buberlo/dsh-jev"
exports keys        = apply,inject
inject (raw)        = ["slots","locale","configForms"]
inject (sorted)     = ["configForms","locale","slots"]
resolved module ids = ["react","react/jsx-runtime"]
require() specifiers in source: ["react","react/jsx-runtime"]
@deepseek-ai string literals  : []
PROBE: artifact contract OK
```

### 2.7 Settings-spec hermeticity — PASS

```
CASE A: DSH_HOME = <TEMP>\dsh-verify\decoy-home-does-not-exist   EXIT=0  Tests  6 passed (6)
CASE B: DSH_HOME unset                                           EXIT=0  Tests  6 passed (6)
CASE C: DSH_HOME = <TEMP>\dsh-verify\decoy-home-empty            EXIT=0  Tests  6 passed (6)
CASE D: DSH_HOME = <the live harness home>                       EXIT=0  Tests  6 passed (6)

live home diff (excluding sessions/storages/cache/attachments/rewind-snapshots/logs): empty
~/.dsh diff   (excluding sessions/storages/cache/attachments/logs/engram/mcp-skill-manager): empty
decoy dir created by the run? False
decoy-home-empty contents after the run: (nothing)
temp-dir leak: before run 25, after run 25, newly created and still present 0
```

Note: 25 pre-existing `%TEMP%\dsh-jev-settings-*` directories from **earlier agents'
runs** do exist (mtimes ≥ 17:11, the older fixture shape). They are not evidence of
a leak in the current spec: a fresh single run created 6 and removed all 6.

### 2.8 MessageSourceMap probe — reproduced

```
$ tsc -p %TEMP%\dsh-verify\msm\tsconfig.json
probe-deep.ts(3,21): error TS2307: Cannot find module '@buberlo/dsh-jev/lib/types/adapters/pre-step.js' or its corresponding type declarations.
probe-deep.ts(7,14): error TS2322: Type 'true' is not assignable to type 'false'.
probe-root.ts(10,14): error TS2322: Type 'true' is not assignable to type 'false'.
probe-root.ts(13,40): error TS2322: Type '"dsh-jev"' is not assignable to type '"user" | "model" | "tool" | "system-prompt" | "model-selection"'.
tsc exit=2
```

Positive control: `'model-selection'` **is** present in the map (declared by
`@deepseek-ai/dsh-agent/lib/types/model-selection.d.ts:10`), and it reaches the
probe only because `@buberlo/dsh-jev/lib/types/service.d.ts` imports
`@deepseek-ai/dsh-agent`. That proves transitive augmentations do propagate and
that the `dsh-jev` result is a real absence, not a probe artifact.

Cause: `lib/types/index.d.ts` re-exports only `./config.js`, `./service.js`,
`./state.js`; `src/index.ts` never imports `./adapters/pre-step.js`. The
augmentation file **is** shipped (`npm pack` includes
`lib/types/adapters/pre-step.d.ts`) but is unreachable through the `exports` map
(`"."`, `"./package.json"`, `"./client"` only).

### 2.9 Real 0.1.7-rc.2 product — PASS

```
$ dsh --version
0.1.7-rc.2

$ dsh --help              → launcher flags incl. --dump-config / --dump-config-schema / --patch

$ dsh jevprobe --from-default-profile web --dump-config        → exit 0, 1246 lines
$ dsh jevprobe --patch <repo>\packages\dsh-jev\cordis.patch.yml --dump-config
    1247: # == D:\dsh-plugins\dsh-jev\packages\dsh-jev\cordis.patch.yml
    1248: - id: jev
    1249:   name: '@buberlo/dsh-jev'

$ dsh plugin --profile jevprobe add D:\dsh-plugins\dsh-jev\packages\dsh-jev
    + @buberlo/dsh-jev link:D:/dsh-plugins/dsh-jev/packages/dsh-jev     (exit 0)
$ dsh jevprobe --dump-config  → 1247: # == @buberlo/dsh-jev
                                1248: - id: jev
                                1249:   name: '@buberlo/dsh-jev'

$ dsh jevh --patch <bad-live.yml> probe        (60 s hard cap; exited by itself)
dsh: warning: 1 entry did not activate
jev (@buberlo/dsh-jev): Error: dsh-jev: provider "live" requires an explicit apiKey
  (never read from the environment implicitly); set provider to "mock", mode to "off",
  or pass apiKey explicitly
    at createProvider (file:///D:/dsh-plugins/dsh-jev/packages/dsh-jev/lib/service.js:205:15)
    at createCore (file:///D:/dsh-plugins/dsh-jev/packages/dsh-jev/lib/service.js:179:19)
    at new JevRuntime (file:///D:/dsh-plugins/dsh-jev/packages/dsh-jev/lib/service.js:43:26)
    at Fiber.execute (…/@deepseek-ai+cordis@4.0.4_@_f26b922a7ef2f8fed990b442fc983a03/node_modules/@deepseek-ai/cordis/lib/index.js:1068:24)
    at file:///C:/Users/BANANA%7E1/AppData/Local/Temp/dsh-verify/dsh-cli-home2/profiles/jevh/#jev
    at file:///C:/Users/BANANA%7E1/AppData/Local/Temp/dsh-verify/dsh-cli-home2/profiles/jevh/#include
dsh: MISSING_CREDENTIAL: llm-deepseek: no API key for provider route "deepseek-official"; …
```

What I created (throwaway only, nothing of the user's was touched): profiles
`jevprobe` and `jevh` under `%TEMP%\dsh-verify\dsh-cli-home{,2}`. The live home
and `C:\Users\BananaPeel\.dsh` were byte-identical before/after, and no new file
appeared under `C:\Users\BananaPeel` (the `.unity_skills` directory that changed
there at 17:24 is unrelated to DSH).

### 2.10 Docs spot-checks (delta report ↔ real artifacts) — PASS

| doc claim | actual file:line |
|---|---|
| `dsh-tools/lib/types/index.d.ts:47` = `'tools/pre-execute'(this: Scoped<ToolRuntime>, exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision>` | exact match |
| `dsh-settings/lib/types/index.d.ts:27` = `settings: SettingsForms`; `:96` = `describe(options?: SettingsDescribeOptions): SettingsDescriptor[]`; `installSection` → 0 hits | exact match, 0 hits |
| `dsh-llm/lib/types/message.d.ts:213` = `createUserMessage`; `:232` = `createSystemMessage(text: string): SystemMessage` | exact match |
| `config-form.d.ts:96` `configForms: ConfigForms`; `:106` `class ConfigForms extends Service`; `:142` `get<T>(entryId: string): ConfigForm<T>` | exact match |
| `dsh-llm/lib/types/message.d.ts:96-99` — no shared catch-all `plugin` kind | exact match |
| `tests/client-card.spec.ts` → `dsh-client-ui-settings/lib/client.js:1152-1170` (`set(field,value){return this.mutate([{op:"set",path:[field],value}])}`) | `client.js:1152-1158` exact |
| `tests/client-card.spec.ts` → `dsh-settings/lib/types/types.d.ts:44-54` ("creating intermediate objects") | `types.d.ts:43-54` exact |

`pnpm bench:compare` re-run for the §(a) row: `BENCH_EXIT=0`, functional columns
`base modelReq=2 toolRuns=1 | mock enforce restrict=2 tool schemas 1,279 B vs
2,180 B | hold variant toolRuns=0 ask=1`, `D jev live shadow NOT EXECUTED
(TYPESAFE_API_KEY not set)`.

---

## 3. Defects

### D1 — Stale duplicate store dirs in `node_modules/.pnpm`: disclosed for two of them, not for the rest (severity: **low**)

*Owning file:* none in the repo (local install state). The lockfile claims are
**correct** — `package.json` and `pnpm-lock.yaml` really do have zero
`0.1.6-alpha.2` / `dsh-settings-file` references, and
`docs/adaptation/04-client.md:238-242` already states the residual honestly and
accurately:

> "Residual, stated rather than hidden: `node_modules/.pnpm` still holds two
> orphaned directories named `@deepseek-ai+dsh-settings-f_*` whose nested
> `package.json` says `0.1.6-alpha.2`. They are unreferenced by the lockfile
> (pnpm does not always prune the store on install) and nothing resolves them".

My independent scan **confirms that paragraph** and shows the orphan set is
larger than the two directories it names — same class, same zero reachability.

Minimal reproduction:

```powershell
Get-ChildItem node_modules\.pnpm -Directory | ? { $_.Name -match 'cordis@4\.0\.2|schemastery@3\.18\.2|settings-f_|0\.1\.6-alpha\.2' } | % Name
```

Expected: only 4.0.4 / 3.18.4 / no settings-file dir.
Observed additionally: `@deepseek-ai+cordis@4.0.2_@_4abe98…` (76 symlinks resolve
into it), `@deepseek-ai+schemastery@3.18.2` (25), and
`@deepseek-ai+dsh-llm@0.1.6-alpha.2_@deepseek-ai+cordis@4.0.2` (20).

Impact: **none at runtime** — a BFS over all 297 `@deepseek-ai/*` links from the
workspace roots plus the `.pnpm` hoist layer reaches stale versions **0 times**;
`pnpm install --frozen-lockfile` does not prune them because it skips the
resolution step entirely ("Lockfile is up to date, resolution step is skipped").
So both copies of each duplicate exist on disk, but only the 4.0.4 / 3.18.4 /
0.1.7-rc.2 one is ever linked. Suggested action: extend the `04-client.md:238`
paragraph to name the full orphan set and note that a `--force` reinstall clears
it, or simply leave it — the current disclosure is not misleading.

### D2 — `pnpm verify` fails on this checkout (severity: **high**)

*Owning files:* `scripts/verify.sh` (+ optional new `.gitattributes`).

Minimal reproduction: `pnpm verify` → **exit 2**, before any stage runs.

```
scripts/verify.sh: line 4: set: pipefail: invalid option name
```

Two independent causes, both environmental-but-real, neither introduced by the
0.1.7-rc.2 upgrade (`git diff HEAD -- scripts/verify.sh` is empty):

1. `bash` resolves to `C:\Windows\System32\bash.exe` (WSL). Linux bash does not
   tolerate the trailing `\r`.
2. `scripts/verify.sh` is checked out **CRLF** (`git ls-files --eol` → `i/lf
   w/crlf`) because `core.autocrlf=true` comes from
   `C:/Program Files/Git/etc/gitconfig` and the repo ships no `.gitattributes`.

The same script passes stages 1-8 under Git Bash (`& 'C:\Program Files\Git\usr\bin\bash.exe' scripts/verify.sh`)
and then hits D3. Consequence for this team: **no one has run `pnpm verify` to
completion on this machine**, so every "the gate passes" statement is unbacked.
`docs/upstream-compatibility.md` §(c)4 is honest about this; the Lead's summary
("`pnpm verify` passes") is not.

### D3 — `scripts/packaging-test.mjs` cannot run on Windows (severity: **medium**)

*Owning file:* `scripts/packaging-test.mjs` — `run()` at lines 26-32 (no `shell`),
the `pnpm pack` spawn at line 43, and the `tsc` shim at line 203.

Minimal reproduction (from an unrestricted shell — **not** a sandbox artifact):

```
node -e "require('child_process').execFileSync('pnpm',['--version'],{stdio:'inherit'})"            → ENOENT spawnSync pnpm ENOENT
node -e "require('child_process').execFileSync('pnpm.cmd',['--version'],{stdio:'inherit'})"        → EINVAL
node -e "require('child_process').execFileSync('pnpm',['--version'],{stdio:'inherit',shell:true})" → 12.4.2
```

`pnpm` on Windows is `pnpm.cmd`; `execFileSync` without a shell does not run it
(and Node refuses `.cmd`/`.bat` without a shell since the CVE-2024-27980 fix).
`join(consumer,'node_modules','.bin','tsc')` is likewise the extensionless sh shim.

Expected: `[packaging] packaging test PASSED`. Observed: `spawnSync pnpm ENOENT`,
exit 1. The script is **pre-existing** in this shape at HEAD (the upgrade only
changed `DSH_VERSION`, `CORDIS_VERSION` and the `inject` assertion), but it means
the packaging stage of the documented gate never runs on Windows. Its *substance*
is green once the two spawn issues are fixed in a scratch copy (§2.4) — so the
defect hides three real checks rather than the checks being broken.

### D4 — The `MessageSourceMap` augmentation is absent from the published type surface (severity: **low**)

*Owning file:* `packages/dsh-jev/src/adapters/pre-step.ts:33-38` (declaration) and
`packages/dsh-jev/src/index.ts:14-21` (no re-export of it).

Minimal reproduction: §2.8. Expected: a consumer that only imports
`@buberlo/dsh-jev` can name `kind: 'dsh-jev'`. Observed:
`Type '"dsh-jev"' is not assignable to type '"user" | "model" | "tool" |
"system-prompt" | "model-selection"'`, and the declaring file cannot even be
deep-imported (`exports` map = `"."`, `"./package.json"`, `"./client"`).

Impact: types only. The plugin's own build sees the augmentation (it is in
`src/**`), the runtime behaviour is unaffected, and no consumer needs to *emit*
`kind: 'dsh-jev'` — upstream explicitly says consumers fall through unknown
kinds. It is still a gap between the doc comment ("the pattern 0.1.7-rc.2 requires
of every producer") and the shipped `.d.ts`.

### D5 — `03-host.md` §7.3b misdiagnoses the packaging blocker (severity: **medium**, docs accuracy)

*Owning file:* `docs/adaptation/03-host.md:673-689`.

> "This is an **environment limitation, not a repo defect**: the harness file
> sandbox blocks named-pipe stdio, so `scripts/packaging-test.mjs` cannot
> `spawnSync` its `pnpm pack` child (`ENOENT`/`EPERM` at the documented boundary)."

Falsified by §2.4: the identical `spawnSync pnpm ENOENT` reproduces from a shell
with no sandbox at all, and the actual cause is the Windows `.cmd` shim + a
shell-less `execFileSync` (D3). Severity medium because this is the only place the
blocker is documented, and it tells the next reader not to look for a repo defect.

---

## 4. Things I could NOT verify, and why

1. **The pre-fix non-hermeticity of `settings-section.spec.ts`.** The HEAD version
   imports `@deepseek-ai/dsh-settings-file`, which no longer exists in the tree, so
   it cannot be executed at 0.1.7-rc.2. I verified the *post-fix* hermeticity
   (4 cases identical, live home untouched); I did not reproduce the counterfactual
   failure.
2. **`pnpm calibrate` did anything.** `verify.sh:23` redirects it to `/dev/null`;
   I only observed exit 0 under `set -e`. Its printed output was never seen.
3. **`@deepseek-ai/dsh-client-test-runtime@0.1.7-rc.2` importability** (the
   `ERR_MODULE_NOT_FOUND` claim, `docs/adaptation/05-tests.md` §5) — not re-run.
4. **Behavioural equivalence of the changed upstream `lib/*.js`** for
   `dsh-tools`/`dsh-agent`/`dsh-settings`/`dsh-session`/`dsh-client-*`
   (`upstream-compatibility.md` §(c)3) — deliberately out of scope; I checked
   declarations only, which is what the delta report claims.
5. **The browser → Host write round trip** — no browser; the client half is
   verified at the artifact and controller-double level only.
6. **The six package names in `package.json` → `dsh.client.inject`.** I verified
   the *service* names in the emitted artifact; I did not mount the web client, so
   the manifest package list is unverified as a resolution claim.
7. **A pristine-machine `pnpm install --frozen-lockfile`.** I could not delete
   `node_modules` (other agents were still working), so I cannot prove that a
   clean install never creates the D1 orphans — only that the committed lockfile
   cannot be their source (0 references) and that `--frozen-lockfile` does not
   prune them.
8. **Whether the real product mounts the plugin's *client* half.** The real boot
   proves the host half mounts; the web UI was never served.
9. **`fnm`/other Node versions** — single machine, node v24.16.0 only.

---

## 5. Corrections to the docs (not defects — a re-run changed the answer)

* `docs/upstream-compatibility.md` §(c)1 ("**Any** `dsh` profile boot,
  `--dump-config`, or served web client at `0.1.7-rc.2` … no profile was composed
  or booted from it") was accurate when written and is now **stale**: I composed a
  throwaway profile from the shipped template, installed this local package into it
  (`dsh plugin --profile … add`), dumped the composed tree with the bundle layer,
  and booted it — the real 0.1.7-rc.2 product instantiated `JevRuntime` through
  `cordis@4.0.4` and failed closed exactly as designed (§2.9). The Lead should move
  that row to §(a). The served-web-client part of the row remains unverified.
* `docs/upstream-compatibility.md` §(c)4 lists "the examples" as not executed;
  they **were** executed and passed in my Git Bash gate run (§2.3). The
  `pnpm test:packaging` and whole-`pnpm verify` parts of that row are correct and
  remain unexecuted (they fail — D2/D3).
* `docs/adaptation/01-deps.md:372-380` ("`pnpm test` was **not** re-run post-bump …
  the real post-fix test counts will differ from the baseline 85 + 62 and must be
  re-measured") is stale in the other direction: the counts **were** re-measured
  and are exactly 85 + 62 (measured twice, once inside the Git Bash gate and once
  standalone), and the examples did run and pass.
* `AGENTS.md` was ` M` at session start with "dsh-jev 56 passing, 6 pending"; it is
  now clean at HEAD and reads "core 85, dsh-jev 62", matching my measured counts.
  This is `docs-adapt` finishing its reconciliation, not a defect.
* `docs/adaptation/04-client.md:238-242` accurately discloses the orphaned
  `dsh-settings-file` store directories; D1 only asks for the remaining orphan
  names (`cordis@4.0.2`, `schemastery@3.18.2`, `dsh-llm@0.1.6-alpha.2`) to be
  mentioned alongside them.

---

## 6. One-line overall verdict

**The adaptation is real and green where it can be executed — pins/lockfile, both
typechecks, both test suites (85 / 62, zero skips or weakened assertions), no added
type suppressions, the AGENTS.md hard rules, the `lib/client.js` contract, the
published file set, settings-spec hermeticity, and a genuine mount of the plugin
inside the real 0.1.7-rc.2 product all verify — but the headline "`pnpm verify`
passes" claim is FALSE on this checkout (WSL `bash` + CRLF `verify.sh` → exit 2),
`pnpm test:packaging` fails from a pre-existing Windows shell-less `execFileSync`,
the installed tree still carries orphaned `0.1.6-alpha.2`/`4.0.2`/`3.18.2` store
dirs (unreachable, hygiene only), the `MessageSourceMap` augmentation never reaches
a package-root consumer, and `03-host.md` §7.3b misdiagnoses the packaging failure
as a sandbox limitation.**

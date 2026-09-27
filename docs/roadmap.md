# Roadmap

Status is honest: implemented and tested, implemented with limits, or planned.
Nothing here is a promise of a release.

## Implemented and tested

- `@buberlo/jev-core`
  - TypeSafe primitives re-exported with boundary validation (missing answers,
    unknown candidates, invalid numbers, wrong answer types, invalid
    distributions; Noul confidence never invented).
  - Deterministic `MockJevProvider`; `LiveTypeSafeProvider` with explicit API
    key, SDK-owned retries, `off` logging by default, and error classification
    (auth, permission, rate limit, bad request, timeout, aborted, connection,
    server).
  - `evaluate()`, `selectTools()`, `assessToolCall()`, `routeSkills()`,
    `routeModel()`, serializable decision rules, monotonic decision precedence.
  - Bounded concurrency, whole-call budget, cancellation, redaction/bounding,
    deterministic loop detector.
- `@buberlo/dsh-jev`
  - Real Cordis service `ctx.jev` (default class plugin with schemastery
    `Config`), bundle patch, verified bundle/profile install path.
  - Per-agent state with disposal; two-session isolation.
  - Dynamic tool selection with scoped `tools.restrict` and a defined recovery
    path.
  - Call assessment on the async `tools/pre-execute` waterfall with approval
    composition and no premature allow.
  - Observe-only result counting plus a deterministic monotonic loop guard.
  - Model routing on `agent/request` with catalog verification and fallback.
  - Skill routing with bounded hint injection.
  - Explicit `off` / `shadow` / `enforce` modes and `mock` / `live` providers.
- Examples: coding, read-only ops, standalone game (core only), real DSH
  runtime.
- Vendored TypeSafe agent skill (`.agents/skills/typesafe-ai`, pinned upstream
  commit + license) with real-provider discovery and routing tests, a
  configured routing-hint overlay, and de/en evaluation cases.
- Web client configuration page for the bundle (`plugins.bundle.config`):
  provider/mode/feature state plus immediate writes through the config-forms
  service, whose document is the active profile's Cordis patch. Covered at
  `0.1.7-rc.2` by the real end-to-end host-side settings test (`settings-section`,
  hermetic — it pins `DSH_HOME` to a temp home and restores the environment), by
  the card spec against the real `ConfigForm` contract, and by loading the
  emitted `lib/client.js`; the in-browser → Host call is not executed. The "a
  running `web` profile serves the client module" proof was obtained at
  `0.1.6-alpha.2` and has **not** been re-executed at `0.1.7-rc.2`.
- First live TypeSafe evaluation (2026-09-19, `jev-1.13.0`): 15/15 fixture
  agreement, 0 errors, mean 528 ms — recorded as a measurement in
  `docs/evaluation.md`.
- Manual publish runbook (`docs/publishing.md`) and a test-only CI workflow
  (`.github/workflows/verify.yml`); no release or deployment automation.
- Evaluation dataset grown to 25 de/en cases (negations, injection, duplicate
  category membership, all-restricted catalogs, below-threshold picks, task
  mismatch, risk-score non-gating) and a threshold calibration sweep
  (`pnpm calibrate`) with a first live measurement.
- Registry distribution: `dsh plugin add @buberlo/dsh-jev` at `0.1.0` verified
  end to end (profile layer, host load, served client module). Later registry
  copies of the plugin (`0.1.2`, `0.1.3`) do not install (`workspace:^`); see
  the publish note below.
- Benchmark harness: deterministic with/without-Jev comparison executed
  (`pnpm bench:compare`), the CLI A/B harness executed against OpenCode Go
  (`deepseek-v4.1-flash`, 10 runs/variant), and a use-case measurement with
  video: baseline destroyed the audit trail in 4/10 runs, live Jev denied
  every attempt (0/10 executions, file intact 10/10) at ≈ +6.7 s/turn. The
  use case also exposed and fixed assessment-question false positives on
  harmless reads. Results, videos and limits in `docs/benchmark.md`.
- Packaging test: tarballs in a fresh consumer, real plugin load, consumer
  typecheck, single-Cordis check.
- Real `dsh` CLI profile composition and loader instantiation.
- On-prem support regression set: the Kubernetes demo's scoped reads, broad
  allow-all patch, narrow ingress repair, deny-all reset, missing target, and
  oversized incident report are labeled cases. Offline tests run them through
  the real `tools/pre-execute` gate. An accepted incident summary is at most
  900 characters, which fits the default argument bound; arguments that do
  not fit are incomplete input and are not transmitted.

## Implemented with documented limits

- **Code mode / PTC**: nested sub-dispatches traverse the same assessment gate
  (tested), but a full PTC runtime was not mounted; `mode: ptc` additionally
  requires `@deepseek-ai/dsh-ptc-runtime-node` or equivalent.
- **Model routing**: availability uses the live provider catalog, which DSH
  documents as advisory; absence falls back rather than routing anyway.
- **Skill routing**: injects a bounded hint only; automatic skill body loading
  is not attempted (the normal skill mechanism remains in charge).
- **Web client page**: edits mode, provider, the write-only API key, and
  feature toggles; model and base URL are not exposed as form fields. It shows
  configured state, not live counters (see the blocked Remote capability in
  `docs/upstream-compatibility.md`). The **real in-browser → Host write round
  trip is not executed** here (no browser): the write path is proven on the host
  side against the real settings stack and on the artifact side by loading the
  emitted `lib/client.js` (`docs/adaptation/04-client.md` §5, §7, §9.2).
- **Settings form writes**: a row installed by a patch layer `insert` — how
  `cordis.patch.yml` installs this bundle — is form-editable; a row existing only
  in the leaf `cordis.yml` is not (the editor's "overridden by a home patch or
  command-line overlay" message is misleading in both cases). A non-string
  `apiKey` (e.g. an unevaluated `!!js` expression) is refused rather than judged
  (`docs/adaptation/04-client.md` §7, §9.1).
- **Message-source kind visibility**: the plugin's own `'dsh-jev'` message-source
  kind is declared by module augmentation in the module that produces the
  message, so a downstream consumer importing only the package root does not see
  it in the union. Benign — nothing downstream names the kind and consumers fall
  through unknown kinds; the measured remedy was deliberately not taken
  (`docs/adaptation/03-host.md` §1.2).
- **Client test runtime**: the published
  `@deepseek-ai/dsh-client-test-runtime@0.1.7-rc.2` still cannot be loaded from
  npm. It imports renderer `src/` paths the published renderer does not ship,
  and a second import (`dsh-api-session-controller/src/client/scope.ts`) points
  at a package whose published tarball ships no `src/` either; the direct import
  fails with `ERR_MODULE_NOT_FOUND` (executed — `docs/adaptation/05-tests.md`
  §5). The browser tests therefore exercise `apply()` and the component
  directly.
- **The repo's own `pnpm typecheck` gate compiles `src/**` only**, so a stale
  type-only import inside `tests/**` is invisible to it. Pre-existing; the
  upgrade caused one such import (fixed) and three others were already there
  (`docs/adaptation/05-tests.md` §4.2).
- **Live provider**: fully implemented, not executed here (no credentials).
- **Registry line is `0.1.4`.** `npm view` 2026-09-23 lists `0.1.0`,
  `0.1.2`, `0.1.3`, and `0.1.4`; `latest` is `0.1.4` for both packages. The
  **workspace** is now `0.1.5` (this adaptation, **not yet published**), so the
  registry line above still governs every install. Local `0.1.1` added package
  READMEs and was never
  published. Workspace `0.1.2` fixed the assessment question wording measured
  by the use case (read false positives). `@buberlo/dsh-jev@0.1.2` on npm
  still has a literal `workspace:^` dependency and does not install; do not
  recommend it. `0.1.3` was abandoned after a granular bypass-2FA token
  staged it (E409), and the visible `0.1.3` plugin tarball has the same
  `workspace:^` break. `0.1.4` replaced it: `npm install @buberlo/dsh-jev@0.1.4`
  resolves `@buberlo/jev-core@^0.1.4`. The DSH profile boot was verified for
  `0.1.0` only. Publish stays manual (`docs/publishing.md`).
- **Thresholds are uncalibrated defaults**; `pnpm calibrate` now reports the
  region they sit in, but the 25-case sample cannot separate values inside it.
  Real calibration needs labeled cases per consequence class. The on-prem
  regression set is not folded into that sweep, and its labels did not
  retune thresholds or assessment wording.
- **On-prem live measurement is opt-in and was not executed here.**
  `TYPESAFE_API_KEY=... pnpm evals -- --live` reports unsafe executions,
  false denials, approval requests, incident completion, and latency for the
  regression split and the held-out variants. Without a key it prints
  `NOT EXECUTED` and exits 0. Mock answers in that set prove plumbing only.
  The recorded deny-all reset false positive (restriction noul 0.940) remains
  a measurement target: the labeled decision is allow, and a high violation
  score still denies.

## Planned (not implemented)

### Next milestone

1. **Runnable Kubernetes support example.** Reuse the existing real DSH
   approval service for per-call decisions, show the target and proposed
   mutation, and document the path from scoped diagnostics through shadow
   observation to deliberate enforcement. Verify changed arguments, rejection,
   cancellation, and missing approval input against the disposable cluster.
2. **Repeatable comparison and adoption docs.** Add an opt-in cluster regression
   command around the recorded replay, preserving the fast offline gate.
   Document setup, cleanup, supported scope, and evidence limits. Compare
   autonomous planners under matching instructions separately from replay so
   safer planner choices are not attributed to an execution gate.

### Later

- Labeled calibration corpus with enough cases per consequence class to narrow
  the reported threshold ranges.
- Per-category pre-selection with a documented second-stage ranking for very
  large taxonomies (> 255 candidates) beyond the current chunking.
- An approval-answerer example for headless DSH deployments.
- Optional evaluation against a recorded session fixture for regression
  comparisons.

## Out of scope

Training or self-hosting Jev, a DSH fork, a dashboard/database, a general MCP
platform, and any automatic deployment or release pipeline.

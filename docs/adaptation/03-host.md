# 03 — Host-plane (non-settings) adaptation: DSH 0.1.6-alpha.2 → 0.1.7-rc.2

Task: `task-3` (owner `host-adapt`).

Scope, final (superseded twice by the Lead during this task):

- **Owned and edited:** `packages/dsh-jev/src/adapters/pre-step.ts`.
- **Owned, verified unchanged:** `packages/dsh-jev/src/index.ts`,
  `packages/dsh-jev/src/state.ts`, `packages/dsh-jev/src/adapters/assessment.ts`,
  `packages/dsh-jev/src/adapters/observation.ts`,
  `packages/dsh-jev/src/adapters/model-routing.ts`,
  `packages/dsh-jev/src/usecases/kubernetes-support.ts`,
  `examples/coding/src/dsh-runtime.ts`, `examples/coding/src/index.ts`.
- **Transferred out of this task:** `src/config.ts` and `src/service.ts` →
  `task-4` (`settings-adapt`); `src/settings-section.ts` and `src/client/**` →
  `task-4`; `tests/**` and `bench/**` → `task-5` (`test-adapt`).
  I did not edit any transferred file. The Lead was told this explicitly.

Provenance: every claim below is **[executed]** (a command ran and this is its
literal observed outcome), **[read]** (an installed declaration or shipped
implementation was read in this session, with `file:line`), or **[inferred]** (a
conclusion drawn from those reads, not from running the thing). No claim of a
green gate is made for a gate I did not see green.

Environment: `node v24.16.0`, `pnpm 12.4.2`, Windows, repo
`D:\dsh-plugins\dsh-jev`, `node_modules` pre-installed at 0.1.7-rc.2.
Raw logs: `%TEMP%\jev-adapt\t3-*.log`.

Inputs used: `docs/adaptation/01-deps.md` (task-1 error inventory) and
`docs/upstream-delta-0.1.7-rc.2.md` (task-2 evidence report; §3.5, §3.7, B-3,
§11). B-3 already proposed this fix mechanism; the semantic argument for it is
made independently in §2 below.

**Result in one line:** the plugin's skill-hint message now declares its own
`kind: 'dsh-jev'` by module augmentation instead of the deleted
`kind: 'plugin'`; the host typecheck and the full package build are **green**;
and the final test tally is **`@buberlo/jev-core` 85 / `@buberlo/dsh-jev` 62,
zero delta from the pre-upgrade baseline**.
*(An earlier draft of this line reported a mid-run 56-test tally with
`settings-section.spec.ts` failing to collect. That observation was accurate when
written and is **superseded** — see §7.1 and §9.)*

### The two answers a reader should be able to find in ten seconds

**(a) Exact `source.kind` old → new mapping.** The skill-hint message in
`runSkills` (`src/adapters/pre-step.ts:253`) changed from

```ts
{ kind: 'plugin', plugin: 'dsh-jev', form: 'notice', summary: `skill: ${result.skill}` }
```
to
```ts
{ kind: 'dsh-jev', form: 'notice', summary: boundContextSummary(`skill: ${result.skill}`) }
```

plus a new module augmentation in the same file (`:23-38`) contributing the
member `'dsh-jev': { kind: 'dsh-jev' } & ContextFormed` to `MessageSourceMap`.

Proving declaration, verbatim
(`packages/dsh-jev/node_modules/@deepseek-ai/dsh-llm/lib/types/message.d.ts:94-108`):

```ts
/**
 * Where a message (or injected content) came from, in the harness's own
 * vocabulary. Merge-extensible sum type — each producer declares its own
 * `kind` in its own module; there is no shared catch-all `plugin` kind.
 * Model and tool sources answer their role messages; user messages carry any
 * producer's kind, and consumers fall through unknown kinds.
 */
export interface MessageSourceMap {
    user: { kind: 'user' };
    model: ModelMessageSource;
    tool: ToolMessageSource;
    'system-prompt': SystemPromptMessageSource;
}
```

`'plugin'` is gone and `dsh-llm` declares no generic replacement, so the only
correct construct is for the plugin to declare itself. Full argument, with every
rejected alternative, in **§2.3**: `user` would additionally make the hint text
*displace the real task* in the next step's snapshot; `skill-invocation` requires
`form: 'instructions'` and a user-invocable `name`, and would claim a skill body
had been injected; `model-selection`, `user-approval`, `ptc-mode` and
`tool-registry` are other subsystems' producer identities.

**(b) Deliberate decision: the plugin does *not* supply `displayReason?`
on `ask`.** No — because (1) the plugin has no user-facing prose to supply, only
deterministic rule id + measured values as `AGENTS.md` requires, so
`{ en: reason }` would resolve to the same string anyway; (2) there is no
host-side locale dictionary to translate with, so shipping `{ en }` alone would
advertise a localization that does not exist; (3) omitting it is neither a
regression nor a fail-open, since the client falls back to `reason`. Full
reasoning in **§4**.

### Acceptance criteria — where each is discharged

| Criterion | Evidence |
| --- | --- |
| No `tsc` diagnostic in any file I own | §7.2: `TSC_EXIT=0` (whole package clean, task-4's diagnostics also resolved) |
| Zero new `as any` / `@ts-ignore` / `@ts-expect-error` in my files | §7.4: grep, no matches |
| The `source.kind` choice is justified semantically, with the declaration quoted | §1.2 (verbatim `message.d.ts:94-108`), §2.3 (every alternative refuted) |
| Every edited line has a reason+impact entry | §1.1-§1.4 |
| Behaviour-relevant consequences stated | §1.3 (120-char `summary` bound), §2.4 (runtime delta), §1.2 (reachability) |
| Rest of the extension points verified, not speculated | §3 (15 rows, each with an installed `file:line`) |
| `displayReason` decision recorded with a reason | §4 (declined, four grounds) |

### Corrections applied after independent verification (task-9)

`docs/adaptation/07-verification.md` reproduced almost everything above, but
falsified one diagnosis and found two stale readings. All three are corrected in
place, with the original observations preserved and labelled:

| Was | Now |
| --- | --- |
| §7.3b: the packaging failure is a sandbox/piped-stdio limitation, "not a repo defect" | **Misdiagnosis, falsified.** Pre-existing Windows defect in `scripts/packaging-test.mjs` (shell-less `execFileSync('pnpm', …)`; on Windows pnpm is `pnpm.cmd`). The test's substance is green once those spawns are fixed. Cause attributed to the verifier; fix owned by task-8. |
| §1/§9/§10: full suite at 56 tests with `settings-section.spec.ts` failing to collect | **Superseded.** Final counts re-measured by me: jev-core 85, dsh-jev 62, zero delta, all 7 dsh-jev files passing. Mid-run numbers kept and labelled. |
| §1.2: reachability limit left as an open question for the Lead | **Decided: do not widen.** Recorded as a deliberate, documented limit with the rationale (§1.2). The verifier reproduced the finding with a positive control. |

---

## 1. The one source change

### 1.1 `src/adapters/pre-step.ts:17` — import the bound and the form mixin

| | |
| --- | --- |
| Before | `import { createUserMessage } from '@deepseek-ai/dsh-llm'` |
| After | `import { boundContextSummary, createUserMessage, type ContextFormed } from '@deepseek-ai/dsh-llm'` |

**Why:** `ContextFormed` is needed by the augmentation in 1.2; `boundContextSummary`
by the `notice` form in 1.3. Both are exported by the installed package
[read]: `dsh-llm/lib/types/message.d.ts:75` (`ContextFormed`), `:120`
(`boundContextSummary`). `verbatimModuleSyntax` is on (`tsconfig.base.json:14`),
so the type-only specifier carries the inline `type` modifier.

**Impact:** compile-only.

**Verified [executed]:** `pnpm --filter @buberlo/dsh-jev exec tsc -p tsconfig.json --noEmit`.

### 1.2 `src/adapters/pre-step.ts:23-38` — declare the plugin's own source kind

```ts
declare module '@deepseek-ai/dsh-llm' {
  interface MessageSourceMap {
    /** Context injected by the `dsh-jev` plugin. */
    'dsh-jev': { kind: 'dsh-jev' } & ContextFormed
  }
}
```

**Why:** required by 0.1.7-rc.2. The plugin previously wrote
`source: { kind: 'plugin', plugin: 'dsh-jev', … }`. The shared catch-all `plugin`
member was **deleted**. Installed declaration, quoted verbatim
[read] `packages/dsh-jev/node_modules/@deepseek-ai/dsh-llm/lib/types/message.d.ts`:

```
 94  /**
 95   * Where a message (or injected content) came from, in the harness's own
 96   * vocabulary. Merge-extensible sum type — each producer declares its own
 97   * `kind` in its own module; there is no shared catch-all `plugin` kind.
 98   * Model and tool sources answer their role messages; user messages carry any
 99   * producer's kind, and consumers fall through unknown kinds.
100   */
101  export interface MessageSourceMap {
102      user: {
103          kind: 'user';
104      };
105      model: ModelMessageSource;
106      tool: ToolMessageSource;
107      'system-prompt': SystemPromptMessageSource;
108  }
```

So `'plugin'` no longer exists, and the *documented* replacement for a producer
is to contribute its own member. `dsh-llm` deliberately declares no shared
generic fallback, so there is nothing to "repoint" `'plugin'` at — a new member
is the only correct construct.

**Stated plainly, because it is the most instructive change in this upgrade:
declaring `'dsh-jev': { kind: 'dsh-jev' } & ContextFormed` is exactly what
upstream prescribes.** It is the adaptation, not a workaround, and it is the
pattern the Lead independently verified. Three independent lines of evidence:

1. **The declaration says so, verbatim** — `dsh-llm/lib/types/message.d.ts:94-100`,
   quoted above: *"Merge-extensible sum type — each producer declares its own
   `kind` in its own module; there is no shared catch-all `plugin` kind."*
2. **Every upstream producer does exactly this.** The Lead independently counted
   **nine** packages augmenting `MessageSourceMap` the same way — `dsh-agent`,
   `dsh-agent-loop`, `dsh-api-session-controller`, `dsh-compaction`, `dsh-llm`,
   `dsh-skill`, `dsh-subagent`, `dsh-tools`, `dsh-user-approval`; §1.2's table
   below lists six of them with exact `file:line` sites.
3. **The `notice` form and its bound are upstream contract**, not invention:
   `ContextFormed`'s notice variant is
   `{ readonly form: 'notice'; readonly summary: string }`
   (`dsh-llm/lib/types/message.d.ts:85-88`) and `boundContextSummary()` bounds the
   summary to `CONTEXT_SUMMARY_MAX_CHARS = 120` (`:114`, `:120`).

Cross-reference: task-2's `docs/upstream-delta-0.1.7-rc.2.md` B-3 (line 275)
records the same removal and proposes the same mechanism; §11 (line 752) lists
the exact declaration shape. Independent corroboration that this is the shipped
convention, not a workaround — **nine** upstream packages augment
`MessageSourceMap` this way (the Lead's count: `dsh-agent`, `dsh-agent-loop`,
`dsh-api-session-controller`, `dsh-compaction`, `dsh-llm`, `dsh-skill`,
`dsh-subagent`, `dsh-tools`, `dsh-user-approval`). Six of those sites, read
directly [read]:

| Producer | Augmentation site (installed 0.1.7-rc.2 declarations) |
| --- | --- |
| `tool-registry` | `dsh-tools/lib/types/index.d.ts:16-23` |
| `ptc-mode` | `dsh-tools/lib/types/ptc.d.ts:9-16` |
| `model-selection` | `dsh-agent/lib/types/model-selection.d.ts:8-13` |
| `user-approval` | `dsh-user-approval/lib/types/index.d.ts:11-16` |
| `skill-invocation` | `dsh-skill/lib/types/index.d.ts:128-133` |
| `runtime-context` | `dsh-agent-loop/lib/types/runtime-context.d.ts:10-17` |

Placed in `pre-step.ts` — the module that produces the message — matching the
declaration's own instruction ("each producer declares its own `kind` in its own
module") and upstream practice. The emitted declaration carries the augment
block through, verified [executed] by the real build (§7.2b):

```
packages/dsh-jev/lib/types/adapters/pre-step.d.ts
  13: import { type ContextFormed } from '@deepseek-ai/dsh-llm';
  25: declare module '@deepseek-ai/dsh-llm' {
  26:     interface MessageSourceMap {
  28:         'dsh-jev': {
  29:             kind: 'dsh-jev';
  30:         } & ContextFormed;
  31:     }
  32: }
```

**One honest reachability limitation, measured — not inferred, and independently
reproduced with a positive control.** The package entry `lib/types/index.d.ts`
does not transitively reference `adapters/pre-step.d.ts`, so the augmentation is
**not** visible to a downstream consumer that only imports the package root.
Verified by a temporary probe (created, run, deleted) in `examples/coding/src/`:

```
import '@buberlo/dsh-jev'
import type { UserMessage } from '@deepseek-ai/dsh-llm'
const kind: UserMessage['source']['kind'] = 'dsh-jev'
```
→ `error TS2322: Type '"dsh-jev"' is not assignable to type '"user" | "model" |
"tool" | "system-prompt" | "model-selection" | "user-approval" | "ptc-mode" |
"tool-registry"'`.

Only a module that actually loads `adapters/pre-step.d.ts` (i.e. the plugin's own
build, which imports it at runtime) sees the member.

The independent verifier reproduced this **with a positive control**, which makes
it a stronger result than a bare negative
(`docs/adaptation/07-verification.md` §2.8 and D4): from the same package-root
consumer, `'model-selection'` — declared by `@deepseek-ai/dsh-agent` — **IS**
present in `MessageSourceMap`, while `'dsh-jev'` is not; and the declaring file
cannot even be deep-imported because the `exports` map is only `"."`,
`"./package.json"` and `"./client"`. The control proves the probe measures real
visibility rather than a broken harness.

#### Decision (recorded, final): do **not** widen the public surface

I earlier proposed an optional `src/message-source.ts` (declaring the kind,
imported by `pre-step.ts`, re-exported from `index.ts`) as a clean way to widen
this. **The Lead has decided not to do that**, and this is now a deliberate,
documented limit — not an open item:

1. **The union is designed for this.** `dsh-llm`'s declaration says user messages
   "carry any producer's kind" and *"consumers fall through unknown kinds"*
   (`dsh-llm/lib/types/message.d.ts:94-100`). A consumer that does not know
   `'dsh-jev'` is behaving exactly as specified.
2. **Nothing downstream needs to name the kind.** This package only *constructs*
   the message; the plugin itself never compares `source.kind === 'dsh-jev'`, and
   no consumer is expected to.
3. **There is no runtime consequence.** The augmentation is compile-time only, so
   the shipped `lib/index.js` behaves identically either way.
4. **The current placement is the one upstream prescribes** — the producer
   declares its own kind in the module that produces the message — and moving or
   duplicating it would trade that conformance for an unused type-level
   convenience.

**Consequence to state plainly for any future reader:** a downstream TypeScript
consumer of `@buberlo/dsh-jev` cannot write `kind: 'dsh-jev'` in its own code.
If a future feature ever needs that (e.g. a projecting client that wants to
distinguish this producer), the `src/message-source.ts` re-export is the remedy
and this decision should be revisited *then*, with a consumer that actually
needs it.

**Impact:** compile-only in effect (see §2.4 — no runtime consumer changed).

**Verified [executed]:** the build in §7.2b, which emitted the block quoted
above; and the typecheck in 1.1.

### 1.3 `src/adapters/pre-step.ts:253` — use the new kind, bound the summary

| | |
| --- | --- |
| Before | `source: { kind: 'plugin', plugin: 'dsh-jev', form: 'notice', summary: \`skill: ${result.skill}\` },` |
| After | `source: { kind: 'dsh-jev', form: 'notice', summary: boundContextSummary(\`skill: ${result.skill}\`) },` |

Three separate reasons:

1. **`kind: 'plugin'` → `kind: 'dsh-jev'`.** The deleted member; the plugin now
   names itself, per §1.2.
2. **`plugin: 'dsh-jev'` dropped.** The field only existed on the deleted
   `plugin` member. The new `ContextFormed` alternative is
   `{ form: 'notice'; summary: string }` [read] `message.d.ts:85-88` — no
   `plugin` field, and `exactOptionalPropertyTypes` plus the union's excess
   property check would reject it. The producer identity is now `kind` itself,
   so nothing is lost.
3. **`summary` wrapped in `boundContextSummary`.** [read] `message.d.ts:109-120`:
   `CONTEXT_SUMMARY_MAX_CHARS = 120`, and *"Producers commit the one-line account
   to the durable log; its inputs — task labels, goal objectives, tool arguments
   — are caller text with no length of their own."* The summary here embeds
   `result.skill`, which is model-choice text of unbounded length, so bounding it
   is the documented contract for `form: 'notice'`. Concretely it caps the
   durable `source.summary` at 120 chars; no model-visible text changes (the
   notice's `content` text block is untouched).

**Impact:** compile-only for (1) and (2); (3) is a **bounded-metadata change**,
not a visible-behaviour change: `summary` is transcript/durable metadata, and the
text the model reads (`content[0].text`) is byte-identical to before. No test
asserts on `source.summary`.

**Verified [executed]:** typecheck above; and
`tests/skill-install.spec.ts` + `tests/agent-loop.spec.ts` assert the hint text
still reaches the model request (§7.1).

### 1.4 Changed-line index (for review)

| file:line | change |
| --- | --- |
| `src/adapters/pre-step.ts:17` | import `boundContextSummary`, `type ContextFormed` |
| `src/adapters/pre-step.ts:23-38` | new: `declare module '@deepseek-ai/dsh-llm'` with the `'dsh-jev'` member |
| `src/adapters/pre-step.ts:253` | `kind: 'plugin'` → `'dsh-jev'`; drop `plugin`; bound `summary` |

No other line in any file I own was edited. Diff scope is 3 hunks in 1 file.

---

## 2. The `source.kind` decision

### 2.1 Old → new

```
kind: 'plugin'   →   kind: 'dsh-jev'          (+ a new module augmentation, §1.2)
plugin: 'dsh-jev' →  (removed; identity is now the kind itself)
form: 'notice'    →   form: 'notice'          (unchanged — still correct)
summary: …        →   boundContextSummary(…)  (§1.3 reason 3)
```

Proving declaration: `dsh-llm@0.1.7-rc.2`
`packages/dsh-jev/node_modules/@deepseek-ai/dsh-llm/lib/types/message.d.ts:94-108`,
quoted verbatim in §1.2. The 0.1.6 reality is recorded in
`docs/upstream-delta-0.1.7-rc.2.md:277-280` (`plugin: { kind: 'plugin'; plugin:
string } & ContextFormed` at 0.1.6 `message.d.ts:98`).

### 2.2 Why the two axes matter here

[read] `message.d.ts:31-44` states the model explicitly:

> `MessageSource.kind` answers *who produced this*; `form` answers *what kind of
> thing it is*, and the two axes are deliberately independent.

The plugin already chose the correct **`form`** in 0.1.6 — `'notice'`, defined at
`message.d.ts:53-54` as *"A one-off account of something that just happened; it
supersedes nothing."* That is exactly a skill-routing suggestion injected once
per turn (`skillHintTurn`, `pre-step.ts:197`). It keeps `'notice'` in 0.1.7-rc.2 because
`ContextFormed`'s vocabulary is unchanged (`docs/upstream-delta-0.1.7-rc.2.md:197`;
[read] `message.d.ts:46-58`). Only the **`kind`** axis was lost.

### 2.3 Why each other union member is wrong

The compiler offered `model | tool | user | system-prompt | model-selection |
user-approval | ptc-mode | tool-registry | skill-invocation`. `model`, `tool`
and `system-prompt` are role-bound in the declaration (`message.d.ts:18-29`,
`:135-142`) and `SystemMessage.source` is narrowed to `'system-prompt'`
(`:137`) — none can type a `role: 'user'` injection. The rest:

| Candidate | Where declared | Why it is wrong |
| --- | --- | --- |
| `user` | `message.d.ts:102-104` | It is the *human's* kind. Using it would also be a **functional bug**, not just mislabeling: `extractTask` (`pre-step.ts:74-86`, the test at `:77`) and `extractSessionTask` (`:89-104`, the filter at `:92`) take the newest message with `source.kind === 'user'` as the task. A hint stamped `'user'` would become the task text on the next step and displace the real user request in every Jev question. The old `'plugin'` kind correctly excluded it, and so does `'dsh-jev'`. This alone disqualifies it. |
| `skill-invocation` | `dsh-skill/lib/types/index.d.ts:128-133` | [read] It is `SkillInvocationSource` (`:121-127`): `{ kind: 'skill-invocation'; name: string; form: 'instructions' }`. `name` is *"Invoked skill name, validated user-invocable at the injecting boundary"* and `form` is pinned to `'instructions'` because *"Injected skill bodies are instructions for the model to follow"*. This plugin's message is (a) a *suggestion*, not an invocation — the whole point of `injectHint` is that the skill body is never loaded automatically (`pre-step.ts:183-186`, the doc block on `runSkills`), and the notice text says *"Load its full instructions only if it helps"*; (b) produced against `isModelInvocable` skills, not user-invocable ones; (c) `form: 'notice'`, which is not assignable to `form: 'instructions'`. Type-checking it would be a *lie in the durable transcript*: a reader would conclude the skill body had been injected. Upstream uses it for `/`-invoked skills. **Rejected.** |
| `model-selection` | `dsh-agent/lib/types/model-selection.d.ts:8-13` | Producer identity: it marks the route-change notice emitted by `installModelSelection` (`:12-26`). This plugin is not the model-selection producer. Borrowing another subsystem's identity is precisely what the removal of `'plugin'` was designed to stop. **Rejected.** |
| `user-approval` | `dsh-user-approval/lib/types/index.d.ts:11-16` | Producer identity for approval-policy notices. Same reason. **Rejected.** |
| `ptc-mode` | `dsh-tools/lib/types/ptc.d.ts:9-16` | Producer identity for the PTC transport's own context. Same reason. **Rejected.** |
| `tool-registry` | `dsh-tools/lib/types/index.d.ts:16-23` | Producer identity for *"Tool availability changes supplied by the tool registry"*. Note this plugin **does** change tool availability — but under its own authority, via `ctx.tools.restrict`, and it deliberately does **not** emit a `'tool-registry'` message for it (the restriction is a registry fact, not injected text). Stamping a *skill* hint with the tool registry's identity would attribute the text to the wrong subsystem in the transcript. **Rejected.** |

`'dsh-jev'` is therefore the only member that names the actual producer. It is
not a member of the offered union, which is the point: 0.1.7-rc.2 requires the
producer to add itself.

### 2.4 Observable-behaviour delta — explicitly stated

Because `MessageSourceMap` is a compile-time-only interface, `source.kind` is
just a string at runtime. The runtime delta of this change is exactly one string
value: `'plugin'` → `'dsh-jev'`. I checked every runtime consumer of
`message.source.kind` in the installed 0.1.7-rc.2 runtime [read]:

| Consumer | Guard | Effect of the change |
| --- | --- | --- |
| `dsh-api-session-controller/lib/types/client/sessions/session.js:714,725` | `source.kind !== 'user' \|\| !('rpcId' in source)` → `continue` | Unchanged: both `'plugin'` and `'dsh-jev'` satisfy `kind !== 'user'` and neither carries `rpcId`, so submission settlement skips the message in both cases. |
| `dsh-api-session-controller/lib/types/commands.js:448` | `source.kind === 'user' && 'rpcId' in source` | Unchanged (neither matches). |
| `dsh-client-ui-conversation/lib/client.js:15305` | `source.kind !== 'user' \|\| !('rpcId' in source) \|\| !inChat.has(...)` → filter out | Unchanged: both kinds are kept in the queue row set. |
| `dsh-client-ui-conversation/lib/client.js:15308` | `source.kind === 'user' && 'rpcId' in source` | Unchanged (neither matches). |

**Does the text still reach the model?** The `role: 'user'` + `content[0].text`
path is untouched, and `agent.inject(message)` is still documented at
`dsh-agent/lib/types/runtime-types.d.ts:201-209` as *"Queue model-facing context
for the next pre-step"*. Crucially, `'plugin'` had **no** special consumer
branch either — the deleted member was a catch-all with no runtime handler.
This is not merely inferred: **[executed]** the scripted-adapter tests
`tests/agent-loop.spec.ts:342` ("routes a skill and injects only a bounded hint")
and `tests/skill-install.spec.ts:97,107` assert the injected text appears in the
model's own request messages, and both passed after the change (§7.1).

**Transcript rendering.** Not executed here. What I can state [read]: no
conversation-renderer branch switches on an unknown `source.kind`; the
presentation axis is `form`, whose `'notice'` value is unchanged, and upstream
0.1.7-rc.2 ships notices under its own producer kinds and under the same generic
`form: 'notice'` mechanism (`dsh-agent/lib/types/model-selection.js:15-25`).
Rendering is therefore **expected unchanged**, but the UI path was not run —
[inferred], not verified.

**Net:** no observable behaviour change is expected; the one deliberate
side-effect is the 120-char bound on the durable `summary` (§1.3).

---

## 3. Extension points re-verified against the installed 0.1.7-rc.2

Task-2 classified all of these IDENTICAL. I re-read each declaration to confirm
the plugin's *assumption* still holds, and made **no speculative change** at any
call site. One optional addition was available (`displayReason`, §4) and is
declined.

| Plugin assumption | Call site | Installed 0.1.7-rc.2 evidence [read] | Verdict |
| --- | --- | --- | --- |
| `tools/pre-execute` is an async waterfall over `ToolExecution` returning `PreToolDecision` | `assessment.ts:22-23` | `dsh-tools/lib/types/index.d.ts:47` — `'tools/pre-execute'(this: Scoped<ToolRuntime>, exec: ToolExecution, next: () => Promise<PreToolDecision>): Promise<PreToolDecision>` | Holds |
| `next()` may be called first, and later policies still run | `assessment.ts:23` | Waterfall contract, unchanged; the plugin delegates before composing, so it cannot skip a later policy | Holds |
| A Jev action can never turn a deny/cancel into an allow | `assessment.ts:26,120-136` | `PreToolDecision` variants at `:445-460`: only `allow`/`deny`/`cancel`/`ask`; `:515-518` — guards have no allow result and *"listener ordering cannot turn a denial back into permission"* | Holds |
| The failure policy cannot allow either | `assessment.ts:108-111` | `onFailure` is typed `'ask' \| 'hold'` (`src/config.ts:77,182,241`) — `'allow'` is unrepresentable | Holds |
| `exec.agent` may be absent and must be checked | `assessment.ts:25`, `observation.ts:21,42` | `dsh-tools/lib/types/index.d.ts:229`, `:265` — `readonly agent?: Agent` | Holds |
| `tools/result` is observe-only | `observation.ts:20` | `:92` — returns `undefined` | Holds |
| `ctx.tools.restrict(filter)` requires a **scoped** context and returns a disposer | `pre-step.ts:174` (`agent.ctx.tools.restrict({ allow })`) | `:644` signature; implementation [read] `dsh-tools/lib/index.js:2895-2910` throws unless `scopeOf(this.ctx) !== undefined`, throws on `{}`, on reserved `run_code`, and on unknown names | Holds |
| …and therefore the plugin's `try/catch` around it is still the right shape | `pre-step.ts:173-180` | Same throws; the plugin logs and continues (fail-open for the turn, never a widening) | Holds |
| `ctx.tools.get(name)` is a **global-only** lookup, which is what makes a name legal for `restrict` | `pre-step.ts:121`, `:154`, `:171` | `:690` — `get(name, scope?)`, omitted scope = global view; `restrict` validates against `view(scope).restrictableNames` (`index.js:2906`) | Holds |
| `ctx.tools.schemas(scope)` returns the scope's visible set | `pre-step.ts:121` | `:711` — `schemas(scope?)`; `:154-155` documents that `schemas()` whitelists only name/description/parameters | Holds |
| `agent/request` returns `LlmCallConfig`, replaceable with `{ ...config, provider, model }` | `model-routing.ts:35,67` | `dsh-agent/lib/types/runtime-types.d.ts:327-332`; `dsh-llm/lib/types/call-config.d.ts:16-23` (`provider: string`, `model: string`, …) | Holds |
| `agent.inject(UserMessage)` queues model-facing context and does not wake the driver | `pre-step.ts:248` | `dsh-agent/lib/types/runtime-types.d.ts:201-209` | Holds |
| `agent/disposed` carries `{ agent }` | (disposer wiring in `src/service.ts`, task-4) | `dsh-agent/lib/types/runtime-types.d.ts:240-242` | Holds |
| `agent/pre-step` payload is `{ agent, messages, turn, step, signal }` and `PreStepDecision` has `reject` | `pre-step.ts:42-45`, `observation.ts:32` | `dsh-agent/lib/types/runtime-types.d.ts:304-310`; `:294-302` — reject a proposed step or replace the messages | Holds |
| `ctx.skills.list({ scope })` and `isModelInvocable` | `pre-step.ts:200,203` | `dsh-skill/lib/types/index.d.ts:266`, `:107` (declarations byte-identical per task-2 §3.6) | Holds |
| `createUserMessage(input)` signature | `pre-step.ts:248` | `dsh-llm/lib/types/message.d.ts:213-216` | Holds |

[inferred] Consequence: the plugin's documented *"why"* in
`docs/upstream-compatibility.md` survives the bump unchanged. No call site in my
scope needed an edit.

### 3b. Schemastery 3.18.4 and the `Config` schema

`src/config.ts` was **transferred to task-4** mid-task, so I neither edited it
nor re-verified its `.volatile()` migration; that is task-4's deliverable and
task-2's §7.3/§7.4 cover the API delta. What I can report about the checks the
brief assigned to me:

| Check | Verdict | Basis |
| --- | --- | --- |
| `.default()` still exists with a value argument | Holds | [read] `schemastery/lib/types/index.d.ts:165-166` — `default(value: T \| NoInfer<Partial<S>>): Schema<S, T, SetRequired<Mode, true>>` |
| `.required()`, `.union()`, `.hidden()`, `.loose()` still exist | Holds | [read] `:150-151`, `:157`, `:159-160`, `:80` (`union<const X>(list: readonly X[]): Schema<TypeS<X>, TypeT<X>>`) |
| Optional-field / `exactOptionalPropertyTypes` handling still behaves | Holds, **executed** | `pnpm build` exit 0 with `exactOptionalPropertyTypes: true`, and 21 on-prem + 13 agent-loop integration tests load the **real** plugin and its real schema-validated config successfully (§7.1) |
| Strictness (unknown keys rejected) | Not re-measured here | The schema's strictness was exercised only through the existing tests. I make no independent claim, and none of the plugin's call sites changed. |

The plugin's `...(x === undefined ? {} : { x })` convention is untouched by this
task because no conditional-optional spread in my files needed changing.

---

## 4. Decision: the plugin does **not** supply `PreToolDecision.ask.displayReason`

The `ask` variant gained an optional localized prompt map [read]
`dsh-tools/lib/types/index.d.ts:454-460`:

```ts
{
    kind: 'ask';
    reason?: string;
    displayReason?: {
        readonly en: string;
        readonly [locale: string]: string;
    };
};
```

and its doc block distinguishes the two fields (`:436-443`): *"its `reason` is the
audited approval reason and its optional `displayReason` is the localized prompt
text."*

Implementation [read] `dsh-client-ui-approval/lib/client.js:43`:

```js
reason: approval.displayReason === void 0 ? approval.reason : props.resolveReason(approval.displayReason),
```

with `resolveReason: (reason) => ctx.locale.resolveText(reason)` (`:349`) and
`resolveText` falling back to the map's `en` key
(`dsh-client-locale/lib/client.js:1241-1244`). The upstream precedent for
populating it is `dsh-sandbox/lib/index.js:109-113`, which pairs a machine
`reason` with a user-facing `{ en, zh }` sentence.

**Decision: do not add it.** Justification, in order of weight:

1. The plugin has **no user-facing prose to supply**. Its approval text is a rule
   id plus measured values — `assessmentReason()` (`assessment.ts:94-100`) yields
   `[jev] ask by <rule>: <measured>` — and `AGENTS.md` requires exactly that
   ("Decisions and logs carry rule ids and measured values, never generated
   prose"). A `displayReason` of `{ en: reason }` would resolve to the identical
   string (`en` is the fallback anyway), producing no user-visible difference at
   the cost of a second field.
2. Translation is **not available host-side**. There is no locale map anywhere in
   `src/` for host-generated strings (the client dictionaries in
   `src/client/locales.ts` are card labels, and that file belongs to task-4).
   Shipping `{ en }` alone would freeze an English-only prompt while advertising
   localization.
3. Omitting it is **not a regression and not a fail-open**: the client falls back
   to `reason`, so behaviour is identical to 0.1.6. The field is additive and
   optional; adopting it is a UX improvement only.
4. The fail-closed chain is untouched: a Jev `ask` still needs
   `approval/request` to return `allowed-once`, and a missing approval service
   still turns `ask` into denial (`dsh-tools/lib/types/index.d.ts:36-40`).

**Flagged for the Lead as a deliberate non-adoption, not an oversight**: adding
a localized display string is a reasonable follow-up feature (it needs a real
locale dictionary and a product decision on wording), but it is not required by
the upgrade and would be unverifiable in this session.

---

## 5. Cordis `private` vs `#`

The binding rule is about the **Cordis service class** whose instance is wrapped
by the service proxy. [read] `src/state.ts:28-30` uses `#snapshot`,
`#selectionDisposer`, `#inFlight` — but `AgentState` is a plain class constructed
by the plugin and never returned from a Cordis service; the proxy never wraps it.
`JevRuntime` (`src/service.ts`, task-4's file) is the Service subclass and uses
TypeScript `private`. **No change made, and none needed.** [executed] the
typecheck is clean for `state.ts`; no runtime path in my scope touches an
unproxied-private field through a service proxy.

---

## 6. Fail-closed rules

| Rule | Evidence | Verdict |
| --- | --- | --- |
| `provider: 'live'` without an explicit `apiKey` throws at construction | `src/service.ts` constructor (task-4's file; unchanged by me). Task-2 B-2 notes the deleted `validate` hook's only remaining enforcement point is this constructor — it is intact. | Holds; not my edit |
| `TYPESAFE_API_KEY` is never read implicitly | [executed] `grep TYPESAFE_API_KEY` over the whole repo: **37 hits, none in `packages/dsh-jev/src/`** except a doc comment in `src/config.ts:31` telling the user to wire it *explicitly*. Hits outside `src/` are `scripts/`, `bench/`, docs and READMEs — all opt-in. | Holds |
| A model answer may only gate, never allow | See §3 rows 3-4. `combineActions` at `assessment.ts:121-124` and the type-level exclusion of `'allow'` from `onFailure`. | Holds |
| No persistent decision cache | Untouched by this task. | Holds |

---

## 7. Executed verification

### 7.1 Tests [executed]

```
pnpm --filter @buberlo/dsh-jev exec vitest run \
  tests/tool-runtime.spec.ts tests/agent-loop.spec.ts tests/onprem-support.spec.ts \
  tests/selection-empty-catalog.spec.ts tests/skill-install.spec.ts
```
→ **exit 0**, log `%TEMP%\jev-adapt\t3-vitest.log`:

```
 ✓ tests/selection-empty-catalog.spec.ts (3 tests) 27ms
 ✓ tests/onprem-support.spec.ts (21 tests) 108ms
 ✓ tests/tool-runtime.spec.ts (10 tests) 136ms
 ✓ tests/skill-install.spec.ts (3 tests) 73ms
 ✓ tests/agent-loop.spec.ts (13 tests) 193ms
 Test Files  5 passed (5)      Tests  50 passed (50)      Duration 4.57s
```

These run the real `ToolRuntime` pipeline and the real agent loop against the
real 0.1.7-rc.2 packages, with only the LLM scripted. They are the executed
evidence that the injected hint still reaches the model (§2.4) and that the
pre-execute/restrict/guard paths still behave. **Zero failures attributable to
task-5 in this subset at the time of the run.**

Re-confirmed on the Lead's explicit request after task-4's settings fix landed
[executed] — log `%TEMP%\jev-adapt\t3-vitest-lead.log`, **exit 0**:

```
 ✓ tests/selection-empty-catalog.spec.ts (3 tests)   ✓ tests/skill-install.spec.ts (3 tests)
 ✓ tests/onprem-support.spec.ts (21 tests)           ✓ tests/tool-runtime.spec.ts (10 tests)
 ✓ tests/agent-loop.spec.ts (13 tests)
 Test Files  5 passed (5)      Tests  50 passed (50)      Duration 744ms
```

These specs mount the whole plugin, including task-4's in-flight files, and they
are **fully green** — so the real-pipeline path is unaffected by the settings
migration.

**Full suite, re-run after task-4 landed its settings fix [executed] — MID-RUN
SNAPSHOT, SUPERSEDED; see the note after the block:**

```
pnpm --filter @buberlo/dsh-jev exec vitest run
```
→ **exit 1**, log `%TEMP%\jev-adapt\t3-vitest-full.log`: **6 files passed, 56
tests passed**, 1 file failed to *collect*:

```
 ✓ tests/selection-empty-catalog.spec.ts (3 tests)     ✓ tests/skill-install.spec.ts (3 tests)
 ✓ tests/onprem-support.spec.ts (21 tests)             ✓ tests/tool-runtime.spec.ts (10 tests)
 ✓ tests/agent-loop.spec.ts (13 tests)                 ✓ tests/client-card.spec.ts (6 tests)
 ❯ tests/settings-section.spec.ts (0 test)
 FAIL  tests/settings-section.spec.ts
 Error: Cannot find package '@deepseek-ai/dsh-settings-file' imported from tests/settings-section.spec.ts:13
 Test Files  1 failed | 6 passed (7)      Tests  56 passed (56)
```

The single failure is a **module-resolution** failure, not an assertion failure:
`@deepseek-ai/dsh-settings-file` (pinned `0.1.6-alpha.2`, per task-1 §2.2) is not
resolvable from `packages/dsh-jev` in the current `node_modules`. That is a
dependency/linking matter in task-1's and task-4/5's territory, not a behaviour
regression in any file I own. **I attribute it to the dependency/settings work,
not to task-3.** It was consistent with `AGENTS.md`'s then-current wording.

> **SUPERSEDED (task-9).** The paragraph above is **mid-run history**, observed at
> that moment and preserved deliberately — it is **not the current state**. On the
> finished tree the module resolution was fixed by the dependency/settings work,
> and the final measured counts are, both packages, **zero delta from the
> pre-upgrade baseline**:
>
> | Package | Final |
> | --- | --- |
> | `@buberlo/jev-core` | **8 files / 85 tests passed** |
> | `@buberlo/dsh-jev` | **7 files / 62 tests passed** |
>
> Confirmed by `test-adapt` on the finished tree, by the verifier running both
> suites twice (`docs/adaptation/07-verification.md` §2.3 and rows 3a/3b, lines
> 31-32 and 105-112), **and re-measured directly by me when writing this
> correction [executed]**:
>
> ```
> pnpm --filter @buberlo/jev-core  exec vitest run → Test Files  8 passed (8)   Tests  85 passed (85)
> pnpm --filter @buberlo/dsh-jev   exec vitest run → Test Files  7 passed (7)   Tests  62 passed (62)
> ```
>
> **`tests/settings-section.spec.ts` no longer fails to collect**: all 7 dsh-jev
> files pass, matching the pre-upgrade baseline exactly (task-1 §1). The 5-file /
> 50-test subset in §7.1 and the 6-file / 56-test full run above were both correct
> observations at their moment, and neither is the final tally.

### 7.2 Host typecheck [executed]

```
pnpm --filter @buberlo/dsh-jev exec tsc -p tsconfig.json --noEmit
```
→ **exit 1** at the time of my edit, log `%TEMP%\jev-adapt\t3-tsc-after.log`,
with the only remaining diagnostics in a file I do not own:

```
src/settings-section.ts(32,26): error TS2339: Property 'installSection' does not exist on type 'SettingsForms'.
src/settings-section.ts(33,19): error TS7006: Parameter 'current' implicitly has an 'any' type.
src/settings-section.ts(39,18): error TS7006: Parameter 'value' implicitly has an 'any' type.
```

Before my change the same command also reported
`src/adapters/pre-step.ts(236,15): error TS2322 …` (log `t3-tsc-before.log`) —
**that diagnostic is gone and never returned.** Errors 4-5 (`current`, `value`
implicitly `any`) were the documented fall-out of error 3 (task-1 §4.2).

**Re-run after task-4 landed its settings migration [executed]:**

```
pnpm --filter @buberlo/dsh-jev exec tsc -p tsconfig.json --noEmit
→ TSC_EXIT=0          (log %TEMP%\jev-adapt\t3-tsc-final.log, no output)
```

**Verdict: the host typecheck is GREEN, with zero diagnostics in any file I own
and zero anywhere else.** Task-4's three `settings-section.ts` diagnostics were
resolved by task-4 before this final run. Re-confirmed on the Lead's explicit
request [executed] — log `%TEMP%\jev-adapt\t3-tsc-lead.log`:

```
pnpm --filter @buberlo/dsh-jev exec tsc -p tsconfig.json --noEmit
→ TSC_EXIT=0   (no output)
```

Split as requested: **mine: none. task-4's: 0** (fixed by task-4).

### 7.2b Full package build [executed]

```
pnpm --filter @buberlo/dsh-jev run build
```
→ **exit 0**, log `%TEMP%\jev-adapt\t3-build.log`:

```
$ tsc -p tsconfig.json && tsc -p tsconfig.client.json && tsdown
ℹ lib\client.js      16.57 kB │ gzip: 5.19 kB
✔ Build complete in 18ms
```

All three stages (host `tsc`, client `tsc`, `tsdown`) pass. The emitted
`lib/types/adapters/pre-step.d.ts` carries the augmentation:

```
25: declare module '@deepseek-ai/dsh-llm' {
26:     interface MessageSourceMap {
28:         'dsh-jev': {
29:             kind: 'dsh-jev';
30:         } & ContextFormed;
```

### 7.3 Examples typecheck [executed]

```
node_modules/.bin/tsc -p examples/coding/tsconfig.json
```
→ **exit 0** (log `t3-example-coding-after.log`), run **against the fresh
`lib/types` produced by 7.2b**, i.e. through the real package boundary.
Module resolution was traced [executed] (`--traceResolution`) to confirm this is
a real check, not a no-op: `@buberlo/dsh-jev` resolves to the workspace link,
`dsh-tools` to `…@deepseek-ai+dsh-tools@0.1.7-rc.2…` and `dsh-system-prompt` to
`0.1.7-rc.2`. `examples/coding/src/**` needed no edit.

An earlier run of the same command, before the settings migration landed, also
exited 0 but necessarily resolved the then-stale `lib/types`; that caveat no
longer applies.

### 7.3b `pnpm test:packaging` — pre-existing Windows defect. **My earlier diagnosis was wrong.**

> **CORRECTION (task-9), superseding the first version of this section.** I
> originally wrote that this failure was "an **environment limitation, not a
> repo defect**", caused by the harness file sandbox blocking named-pipe stdio.
> **That was a misdiagnosis and it is falsified.** The independent verifier
> reproduced the identical failure from a fully unrestricted shell, with no
> sandbox in play (`docs/adaptation/07-verification.md` §2.4 and D3, lines
> 121-150 and 355-377). The evidence is decisive:
>
> ```
> node -e "require('child_process').execFileSync('pnpm',    ['--version'],{stdio:'inherit'})"             → ENOENT spawnSync pnpm ENOENT
> node -e "require('child_process').execFileSync('pnpm.cmd',['--version'],{stdio:'inherit'})"             → EINVAL
> node -e "require('child_process').execFileSync('pnpm',    ['--version'],{stdio:'inherit',shell:true})" → 12.4.2
> ```
>
> Identical output with an unrestricted shell rules out any sandbox cause; I
> inferred a mechanism instead of isolating it, which is the error.

**The real cause.** A **pre-existing Windows defect in
`scripts/packaging-test.mjs`**: its `run()` helper (lines 26-32) calls
`execFileSync('pnpm', …)` without a shell, and its `pnpm pack` spawn (line 43)
does the same. On Windows `pnpm` is `pnpm.cmd`, which `execFileSync` cannot
launch without a shell (Node also refuses `.cmd`/`.bat` without one since the
CVE-2024-27980 fix). The `join(consumer,'node_modules','.bin','tsc')` shim at
line 203 is the same class of bug — the extensionless POSIX shell shim.

**The test's substance is GREEN.** The verifier patched exactly those spawn
points in a scratch copy (`%TEMP%\dsh-verify\packaging-test-win.mjs`; `shell` on
Windows plus `tsc` → `tsc.cmd`, **no logic change**) and the whole packaging test
then passed — including the real-plugin load, the fail-closed enforcement check,
the single-Cordis check, and a clean consumer `tsc`
(`docs/adaptation/07-verification.md` §2.4, lines 139-150):

```
[packaging] running the runtime smoke (real DSH services + installed plugin)
smoke: OK (standalone core, real plugin load, fail-closed enforcement, single cordis, client artifact)
[packaging] type-checking a consumer that uses the published types
tsc: no output (clean)
[packaging] packaging test PASSED
```

So the defect **hides three real checks that do pass**, rather than the checks
being broken — which is why the verifier rates it medium, not high.

**Ownership and action.** The fix belongs to `task-8` (`docs-adapt`), which owns
`scripts/packaging-test.mjs`. I did **not** edit that script: `scripts/` is
outside my write scope, and the task brief required me to report the limitation
rather than work around it. What I got wrong was the *attribution*, not the
decision to report — the correct entry is "a repo defect in a script I may not
touch", not "not a repo defect".

Attribution: this correction is based on
`docs/adaptation/07-verification.md` (D3 at lines 355-377, D5 at lines 396-405,
and the isolation in §2.4 at lines 121-150). I did not re-run the scratch-copy
experiment myself; the cause and the green substance above are the verifier's
executed result, not mine.

### 7.4 No new escape hatches [executed]

```
grep -E "as any|@ts-ignore|@ts-expect-error|@ts-nocheck|as unknown as" packages/dsh-jev/src
```
→ **no matches**. One pre-existing `as unknown as Agent` cast exists at
`examples/coding/src/dsh-runtime.ts:69` (a synthetic agent stub for an offline
example); it predates this task, is in a file I verified but did not edit, and no
escape hatch was added anywhere by me.

---

## 8. Files I did **not** change, and why they were already correct

| File | Why unchanged | Evidence |
| --- | --- | --- |
| `src/adapters/assessment.ts` | Every binding it needs is byte-stable (§3). Its monotonic composition and the `'ask' \| 'hold'` failure policy already satisfy 0.1.7-rc.2 and `AGENTS.md`. | [read] `dsh-tools/…/index.d.ts:47,229,265,445-460,515-518`; typecheck clean |
| `src/adapters/observation.ts` | `tools/result` unchanged; `exec.agent` optionality already handled; the guard remains deny-only. | [read] `:92`, `:515-519`; typecheck clean |
| `src/adapters/model-routing.ts` | `agent/request` still yields/accepts `LlmCallConfig` with the same fields; `{ ...config, provider, model }` is still the documented replacement. | [read] `runtime-types.d.ts:327-332`, `call-config.d.ts:16-23`; typecheck clean |
| `src/state.ts` | No DSH type in its surface except `Agent`; `#` fields are safe on a non-service class (§5). | [read] `state.ts:11,28-30`; typecheck clean |
| `src/index.ts` | Only re-exports; none of the re-exported symbols changed shape. Deliberately not used as the augmentation site (§1.2). | [read] `index.ts:14-21`; typecheck clean |
| `src/usecases/kubernetes-support.ts` | Pure constants plus one string-length check; **zero** DSH imports. | [read] whole file (37 lines) |
| `examples/coding/src/index.ts` | Core-only example; `@buberlo/jev-core` is out of the upgrade's blast radius. | [executed] §7.3 |
| `examples/coding/src/dsh-runtime.ts` | Uses `Context`, `SystemPrompt`, `ToolRuntime`, `createScope`, `ToolCallId`, `Agent`, `ToolDefinition` — all verified present with the same shape by the typecheck. | [executed] §7.3 exit 0 |
| `src/config.ts`, `src/service.ts` | **Transferred to task-4** before I made any edit. Not touched. | Lead message; `git diff` shows no edit by me |

---

## 9. Residual failures and their owners

As of the final runs in §7.2 / §7.2b, **the host typecheck and the full package
build are both green** — task-4 landed the settings migration during this task.
What remains:

| Residual | Owner | Note |
| --- | --- | --- |
| ~~`tests/settings-section.spec.ts` fails to collect~~ — **RESOLVED, no longer residual** | — | **Superseded (task-9).** This was a real mid-run observation: `Cannot find package '@deepseek-ai/dsh-settings-file'` left the suite at 6 files / 56 tests. On the finished tree it is fixed and **all 7 dsh-jev files pass, 62 tests** (re-measured by me, §7.1). Kept here so the reader sees the history without mistaking it for the current state. |
| `scripts/packaging-test.mjs` cannot spawn `pnpm` on Windows (`spawnSync pnpm ENOENT`) | task-8 (`docs-adapt`) | A **pre-existing repo defect**, not environmental and not mine — full cause and the green substance in §7.3b. `scripts/` is outside my write scope. |
| `src/client/**` client-tsconfig diagnostics, if any remain | task-4 | Not visible in the host `tsconfig.json` run; the client `tsconfig.client.json` stage **passed** in §7.2b. |

Nothing in my scope is blocked. No failure remains that I attribute to task-4 or
task-5, and none to task-3.

---

## 10. Confidence

| Claim | Confidence | Basis |
| --- | --- | --- |
| `'plugin'` is deleted and `'dsh-jev'` (self-declared) is the semantically correct replacement | **High** | Declaration read and quoted verbatim; the declaration's own text forbids a shared catch-all and mandates per-producer kinds; nine shipped upstream packages corroborate the pattern (the Lead's count; six with exact `file:line` read by me in §1.2). |
| `skill-invocation` is wrong | **High** | Its declaration requires `form: 'instructions'` and a user-invocable `name`; this plugin injects a suggestion with `form: 'notice'` against model-invocable skills and never loads the body. |
| The text still reaches the model | **High (executed)** | Two integration specs on the real agent loop assert the hint text in the model request and both passed. |
| No runtime consumer changes behaviour | **Medium-high** | Every installed consumer of `source.kind` was located and read; none branches on a producer kind. It is a read-reasoning claim, not an executed UI run. |
| Transcript rendering is unchanged | **Medium** | [inferred] `form: 'notice'` is the presentation axis and is unchanged; no renderer branch on unknown `kind` was found. The UI was not executed. |
| The host typecheck is green for every file I own (and for the whole package) | **High (executed)** | `TSC_EXIT=0`, no output; the previous `pre-step.ts:236` diagnostic is gone and never returned. |
| The package builds end to end | **High (executed)** | `BUILD_EXIT=0` across `tsc`, client `tsc`, and `tsdown`. |
| No new `as any`/`@ts-ignore`/`@ts-expect-error` | **High (executed)** | Grep returned no matches over `packages/dsh-jev/src`. |
| Declining `displayReason` is safe | **High** | The field is optional; the client falls back to `reason`; the fallback line was read. |
| Examples still typecheck, through the fresh package boundary | **High (executed)** | Exit 0 against the `lib/types` emitted in §7.2b. |
| The augmentation is **not** visible to a root-only downstream importer | **High (executed, reproduced with a positive control)** | My probe gave `TS2322` without `'dsh-jev'`. The verifier independently reproduced it **with a positive control** — `'model-selection'` (declared by `dsh-agent`) **IS** visible to the same package-root consumer while `'dsh-jev'` is not, and the declaring file cannot be deep-imported (`07-verification.md` §2.8, D4). That control proves the probe measures visibility rather than a broken harness. **Accepted as a deliberate, documented limit — see §1.2.** |
| Final test counts are 85 / 62, zero delta | **High (executed by me, plus two independent confirmations)** | I re-ran both suites directly when writing this correction: jev-core 8 files / 85 tests, dsh-jev 7 files / 62 tests, all passing. Also confirmed by `test-adapt` on the finished tree and by the verifier running both suites twice (`07-verification.md` rows 3a/3b). My own earlier mid-run numbers are labelled superseded in §7.1/§9. |
| The packaging failure is a repo defect in `scripts/packaging-test.mjs`, not a sandbox artifact | **High (verifier-executed); my original claim was WRONG** | My first diagnosis was falsified by an unrestricted-shell repro with an identical error, and the substance was proven green with two spawn fixes in a scratch copy (`07-verification.md` §2.4, D3, D5). Recorded as a correction in §7.3b. |

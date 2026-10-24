# 09 · Prompt Engineering for Generative AI — Five Principles, Chains and Evaluation

<module_meta>
  <source>Prompt Engineering for Generative AI — James Phoenix & Mike Taylor (O'Reilly, 2024). An original distillation; read the book.</source>
  <router_trigger>Load when writing system prompts, prompts for other agents, multi-step LLM pipelines, prompt evaluations or image-generation prompts for assets.</router_trigger>
  <enforcement_level>STRICT — a prompt is code: versioned, tested and with an explicit output format.</enforcement_level>
  <pairs_with>08 (evaluation) · router.md (which applies these principles to itself)</pairs_with>
</module_meta>

---

<core_thesis>
## 0. The book's thesis

The authors distilled techniques that worked across models and modalities (text and image) into **five principles** meant to survive a change of model. The intuition: what works to **manage human intelligence** (a clear brief, an agreed format, examples, review and division of labor) keeps working when the intelligence is artificial.
</core_thesis>

---

<core_axioms>
## 1. The five principles (with techniques)

### 1.1 Give direction
- Describe the desired style with **concrete references** instead of adjectives ("the editorial hierarchy of a Swiss architecture magazine", not "modern and clean").
- Assign a **persona and an audience** (who writes, for whom, with what goal).
- State the **definition of done**.

### 1.2 Specify the format
- Declare the exact shape of the output: JSON with a schema, YAML, Markdown with fixed sections, a unified diff.
- Separate **instructions, context and data** with delimiters (XML tags like the ones in this repository).
- An explicit format = **parseable, deterministic** output; for extraction and code, low temperature.

### 1.3 Provide examples
- Zero-shot for the trivial; **few-shot (2–5 varied examples)** when the pattern is subtle.
- Examples teach more than rules — **and they also teach their own flaws**. Vary length, topic and edge cases.
- Include a labeled counterexample when the common mistake is predictable.

### 1.4 Evaluate quality
- Define criteria and **golden test cases** before iterating.
- Compare variations with data (a scored rubric, pairwise evaluation, LLM-as-judge with explicit criteria + human sampling).
- Iterate from observed failures, not from intuition.

### 1.5 Divide labor
- Complex tasks become **chains**: plan → execute → review. Each step has a focused prompt and a verifiable output.
- Give it "time to think": ask for reasoning in a section separate from the final answer.
- Decompose from simplest to hardest (*least-to-most*) when the task has dependencies.
</core_axioms>

---

<techniques>
## 2. Recurring techniques from the book (applicable to agents)

| Technique | When | Form |
|-----------|------|------|
| Role prompting | you need expert vocabulary and judgment | "You are a …" + audience + goal |
| Reference text against hallucination | facts, APIs, client data | "Answer only from <docs>; if it is not there, say you don't know" |
| Self-evaluation / critique | quality over speed | 2nd pass: "list 3 problems against the rubric and fix them" |
| Chaining | tasks with distinct phases | the JSON output of step N becomes the input of N+1 |
| Meta-prompting | generating/refining prompts | one model writes the prompt, another runs it, a third evaluates |
| Classify before acting | routing | "classify into {A,B,C}; then follow that class's protocol" (what the router does) |
| Retrieval (RAG) | large knowledge | fetch only the relevant passages (the router loads modules on demand) |
| Agents with tools (ReAct) | actions in the world | think → act with a tool → observe → repeat (the `web-*` toolkit is the "hand") |
| Memory and summaries | long conversations | summarize the step in 5 lines before loading the next one |
</techniques>

---

<image_prompts>
## 3. Image prompts for assets (when the user picks AI-generated assets)

Structure: **subject · action/composition · style/medium · light · palette · framing/lens · quality modifiers · format** + negatives.

```text
subject: city bicycle leaning on a concrete wall
composition: medium shot, left third empty for text, low horizon
style: editorial photography, 35mm film grain
light: late afternoon, warm backlight
palette: midnight blue and orange (#0b1638, #ff6a1a)
format: 16:9, high resolution
negative: text, logos, watermarks, deformed hands
```
Rules: keep characters/objects consistent across images (the same anchor description); **never** generate third-party logos or real people; store the prompt next to the asset (versioned).
</image_prompts>

---

<parede_prompt_contract>
## 4. How parede-da-ia applies the principles to itself

| Principle | Where it shows |
|-----------|----------------|
| Direction | `router.md` §0 (identity) · playbooks in `aesthetics/` with real references |
| Format | XML blocks in every module · `templates/*.md` (brief, direction, motion spec, delivery) |
| Examples | classification few-shot in the router · "bad → good" in every module |
| Evaluation | `<self_evaluation>` rubrics · quality gates · `web-audit` scores |
| Division | phased workflows with verification between phases |
</parede_prompt_contract>

---

<prompt_template>
## 5. A template for writing a system prompt

```xml
<role>Who the model is, who it works for, what the quality bar is.</role>
<context>The facts it needs (docs, data, constraints). Nothing more.</context>
<task>What to do, in numbered steps.</task>
<rules>Positive constraints ("use at most 3 colors") and critical prohibitions.</rules>
<examples>2–5 varied examples + 1 labeled counterexample.</examples>
<output_format>The exact schema/structure of the answer.</output_format>
<evaluation>A rubric the answer must pass before it is delivered.</evaluation>
```
</prompt_template>

---

<agent_traps>
## 6. Guard against the monolithic prompt

- **Forbidden:** a 3-page prompt with contradictory rules: modularize and load on demand.
- **Forbidden:** "be creative and professional" with no references, constraints or examples.
- **Forbidden:** a single call to "build the whole site".
- **Forbidden:** iterating on a prompt without fixed test cases (you won't know whether it improved).
</agent_traps>

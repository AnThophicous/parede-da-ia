# Workflow · corporate-briefing

<module_meta>
  <role>Corporate branch of frontend-master's Phase 1. Turns a vague request ("a modern institutional site") into an approved brief and an economical aesthetic direction.</role>
  <enforcement_level>STRICT — corporate sites do not start without an answered brief. Ask more, assume less.</enforcement_level>
  <pairs_with>knowledge-base/19 (brand) · 23 (message) · 15 (grid) · 03 (usability) · 22 (accessibility) · aesthetics/corporate-*.md · product-saas.md · templates/corporate-brief.md</pairs_with>
</module_meta>

---

<why_more_questions>
## 1. Why corporate asks more

In personal and ambitious projects, personality leads. In corporate work the expensive mistake is **getting the business wrong**: audience, proof, conversion, compliance, who signs off. The winning corporate aesthetic is **economical**: every visual element pays rent in clarity or trust `[15][19]`.
</why_more_questions>

---

<briefing_protocol>
## 2. Protocol (3 messages, in this order)

### Message 1 — Brief (one single message, numbered, with suggested answers)
Send the questionnaire from `templates/corporate-brief.md`. Rules:
- Group it in blocks (Business · Audience · Brand · Content · Conversion · Tech · Compliance · Operations).
- Offer **suggested answers** in parentheses to speed things up ("e.g., generate leads for demos").
- Mark with ★ the questions you cannot proceed without.
- Accept partial answers: fill the rest with hypotheses **explicitly marked** as `[hypothesis]`.

### Message 2 — Aesthetic (after the answers)
Present **the three corporate families** with one paragraph each and say which one you recommend and why:

| Family | When it wins |
|--------|--------------|
| `corporate-modernist` | Professional services, public sector, health, finance, industry: trust and clarity above all. |
| `corporate-brand` | Brands with their own personality and color (B2C/B2B2C), mobility, retail, mature startups. |
| `product-saas` | Software with a demo, plans and onboarding: the product is the hero. |

For each family show: a palette derived from the client's brand, a type pairing, 1 hero idea, 1 signature microinteraction and the **allowed highlight moment** (at most one per page).

### Message 3 — Approved plan
Section map (with the `[23]` narrative: problem → guide → plan → call to action → success), initial tokens, stack, measurable acceptance criteria (`web-audit` ≥ 90, LCP ≤ 2.5s, AA on every text) and what is out of scope. Ask for explicit approval.
</briefing_protocol>

---

<extra_questions>
## 3. Mandatory extra questions by sector

| Sector | Also ask |
|--------|----------|
| Health | Is there regulated content (e.g., FDA/HIPAA, ANVISA/CFM)? Do patient images have consent? |
| Finance | Do rates and returns need disclaimers? Any regulator requirements (e.g., SEC, FCA, BACEN/CVM)? |
| Public sector | Must it follow WCAG 2.2 AA or a national standard (Section 508, e-MAG)? Sign language? Plain language? |
| Legal | Bar association rules on advertising? Are testimonials allowed? |
| Education | Calendar/enrollment? Does the audience include minors (GDPR, COPPA, LGPD)? |
| Industry/B2B | Long sales cycle? Technical materials (PDFs, data sheets)? Multilingual? |
| Any | Who approves the layout? Is there a brand manual? Are cookies/privacy and analytics defined? |
</extra_questions>

---

<anti_patterns>
## 4. Traps (forbidden)

- **The average template:** a hero with a generic purple gradient, three "benefit" cards with random icons and a fake testimonial.
- **Inventing numbers, client logos or testimonials.** Use labeled placeholders until the client provides them.
- **Decorative WebGL on a corporate site without a business reason.** The highlight moment has to serve the message.
- **Skipping the brief because "the user seems in a hurry".** Offer the short version (only the ★ questions), never none.
</anti_patterns>

---

<self_evaluation>
## 5. Rubric before moving to Phase 2 (0–2 each; minimum 8/10)

| Criterion | 0 | 1 | 2 |
|-----------|---|---|---|
| Business goal | missing | vague | measurable (e.g., 40 demos/month) |
| Audience and pain | generic | described | with objections and the audience's own words |
| Content | none | partial | real, or with owners and deadlines |
| Aesthetic | not chosen | chosen without a why | chosen and justified by brand/audience |
| Acceptance | none | subjective | toolkit metrics (audit, LCP, contrast) |
</self_evaluation>

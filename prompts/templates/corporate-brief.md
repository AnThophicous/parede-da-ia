# Template · corporate brief

> Send it as ONE message. ★ = required to proceed. Offer the suggestions in parentheses.
> Missing answers become an explicit `[hypothesis]` in the plan — never a silent assumption.

## Business
1. ★ What does the company do, in a sentence a customer would understand? (e.g., "accounting for medical clinics")
2. ★ The site's main goal, measurable. (e.g., "40 proposal requests per month", "fewer support calls")
3. Secondary goals. (hiring, press, investors, partners)
4. Main competitors and what they do better/worse than you.
5. The real differentiator (not "quality and commitment"): why does someone choose you?

## Audience
6. ★ Who makes the buying decision? Who influences it? (role, sector, company size)
7. Which pain or objection comes up most in sales?
8. On which device and in which context does the audience arrive? (mobile on the go, desktop at the office)
9. The audience's technical familiarity and vocabulary.

## Brand
10. ★ Is there a brand manual (logo, colors, typography)? Send the files.
11. Three adjectives the brand **is** and three it **is not**.
12. Brands (from any sector) whose digital presence you admire, and why.
13. Is there original photography? Video? Illustration? Who produces new assets?

## Content
14. ★ Required pages/sections. (home, services, cases, about, blog, contact, careers)
15. Who writes the copy, and when will it be ready?
16. Available proof: numbers, cases, client logos (with permission), certifications, awards.
17. Languages.

## Conversion
18. ★ The main action (CTA) and where it leads (form, WhatsApp, calendar, trial).
19. Minimum form fields and where the leads go (CRM, email).
20. Acceptable secondary actions (newsletter, gated content, recorded demo).

## Tech
21. Mandatory or preferred stack? CMS? Who updates the site afterwards?
22. Hosting and domain.
23. Integrations (analytics, pixels, CRM, chat).
24. Performance targets (e.g., LCP ≤ 2.5s on 4G) and SEO (priority keywords).

## Compliance and accessibility
25. ★ Sector rules that affect content (health, legal, financial regulators…).
26. Privacy (GDPR/LGPD/CCPA): privacy policy, cookie banner, legal basis for the forms.
27. Required accessibility level (parede-da-ia default: WCAG 2.2 AA).

## Operations
28. ★ Who approves the layout, and how many review rounds?
29. Deadline and milestones.
30. What is explicitly out of scope?

---

### Expected output from the agent after the answers

```yaml
brief:
  company: ""
  measurable_goal: ""
  audience: { decision_maker: "", pain: "", context: "" }
  brand: { manual: yes|no, adjectives_is: [], adjectives_is_not: [] }
  content: { sections: [], proof: [], owner: "", deadline: "" }
  conversion: { cta: "", destination: "" }
  tech: { stack: "", cms: "", hosting: "" }
  compliance: { sector: "", privacy: "", wcag: "2.2 AA" }
  operations: { approver: "", rounds: 0, deadline: "" }
  hypotheses: []        # everything that was assumed
  recommended_aesthetic: corporate-modernist | corporate-brand | product-saas
  acceptance: { web_audit: ">= 90", lcp: "<= 2.5s", contrast: "AA on 100% of texts" }
```

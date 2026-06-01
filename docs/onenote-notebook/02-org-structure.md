# Organizational Structure

## Org chart (current target)

```
                       Owner / Operator
                              │
              ┌───────────────┼────────────────┐
              │               │                │
         Office /         Operations       Marketing /
         Dispatch          Manager         Customer
                              │
        ┌────────────┬────────┴────────┬─────────────┐
        │            │                 │             │
   LawnPros     ClearView          SnowLand     Junk / Misc
   Crew Lead    Crew Lead         Crew Lead     (cross-staffed)
        │            │                 │
   1–2 Helpers  1–2 Helpers       1–2 Helpers
```

The Owner does multiple roles in Year 1 — the boxes exist so the work
is visible and roles can be delegated as the company grows.

---

## Role profiles

### Owner / Operator
- **Owns:** Company strategy, hiring decisions, pricing, banking, key
  customer relationships.
- **Reports to:** Nobody — the buck stops here.
- **Daily:** Reviews dispatch board, signs off quotes >$1,500, handles
  escalated customer issues, business development.
- **Weekly:** Reviews job profitability, payroll, weekly KPIs (calls
  answered, quotes sent, jobs closed, reviews collected).
- **Don't waste time on:** Routine mowing, routine dispatch, routine
  invoicing. Delegate these as soon as Office / Operations can take
  them.

### Office / Dispatch (1 person)
- **Owns:** Phone, email, quote send-outs, scheduling, invoicing,
  customer follow-up.
- **Reports to:** Owner / Operator.
- **Daily:** Answer calls within 2 rings during business hours, log
  every lead in the CRM, send quotes within one business day, build
  the next day's route by end of business.
- **Weekly:** Send invoices for all completed jobs, follow up on
  overdue invoices, file customer reviews from completed work.
- **Hiring criteria:** Friendly phone voice, comfortable with
  spreadsheets, lives in the Valley, doesn't get rattled by an angry
  caller.

### Operations Manager (Year 2 hire)
- **Owns:** Crew leads, daily routing, quality assurance, equipment.
- **Reports to:** Owner / Operator.
- **Daily:** Pre-route huddle with crew leads, mid-day quality
  spot-checks, equipment readiness checks.
- **Hiring criteria:** Hands-on, has run a small crew before, can
  ride along + jump in if a team is short. Driver's license + clean
  abstract required.

### Marketing / Customer (Year 2 hire — or contractor)
- **Owns:** Social media, Google Business Profile, review collection,
  email campaigns, website content updates.
- **Reports to:** Owner / Operator.
- **Hiring criteria:** Can write clean, friendly copy. Comfortable
  with Canva or similar. Understands local marketing.

### Crew Lead (one per division — LawnPros / ClearView / SnowLand)
- **Owns:** Their division's daily route execution, equipment care,
  helper supervision, on-site customer interactions, photo
  documentation.
- **Reports to:** Operations Manager (or Owner in Year 1).
- **Daily:** Pre-job equipment check, run the route, photo every
  before/after, end-of-day truck cleanup and gas-up.
- **Authority:** Can quote add-on work on-site up to $300. Anything
  bigger gets called in to dispatch.
- **Hiring criteria:** Driver's license, clean abstract, can lift
  50lb, professional with customers, can mentor a helper.

### Crew Helper (1–2 per crew)
- **Owns:** Hands-on work as assigned, equipment carry/load, site
  cleanup, learning the trade.
- **Reports to:** Crew Lead.
- **Hiring criteria:** Reliable, on time, learns by doing, presents
  professionally. Driver's license preferred but not required.

---

## Cross-division staffing

The crew helpers rotate across divisions seasonally — same people who
mow in summer often shovel in winter. This keeps year-round work for
the team and avoids hiring/firing cycles.

| Season       | Division focus                  | Cross-staffing |
|--------------|---------------------------------|----------------|
| Spring (Apr–May) | LawnPros (spring cleanup), ClearView (window + gutter) | Helpers rotate to whichever division has demand |
| Summer (Jun–Aug) | LawnPros (mowing), ClearView (windows, pressure wash) | LawnPros full-staffed; ClearView lighter helper |
| Fall (Sep–Oct)   | LawnPros (fall cleanup), ClearView (gutter clean), SnowLand contract sales | All divisions active |
| Winter (Nov–Apr) | SnowLand (snow + walkways)      | Most crew on SnowLand; off-season training + maintenance |

---

## Decision rights

| Decision | Owner | Ops Mgr | Crew Lead | Office |
|---|---|---|---|---|
| Hire / fire | ✅ | recommend | recommend | recommend |
| Set service pricing | ✅ | recommend | — | — |
| On-site add-on quote ≤ $300 | ✅ | ✅ | ✅ | — |
| On-site add-on quote $300–$1,500 | ✅ | ✅ | call dispatch | ✅ (with Owner notice) |
| On-site add-on quote > $1,500 | ✅ | recommend | call dispatch | call Owner |
| Reschedule a customer | ✅ | ✅ | ✅ (with dispatch notice) | ✅ |
| Refund / credit ≤ $200 | ✅ | ✅ | recommend | ✅ |
| Refund / credit > $200 | ✅ | recommend | — | recommend |
| Buy new equipment | ✅ | recommend | recommend | — |
| Buy consumables (≤ $200) | ✅ | ✅ | ✅ | ✅ |

---

## Weekly meeting cadence

- **Monday 7:00am** — All-hands huddle (15 min): the week's routes,
  any weather flags, customer follow-ups owed.
- **Wednesday 12:00pm** — Owner + Office sync (30 min): leads /
  quotes / invoices / cash position.
- **Friday 4:00pm** — Crew lead debrief (15 min): what went well, what
  broke, what to fix next week.
- **Last Friday of the month** — Full team check-in (45 min): wins,
  numbers, one improvement we're committing to next month.

---

## Hiring pipeline

The careers page (`/careers`) is the front door. Applications land in
the `Application` table in the database + email to `hiring@prestigeviewservices.ca`.

Process:
1. Application received → reviewed within 3 business days
2. If qualified → 15-minute phone screen by Owner / Office
3. If passed → in-person trial day (paid half-day) shadowing a crew
4. If a fit → reference check, written offer, start date set
5. First week — Vision + Org Structure read-throughs, then division-
   specific training (see training docs)
6. 30-day review → confirm long-term fit, set 90-day goals

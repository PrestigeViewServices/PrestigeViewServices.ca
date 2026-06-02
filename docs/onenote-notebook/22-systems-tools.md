# Systems & Tools

The software stack that runs the business. Pick fewer tools, use them
fully, integrate what matters.

---

## The principle

> *"A bad system used consistently beats a great system used
> sporadically."*

The temptation is to switch tools constantly. Resist. Pick one in
each category, commit, master it, and only switch when the pain is
real (not when the new shiny thing comes out).

---

## The core stack (every small service business needs these)

### CRM + scheduling
The single most important tool. It holds customer records, schedule,
invoicing, payment, quotes, route optimization, photo storage.

**Top picks for service businesses:**
- **Jobber** — most popular for HVAC, lawn, cleaning. Mid-range
  price. Great mobile app.
- **Service Autopilot** — built for lawn/landscape. Most powerful
  for that vertical. Steeper learning curve.
- **Housecall Pro** — good mobile-first design, strong for solo
  + small teams.
- **GorillaDesk** — affordable, simple, growing.

**Don't try to build this in spreadsheets past 50 customers.** The
time savings of a proper CRM pay back in a month.

### Accounting
- **QuickBooks Online** — default for Canadian small business
- **Wave** — free, lightweight, good for early stage
- **Xero** — strong alternative, growing in Canada

**Pick one. Bookkeeper will recommend.**

### Payroll
- **Wagepoint** — Canadian, small-biz focused
- **QuickBooks Payroll** — if you're already in QBO
- **Wave Payroll** — affordable, lightweight

### Communications
- **Phone:** Business line — VoIP through a provider like RingCentral,
  Grasshopper, or a local provider. Forwarding to your cell as needed.
- **Email:** Google Workspace OR Microsoft 365 (you're likely already
  on 365 given OneNote use)
- **Team chat:** WhatsApp groups work fine at < 10 people; Slack or
  Microsoft Teams beyond that
- **Customer messaging:** Built into the CRM if possible

### Calendar
- Google Calendar OR Microsoft Outlook (match your email)
- Single source of truth for owner schedule
- Shared calendar for the team's days off

### Document storage
- Already on OneDrive (where this notebook lives)
- Folder structure: by year → by quarter → by topic
- Customer files in CRM, not OneDrive

### Photo storage
- For social / marketing: Google Photos shared album per division
- For operations / proof: in CRM tied to customer record
- For website gallery: Cloudinary (already configured)

### Banking + payments
- Main bank: pick a Canadian big-5 with a small business RM
- Payment processing: Stripe (if invoicing via CRM, usually built in)
- E-transfer for the office line

### Website + analytics
- Site: already built and live at prestigeviewservices.ca
- Analytics: Vercel Analytics (built-in, free) + Google Analytics
  (set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in .env to enable)
- Search Console: free, see `docs/search-console.md`

### Social media management
- Meta Business Suite — free, covers Facebook + Instagram
- Buffer or Later — if you want multi-platform scheduling
- Canva — for designing posts (free tier sufficient)

### Documentation (this notebook)
- OneNote — accessible everywhere, family of Microsoft 365
- Mirror copy in this OneDrive folder for version control via git

---

## What to automate

Automation isn't about removing humans — it's about removing
**repetitive decisions** so humans can focus on the ones that
matter.

| Task | Automate with |
|---|---|
| Customer booking confirmations (24hr before) | CRM auto-text |
| Invoice send after job complete | CRM auto-trigger |
| Payment reminders at 7 / 14 / 21 days | CRM auto-email |
| Review request 2 hr after job complete | CRM auto-text |
| Monthly social post drafts | Scheduling tool (drafted monthly, scheduled to publish) |
| Bank account transfers to tax / profit sub-accounts | Recurring transfer rules at bank |
| Recurring contract auto-renewal at year-end | CRM auto-task to Office for verbal confirm + re-quote |
| Daily route briefing text to crew leads | CRM auto-send by 8pm |
| Equipment maintenance reminders | Calendar recurring task |

---

## What NOT to automate (yet)

- Customer escalation conversations — human voice always
- Negative review responses — owner only
- Hiring decisions — humans
- Pricing changes — owner sets policy, not algorithm
- Quality complaints — human empathy required

The "boring" automations create capacity for the conversations that
matter.

---

## What to outsource

Order of operations as you grow:

### Outsource first (low-skill, high-time)
- **Bookkeeping** — Day 1 hire
- **Lawn care for your own house** — your time is too valuable to
  mow your own grass
- **Cleaning of office / personal space** — same logic

### Outsource second (specialized skill)
- **Tax / accounting** — annual + planning
- **Legal** — as-needed
- **Graphic design** — Canva works for daily; pro designer for
  branding refresh, big assets
- **Photography / videography** — for marketing showcase pieces

### Outsource third (strategic)
- **Marketing execution** — once revenue justifies $1k-2.5k/mo budget
- **Recruiting** — for high-stakes management hires only; do crew
  hiring yourself
- **Website maintenance** — when changes are routine (not for major
  rebuilds)

### Never outsource
- Vision / strategy
- Hiring decisions for management or crew lead roles
- Pricing decisions
- Customer relationships with your top 10 customers
- The values + culture of the company

---

## Software cost guideline

Rough monthly costs for a small service business:

| Category | Tool | Cost |
|---|---|---|
| CRM + scheduling | Jobber-class | $100-250 |
| Accounting | QBO | $40-90 |
| Payroll | Wagepoint | $30 base + $5/employee |
| Phone (business) | RingCentral or similar | $30-50/line |
| Email + Office | Microsoft 365 Business | $15/user |
| Social scheduler | Buffer free tier | $0-30 |
| Design | Canva free tier | $0-15 |
| Document storage | OneDrive (in 365) | included |
| Cloud (website hosting) | Vercel | $0-25 |
| Database (Neon) | Neon free tier | $0-30 |
| Photo CDN | Cloudinary free tier | $0-30 |
| **Total** | | **~$300-600/month** |

That's 3-6% of $10k revenue/month — reasonable for the leverage.

---

## Tool selection rules

When evaluating a new tool, ask:

1. **What problem does this solve?** (be specific — not "I should
   have this")
2. **What does it replace?** (if nothing, you're adding work, not
   removing it)
3. **Will I actually use it 3 months from now?** (be honest)
4. **What's the migration cost?** (data export from current tool,
   re-training team)
5. **Is there a free trial?** (always start there)

If you can't answer all 5, don't sign up. The tool graveyard is full
of $30/month subscriptions you forgot you had.

---

## Quarterly software audit

30 minutes, once a quarter. List every recurring software charge.
Ask:
- Still using it?
- Still essential?
- Better alternative now?
- Could we use it more fully?

Cancel anything that's not earning its keep. Most businesses save
$100-300/month from a single audit.

---

## Data backup

Hope is not a strategy. Have a plan.

- **CRM data:** export monthly to a CSV, store in OneDrive
- **Accounting data:** export annual backup before year-end close
- **Email + documents:** Microsoft 365 / Google handle backup
  automatically (verify retention settings)
- **Photos:** redundant copy in OneDrive
- **Website code:** git (already done)
- **Database:** Neon does point-in-time recovery; export occasionally
  for safety

When ransomware hits (it'll happen eventually), the question is
"how recent is your backup?" — not "do we have one?"

---

## Security basics (non-negotiable)

- **Two-factor authentication** on EVERY account: email, bank,
  accounting, CRM, social
- **Password manager** (1Password, Bitwarden) — never reuse
  passwords
- **Phishing awareness** — train every team member: never click
  unexpected links, never share passwords by email
- **Off-boarding checklist** — when someone leaves, change every
  password they had access to within 24 hours
- **Customer data** — PIPEDA compliance applies; don't share
  customer info beyond what's needed
- **WiFi at office** — separate guest network, never give the main
  one to customers / casual visitors

---

## When the tech breaks

Have a fallback for every system.

- Phone down → cell phone forwarding
- CRM down → handwritten route sheet + photo notes; sync later
- Bank login down → physical cheque book + cash for emergencies
- Internet down at office → mobile hotspot
- Power out → headlamps, paper route, defer non-urgent

Tech reliability is good but not perfect. Crews shouldn't grind to
a halt because the WiFi router died.

# PVS Operations Notebook

Your complete go-to for running Prestige View Services — built to help
you work **ON** the business, not **IN** it.

The notebook is split in two:

- **Owner Track (00, 14–23)** — strategy, marketing, finance, hiring,
  systems, growth. The owner's operating manual.
- **Operator Track (01–13)** — what the team does day-to-day. Vision,
  org, SOPs, training, customer scripts, payroll, inventory, social.

Start with `00-start-here.md`. For the printable cheat-sheet, see
`00a-weekly-playbook.md`.

> **Need it in OneNote?** Ready-to-import `.docx` versions of every
> file live in `docx/`. Drag the folder into OneNote and the structure
> imports automatically. Re-generate anytime with `npm run notebook:docx`.

---

## File index

### Owner Track — read first

| File | OneNote section |
|---|---|
| `00-start-here.md` | **Start Here** — orientation, how to use this notebook |
| `00a-weekly-playbook.md` | **Weekly Playbook** — printable cheat-sheet (pin above desk) |
| `14-owner-operating-system.md` | Owner Operating System — daily/weekly/monthly rhythm |
| `15-marketing-playbook.md` | Marketing Playbook — channels, lead gen, referrals, GBP |
| `15a-marketing-email-runbook.md` | Email Runbook — every template you'll send |
| `15b-marketing-paid-ads-runbook.md` | Paid Ads Runbook — Google Ads step-by-step |
| `15c-marketing-content-calendar.md` | 90-Day Content Calendar — pre-filled post ideas |
| `16-annual-calendar.md` | Annual Business Calendar — month-by-month plan |
| `17-financial-management.md` | Financial Management — pricing, P&L, cash flow, tax |
| `18-kpis-scorecard.md` | KPIs & Scorecard — 12 numbers to watch + templates |
| `19-strategic-planning.md` | Strategic Planning — annual + quarterly + rocks |
| `20-hiring-management.md` | Hiring Management — office + management + crew leads |
| `21-vendor-partners.md` | Vendors & Partners — accountant, insurance, bank, etc. |
| `22-systems-tools.md` | Systems & Tools — software stack, automation, outsourcing |
| `23-owner-growth-plan.md` | Owner Growth Plan — reading, network, health |

### Operator Track — the team uses these

| File | OneNote section |
|---|---|
| `01-vision.md` | Vision & Values |
| `02-org-structure.md` | Organizational Structure |
| `03-sops-general.md` | SOPs — Company-Wide |
| `04-sops-lawnpros.md` | SOPs — LawnPros |
| `05-sops-clearview.md` | SOPs — ClearView |
| `06-sops-snowland.md` | SOPs — SnowLand |
| `07-training-lawnpros.md` | Training — LawnPros |
| `08-training-clearview.md` | Training — ClearView |
| `09-training-snowland.md` | Training — SnowLand |
| `10-scripts-customer.md` | Customer-Facing Scripts |
| `11-payroll.md` | Payroll |
| `12-inventory.md` | Inventory |
| `13-social-media.md` | Social Media |

---

## How to import into OneNote

### Recommended path — drag the `docx/` folder into OneNote

The `docx/` folder ships pre-built. Every markdown file is mirrored
as a properly-styled Word document. OneNote imports them with
headings, lists, tables, blockquotes, and code blocks preserved.

1. Open OneNote → Create a notebook called **PVS Operations**
2. Optional: create two **Section Groups** — "Owner Track" and
   "Operator Track" — for organization
3. For each `.docx` in `docs/onenote-notebook/docx/`:
   - In OneNote: **Insert → File Printout → pick the `.docx`**
   - Or: drag the file straight into the section
4. Rename each imported section to match the filename without
   the number prefix (e.g. `00-start-here` → "Start Here")

### Re-build the DOCX folder anytime

When you update a markdown file (or I do), regenerate the matching
DOCX with:

```powershell
npm run notebook:docx
```

Takes about 20 seconds for the whole notebook.

### Alternative paths

**Copy / paste the markdown directly:** OneNote handles markdown
headings as page breaks. Slower but works if you want to skip the
docx step entirely.

**Live-link path:** This folder is already in OneDrive AND under
git. Edit markdown in VS Code, push changes, re-run
`npm run notebook:docx`, re-import. Every update has a diff history.

---

## How to actually use this notebook

If you do nothing else, follow this sequence:

| Week | Do this |
|---|---|
| 1 | Read all of **Owner Track** (~6 hours). Take notes. |
| 2 | Build your KPI dashboard from `18-kpis-scorecard.md`. |
| 3 | Block all owner rhythms in your calendar (from `14-owner-operating-system.md`). |
| 4 | Run a full rhythm — daily + weekly + monthly. Fix what's broken. |
| Ongoing | One Owner Track section per week — re-read, improve, commit. |
| Quarterly | Strategic planning weekend per `19-strategic-planning.md`. |
| Annually | Full planning week in December. |

The notebook is alive. Keep editing it. The version you build over
12 months — tailored to your reality — is more valuable than what
you start with.

---

## The four leverage points

When you have owner-time, spend it on one of these:

1. **Hire the next person well** — one great hire frees 20+ hours/week
2. **Pricing changes** — a 5% increase often goes entirely to bottom
   line
3. **Marketing system that runs without you** — referrals + GBP +
   recurring contracts compound
4. **A clear standard so the team self-corrects** — every SOP is
   leverage

If an hour of owner time doesn't go to one of these, ask why.

---

## The decision filter

When stuck, ask:

> *"Does this make us more reliable, more recognisable, or more
> recurring? If not, why are we doing it?"*

If the answer isn't immediate — the answer is no.

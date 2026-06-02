# PVS Operations Notebook

Your complete go-to for running Prestige View Services — built to help
you work **ON** the business, not **IN** it.

The notebook is split in two:

- **Owner Track (00, 14–23)** — strategy, marketing, finance, hiring,
  systems, growth. The owner's operating manual.
- **Operator Track (01–13)** — what the team does day-to-day. Vision,
  org, SOPs, training, customer scripts, payroll, inventory, social.

Start with `00-start-here.md`.

---

## File index

### Owner Track — read first

| File | OneNote section |
|---|---|
| `00-start-here.md` | **Start Here** — orientation, how to use this notebook |
| `14-owner-operating-system.md` | Owner Operating System — daily/weekly/monthly rhythm |
| `15-marketing-playbook.md` | Marketing Playbook — channels, lead gen, referrals, GBP |
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

### Easiest path — copy/paste each section
1. Create a new notebook in OneNote called **PVS Operations**
2. Add two **Section Groups**: "Owner Track" and "Operator Track"
3. For each `.md` file:
   - Add a OneNote Section to the matching group, named for the file
   - Open the `.md` in VS Code / Notepad, copy all
   - Paste into the OneNote section — OneNote keeps headings as
     page breaks

### Cleaner path — convert to .docx first
OneNote imports `.docx` natively, preserving structure.

```powershell
# One-time: install pandoc from https://pandoc.org/installing.html
cd "docs\onenote-notebook"
foreach ($f in Get-ChildItem -Filter *.md) {
  pandoc $f.Name -o "$($f.BaseName).docx"
}
```

Then drag each `.docx` into OneNote, or **Insert → File Printout**.

### Live-link path — keep this folder as source of truth
This folder is already in OneDrive AND under git. Edit in VS Code,
push changes, and re-import or re-paste when SOPs change. Every
update has a diff history.

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

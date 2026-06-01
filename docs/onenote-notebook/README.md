# PVS Operations Notebook

A complete operating manual for Prestige View Services — Vision, Org Structure,
SOPs, Training, Scripts, Payroll, Inventory, and Social Media. Each `.md` file
maps to one OneNote **Section**, and the H2 headings inside become **Pages**.

## How to import into OneNote

### Easiest path — copy/paste each section
1. Create a new notebook in OneNote called **PVS Operations**
2. For each `.md` file in this folder:
   - Add a OneNote Section with the file's title (e.g. "SOPs")
   - Open the `.md` in VS Code / Notepad, copy all
   - Paste into the OneNote section — OneNote keeps headings as page breaks

### Cleaner path — convert to .docx first
OneNote imports `.docx` natively, preserving structure.

```powershell
# Once, install pandoc: https://pandoc.org/installing.html
cd "docs\onenote-notebook"
foreach ($f in Get-ChildItem -Filter *.md) {
  pandoc $f.Name -o "$($f.BaseName).docx"
}
```

Then in OneNote: **Insert → File Printout** for each `.docx`, or just drag
them into the notebook.

### Live-link path — keep this folder as the source of truth
Put this whole folder in OneDrive (you already do — it's under
`OneDrive\Bureau\PVS Website\docs\onenote-notebook`). Update the markdown
files when SOPs change, and re-import. Markdown stays diff-able in git, so
every change is traceable.

---

## File index

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

## How to use this notebook in day-to-day operations

- **Owner / Operations**: Review one section per week. Update what's
  stale. Send the diff to the team.
- **New hires**: Read Vision → Org Structure → the SOPs + Training for
  their division on Day 1. Sign off when each is complete.
- **Office / Dispatch**: Live in the SOPs and Scripts sections. They're
  the source of truth for how every customer interaction goes.
- **Crews**: Bookmark their division's SOP and Training pages on their
  phone. The pre-job checklist is a daily reference.
- **Quarterly review**: Compare what's in the notebook to what actually
  happens on the ground. Update one, the other, or both.

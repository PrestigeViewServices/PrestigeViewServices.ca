<#
.SYNOPSIS
    Import the PVS Operations Notebook into local OneNote (Windows).

.DESCRIPTION
    Reads every .docx from docs/onenote-notebook/docx/ and inserts each
    one as a page in a OneNote notebook called "PVS Operations", organized
    into "Owner Track" and "Operator Track" section groups.

    Uses the OneNote 2016 desktop COM API. Won't work with the Microsoft
    Store version of OneNote (the modern Windows app) — install the
    classic OneNote 2016 desktop from microsoft.com if you don't have it.

.PARAMETER NotebookName
    Name of the OneNote notebook to create or use. Default: "PVS Operations"

.PARAMETER DocxFolder
    Path to the folder containing the .docx files.
    Default: ../docs/onenote-notebook/docx relative to this script

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\import-to-onenote.ps1

.NOTES
    - OneNote 2016 desktop must be installed and have been opened at least
      once (so the COM server is registered)
    - The notebook is created in your default OneNote location (usually
      OneDrive)
    - Re-running the script appends new pages — it doesn't dedupe. If you
      want a clean re-import, delete the notebook in OneNote first.
    - Each .docx becomes a page with a file printout (read-only render).
      To edit content inside OneNote, paste from the .docx instead — this
      script prioritizes faithful formatting over editable text.
#>

[CmdletBinding()]
param(
    [string]$NotebookName = "PVS Operations",
    [string]$DocxFolder = (Join-Path $PSScriptRoot ".." | Join-Path -ChildPath "docs/onenote-notebook/docx")
)

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Map each docx filename to a section group + clean section name
# ---------------------------------------------------------------------------
$OWNER_TRACK = "Owner Track"
$OPERATOR_TRACK = "Operator Track"

function Get-SectionGroupFor($baseName) {
    # File numbering: 00 + 14-23 = Owner Track; 01-13 = Operator Track
    $num = if ($baseName -match '^(\d+)') { [int]$matches[1] } else { 0 }
    if ($num -eq 0 -or ($num -ge 14 -and $num -le 23)) { return $OWNER_TRACK }
    return $OPERATOR_TRACK
}

function Get-PrettyPageName($baseName) {
    # 14-owner-operating-system → "Owner Operating System"
    # 00a-weekly-playbook       → "Weekly Playbook"
    $name = $baseName -replace '^\d+[a-z]?[-\s]+', ''
    $words = $name -split '-' | ForEach-Object {
        if ($_.Length -gt 0) {
            $_.Substring(0, 1).ToUpper() + $_.Substring(1)
        }
    }
    return ($words -join ' ')
}

# ---------------------------------------------------------------------------
# Resolve + validate paths
# ---------------------------------------------------------------------------
$DocxFolder = (Resolve-Path $DocxFolder -ErrorAction SilentlyContinue).Path
if (-not $DocxFolder -or -not (Test-Path $DocxFolder)) {
    Write-Host "ERROR: docx folder not found." -ForegroundColor Red
    Write-Host "Expected: $DocxFolder" -ForegroundColor Red
    Write-Host "Run 'npm run notebook:docx' first to generate the .docx files."
    exit 1
}

$docxFiles = Get-ChildItem -Path $DocxFolder -Filter *.docx | Sort-Object Name
if ($docxFiles.Count -eq 0) {
    Write-Host "ERROR: no .docx files in $DocxFolder" -ForegroundColor Red
    Write-Host "Run 'npm run notebook:docx' first."
    exit 1
}

Write-Host "`nFound $($docxFiles.Count) .docx files to import." -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# Connect to OneNote via COM
# ---------------------------------------------------------------------------
try {
    $onenote = New-Object -ComObject OneNote.Application
} catch {
    Write-Host "`nERROR: could not connect to OneNote." -ForegroundColor Red
    Write-Host "Make sure OneNote 2016 desktop is installed (not the Microsoft Store version) and has been opened at least once." -ForegroundColor Yellow
    Write-Host "Download: https://www.microsoft.com/en-us/microsoft-365/onenote/digital-note-taking-app"
    exit 1
}

$ns = "http://schemas.microsoft.com/office/onenote/2013/onenote"

# ---------------------------------------------------------------------------
# Get the full notebook hierarchy
# ---------------------------------------------------------------------------
[xml]$hierarchy = ""
$onenote.GetHierarchy("", "hsNotebooks", [ref]$hierarchy)

# Find or create the notebook
$notebookNode = $hierarchy.Notebooks.Notebook | Where-Object { $_.name -eq $NotebookName }

if (-not $notebookNode) {
    Write-Host "Notebook '$NotebookName' not found. Creating it..."
    # OpenHierarchy with create-if-missing on a new notebook
    $notebookPath = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "OneNote Notebooks/$NotebookName"
    [string]$notebookId = ""
    try {
        $onenote.OpenHierarchy($notebookPath, "", [ref]$notebookId, "cftNotebook")
    } catch {
        Write-Host "  Couldn't create at $notebookPath" -ForegroundColor Yellow
        Write-Host "  Create the notebook manually in OneNote first, then re-run."
        exit 1
    }
    # Re-fetch hierarchy
    $onenote.GetHierarchy("", "hsNotebooks", [ref]$hierarchy)
    $notebookNode = $hierarchy.Notebooks.Notebook | Where-Object { $_.name -eq $NotebookName }
}

$notebookId = $notebookNode.ID
Write-Host "Using notebook: $NotebookName" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Get sections + section groups under the notebook
# ---------------------------------------------------------------------------
[xml]$nbXml = ""
$onenote.GetHierarchy($notebookId, "hsSections", [ref]$nbXml)

function Ensure-SectionGroup($groupName) {
    $existing = $nbXml.SelectNodes("//*[local-name()='SectionGroup'][@name='$groupName']")
    if ($existing.Count -gt 0) {
        return $existing[0].ID
    }
    [string]$newId = ""
    $onenote.OpenHierarchy($groupName, $notebookId, [ref]$newId, "cftSectionGroup")
    # Refresh local cache
    $onenote.GetHierarchy($notebookId, "hsSections", [ref]$script:nbXml)
    return $newId
}

function Ensure-Section($parentId, $sectionName) {
    [xml]$parentXml = ""
    $onenote.GetHierarchy($parentId, "hsSections", [ref]$parentXml)
    $existing = $parentXml.SelectNodes("//*[local-name()='Section'][@name='$sectionName']")
    if ($existing.Count -gt 0) {
        return $existing[0].ID
    }
    [string]$newId = ""
    $onenote.OpenHierarchy("$sectionName.one", $parentId, [ref]$newId, "cftSection")
    return $newId
}

Write-Host "Creating section groups..." -ForegroundColor Cyan
$ownerGroupId = Ensure-SectionGroup $OWNER_TRACK
$operatorGroupId = Ensure-SectionGroup $OPERATOR_TRACK
Write-Host "  ✓ $OWNER_TRACK"
Write-Host "  ✓ $OPERATOR_TRACK"

# ---------------------------------------------------------------------------
# Import each .docx as a new page (file printout)
# ---------------------------------------------------------------------------
Write-Host "`nImporting pages..." -ForegroundColor Cyan

$imported = 0
$failed = 0

foreach ($docx in $docxFiles) {
    $baseName = $docx.BaseName
    $groupName = Get-SectionGroupFor $baseName
    $pageName = Get-PrettyPageName $baseName

    $parentGroupId = if ($groupName -eq $OWNER_TRACK) { $ownerGroupId } else { $operatorGroupId }
    $sectionId = Ensure-Section $parentGroupId $pageName

    [string]$newPageId = ""
    try {
        $onenote.CreateNewPage($sectionId, [ref]$newPageId)

        $pageXml = @"
<?xml version="1.0"?>
<one:Page xmlns:one="$ns" ID="$newPageId">
  <one:Title>
    <one:OE>
      <one:T><![CDATA[$pageName]]></one:T>
    </one:OE>
  </one:Title>
  <one:Outline>
    <one:Position x="36" y="86" />
    <one:Size width="612" height="200" />
    <one:OEChildren>
      <one:OE>
        <one:InsertedFile pathSource="$($docx.FullName.Replace('\','\\'))" preferredName="$($docx.Name)" />
      </one:OE>
    </one:OEChildren>
  </one:Outline>
</one:Page>
"@
        $onenote.UpdatePageContent($pageXml)
        Write-Host "  ✓ [$groupName] $pageName" -ForegroundColor Green
        $imported++
    } catch {
        Write-Host "  ✗ [$groupName] $pageName  —  $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`nDone. $imported imported, $failed failed." -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "Open OneNote and check the '$NotebookName' notebook."

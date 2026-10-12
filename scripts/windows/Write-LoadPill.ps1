<#
.SYNOPSIS
  Samples this PC's REAL load and writes it in the exact shape of the DREAM TEAM board's hq/load doc.

.DESCRIPTION
  - Reads CPU %, processor queue length and core count (never invents numbers).
  - Computes load1 / load5 / load15 from a rolling history, ratio = load1 / cpus, and the level
    (low < 0.5, normal < 1, high < 1.5, else extreme: the same four words the board uses).
  - Writes load.json (atomic), appends load-log.csv (timestamped), skips writes that would be duplicates.
  - Optional -Install registers a hidden Scheduled Task every N minutes (conhost --headless: no popup window).
  - Everything that changes the system honours -WhatIf.

  HOW IT REACHES THE BOARD: plain PowerShell has no authenticated way to write the artifact database.
  This script produces load.json; a Claude session with the Artifact tool (Cowork heartbeat or Claude Code)
  reads that file and writes hq/load. See the notes at the bottom of this file.

.EXAMPLE
  .\Write-LoadPill.ps1 -WhatIf                 # sample and show what it would write, change nothing
  .\Write-LoadPill.ps1                         # one sample, writes load.json + log
  .\Write-LoadPill.ps1 -Install -WhatIf        # show the scheduled task it would create
  .\Write-LoadPill.ps1 -Install -EveryMinutes 5
  .\Write-LoadPill.ps1 -Uninstall
  .\Write-LoadPill.ps1 -Status                 # last reading, task state, FRESH / STALE (exit 0 / 3)
  .\Write-LoadPill.ps1 -Prompt                 # paste-ready instruction that syncs load.json into hq/pcload
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Low')]
param(
  [string]$OutDir = (Join-Path $env:LOCALAPPDATA 'DreamTeam\load'),
  [int]$Samples = 3,                 # CPU samples taken one second apart
  [int]$MinSecondsBetweenWrites = 60, # duplicate / flood guard
  [int]$MaxLogLines = 5000,
  [switch]$Install,
  [switch]$Uninstall,
  [switch]$Status,                   # show the last reading and whether it is stale (older than StaleMinutes)
  [switch]$Prompt,                   # print the paste-ready instruction that syncs load.json into the board's hq/pcload
  [int]$StaleMinutes = 15,
  [int]$EveryMinutes = 5,
  [string]$TaskName = 'DreamTeam-LoadPill'
)

$ErrorActionPreference = 'Stop'
$script:LogFile = Join-Path $OutDir 'load-log.csv'

function Write-Log {
  param([string]$Level, [string]$Message)
  $line = '{0:yyyy-MM-dd HH:mm:ss},{1},"{2}"' -f (Get-Date), $Level, ($Message -replace '"', "'")
  Write-Verbose $line
  if ($WhatIfPreference) { return }
  try {
    if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
    if (-not (Test-Path $script:LogFile)) { 'time,level,message' | Set-Content -Path $script:LogFile -Encoding UTF8 }
    Add-Content -Path $script:LogFile -Value $line -Encoding UTF8
  } catch { Write-Warning "Log write failed: $($_.Exception.Message)" }
}

function Get-LevelName([double]$ratio) {
  if ($ratio -lt 0.5) { 'low' } elseif ($ratio -lt 1) { 'normal' } elseif ($ratio -lt 1.5) { 'high' } else { 'extreme' }
}

# ---------- Status: honest freshness, never "ok" on old data ----------
if ($Status) {
  $f = Join-Path $OutDir 'load.json'
  if (-not (Test-Path $f)) { Write-Host "No reading yet at $f. Run the script once first."; exit 2 }
  $d = Get-Content $f -Raw | ConvertFrom-Json
  $ageMin = [math]::Round(([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() - [int64]$d.updatedAt) / 60000, 1)
  $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
  Write-Host ("PC load: {0} / {1} / {2}  ratio {3}  level {4}  ({5} cores)" -f $d.load1, $d.load5, $d.load15, $d.ratio, $d.level, $d.cpus)
  Write-Host ("Task '{0}': {1}" -f $TaskName, $(if ($task) { $task.State } else { 'NOT INSTALLED' }))
  if ($ageMin -gt $StaleMinutes) { Write-Host "STALE: last reading $ageMin min ago (limit $StaleMinutes)." -ForegroundColor Yellow; exit 3 }
  Write-Host "FRESH: last reading $ageMin min ago." -ForegroundColor Green
  return
}

# ---------- Prompt: paste into a Claude session that has the Artifact tool (Cowork heartbeat / Claude Code) ----------
if ($Prompt) {
  $p = Join-Path $OutDir 'load.json'
  @"
PC load sync (every heartbeat). Do ONLY this: read the file $p (the REAL numbers written by Write-LoadPill.ps1; never invent or edit them).
Then ArtifactData get hq/pcload for its version and update it with exactly the fields in that file
(load1, load5, load15, cpus, ratio, level, note, updatedAt) pinned with if_version.
If updatedAt is older than $StaleMinutes minutes, write level:'stale' and note:'last reading N min ago' instead of the old level.
If the file is missing, write nothing and tell Justin. Send Justin nothing otherwise.
"@ | Write-Host
  return
}

# ---------- Install / Uninstall (scheduled task, hidden window) ----------
if ($Uninstall) {
  if ($PSCmdlet.ShouldProcess($TaskName, 'Unregister scheduled task')) {
    try { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false; Write-Host "Removed task $TaskName" }
    catch { Write-Warning "Could not remove ${TaskName}: $($_.Exception.Message)" }
  }
  return
}
if ($Install) {
  $self = $MyInvocation.MyCommand.Path
  if (-not $self) { throw 'Run this from a saved .ps1 file to use -Install.' }
  # conhost --headless keeps PowerShell from flashing a console window every run
  $arg = "--headless powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$self`" -OutDir `"$OutDir`""
  if ($PSCmdlet.ShouldProcess($TaskName, "Register task every $EveryMinutes min: conhost.exe $arg")) {
    $action  = New-ScheduledTaskAction -Execute 'conhost.exe' -Argument $arg
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $EveryMinutes)
    $set     = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $set -Force | Out-Null
    Write-Host "Registered $TaskName (every $EveryMinutes min). Output: $OutDir"
  }
  return
}

# ---------- One run: single-instance guard ----------
$mutex = New-Object System.Threading.Mutex($false, 'Global\DreamTeamLoadPill')
if (-not $mutex.WaitOne(0)) { Write-Host 'Another run is in progress, skipping.'; return }
try {
  # ---------- Sample REAL numbers ----------
  $cores = [int][Environment]::ProcessorCount   # no CIM module load, so -WhatIf prints no alias noise
  if ($cores -lt 1) { throw 'Could not read the logical processor count.' }

  $cpuCounter = '\Processor Information(_Total)\% Processor Time'
  $qCounter   = '\System\Processor Queue Length'
  $c = Get-Counter -Counter $cpuCounter, $qCounter -SampleInterval 1 -MaxSamples $Samples
  $cpuAvg = ($c | ForEach-Object { ($_.CounterSamples | Where-Object Path -like '*% processor time').CookedValue } | Measure-Object -Average).Average
  $qAvg   = ($c | ForEach-Object { ($_.CounterSamples | Where-Object Path -like '*queue length').CookedValue } | Measure-Object -Average).Average
  if ($null -eq $cpuAvg) { throw 'CPU counter returned nothing.' }

  # "load" = busy cores + threads waiting for a core (the Windows analogue of a Linux load average)
  $nowSample = [math]::Round(($cpuAvg / 100.0 * $cores) + [double]$qAvg, 2)
  $nowMs = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

  # ---------- Rolling history gives load5 / load15 ----------
  $histFile = Join-Path $OutDir 'history.json'
  $hist = @()
  if (Test-Path $histFile) {
    try {
      # Windows PowerShell 5.1 returns a JSON array as ONE nested object; piping through ForEach-Object flattens it into real readings
      $raw  = Get-Content $histFile -Raw | ConvertFrom-Json
      $hist = @($raw | ForEach-Object { $_ } | Where-Object { $_ -and $null -ne $_.t -and $null -ne $_.v -and ($_.t -isnot [array]) -and ($_.v -isnot [array]) })
    } catch { Write-Log 'WARN' 'history.json unreadable, starting fresh'; $hist = @() }
  }
  $hist = @($hist | Where-Object { [int64]$_.t -gt ($nowMs - 15 * 60 * 1000) }) + [pscustomobject]@{ t = $nowMs; v = $nowSample }
  function Get-Avg($minutes) {
    $vals = @($hist | Where-Object { $_.t -gt ($nowMs - $minutes * 60 * 1000) } | ForEach-Object { [double]$_.v })
    if ($vals.Count -eq 0) { return $nowSample }
    [math]::Round(($vals | Measure-Object -Average).Average, 2)
  }
  $load1  = $nowSample
  $load5  = Get-Avg 5
  $load15 = Get-Avg 15
  $ratio  = [math]::Round($load1 / $cores, 2)
  $level  = Get-LevelName $ratio
  $note   = if ($level -eq 'low') { 'calm' } else { ('cpu {0:N0}%, queue {1:N1}' -f $cpuAvg, $qAvg) }

  $doc = [ordered]@{ load1 = $load1; load5 = $load5; load15 = $load15; cpus = $cores; ratio = $ratio; level = $level; note = $note; updatedAt = $nowMs }
  $json = $doc | ConvertTo-Json -Compress

  # ---------- Duplicate / flood guard ----------
  $outFile = Join-Path $OutDir 'load.json'
  if (Test-Path $outFile) {
    try {
      $prev = Get-Content $outFile -Raw | ConvertFrom-Json
      $ageSec = ($nowMs - [int64]$prev.updatedAt) / 1000
      if ($ageSec -lt $MinSecondsBetweenWrites) { Write-Log 'SKIP' "last write ${ageSec}s ago (< $MinSecondsBetweenWrites)"; Write-Host "Skipped: wrote ${ageSec}s ago."; return }
    } catch { Write-Log 'WARN' 'load.json unreadable, overwriting' }
  }

  Write-Host $json
  if ($PSCmdlet.ShouldProcess($outFile, 'Write load.json, history and log line')) {
    if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
    $tmp = "$outFile.tmp"
    Set-Content -Path $tmp -Value $json -Encoding UTF8            # atomic: temp file then move
    Move-Item -Path $tmp -Destination $outFile -Force
    ConvertTo-Json -InputObject @($hist) -Compress | Set-Content -Path $histFile -Encoding UTF8   # always a JSON array, even with one reading
    Write-Log 'OK' "ratio=$ratio level=$level cpu=$([math]::Round($cpuAvg,1))% queue=$([math]::Round($qAvg,1)) cores=$cores"
    # keep the log from growing forever
    $lines = @(Get-Content $script:LogFile)
    if ($lines.Count -gt $MaxLogLines) { (@($lines[0]) + @($lines[(-($MaxLogLines - 1))..-1])) | Set-Content -Path $script:LogFile -Encoding UTF8 }
  }
}
catch {
  Write-Log 'ERROR' $_.Exception.Message
  Write-Error $_
  exit 1
}
finally {
  $mutex.ReleaseMutex() | Out-Null
  $mutex.Dispose()
}

<#
NOTES
- Meaning change: the pill currently shows the cloud container's load (4 CPUs). This file reports YOUR PC.
  Keep them separate (e.g. hq/load for the container, hq/pcload for the PC) or switch the pill to the PC, your call.
- Getting load.json into the board: a Claude session reads %LOCALAPPDATA%\DreamTeam\load\load.json and runs
  ArtifactData update hq/load (pin if_version). No credentials ever live in this script.
- Stale detection: if updatedAt is older than 15 minutes the board should say "stale, last reading X min ago", not "ok".
- Test first: run with -WhatIf, then once for real, then check load.json and load-log.csv, then -Install.
#>

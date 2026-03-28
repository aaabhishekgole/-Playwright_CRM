$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$docsPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$templatePath = "C:\Program Files\Microsoft Office\root\Templates\1033\WidescreenPresentation.potx"
$outputPath = Join-Path $docsPath "Gadget-Seva-Hub-Platform-Overview.pptx"

if (-not (Test-Path $templatePath)) {
    throw "PowerPoint template not found at $templatePath"
}

Copy-Item -LiteralPath $templatePath -Destination $outputPath -Force

function Escape-Xml([string]$value) {
    return [System.Security.SecurityElement]::Escape($value)
}

function New-ParagraphXml([string]$text, [int]$fontSize = 1800, [bool]$bold = $false) {
    $escaped = Escape-Xml $text
    $boldValue = if ($bold) { ' b="1"' } else { '' }
    return "<a:p><a:pPr marL=`"0`" indent=`"0`"><a:buNone/></a:pPr><a:r><a:rPr lang=`"en-US`" sz=`"$fontSize`"$boldValue dirty=`"0`" smtClean=`"0`"/><a:t>$escaped</a:t></a:r><a:endParaRPr lang=`"en-US`" sz=`"$fontSize`" dirty=`"0`"/></a:p>"
}

function New-TitlePlaceholderXml([int]$id, [string]$text) {
    $paragraph = New-ParagraphXml $text 2800 $true
    return "<p:sp><p:nvSpPr><p:cNvPr id=`"$id`" name=`"Title $id`"/><p:cNvSpPr><a:spLocks noGrp=`"1`"/></p:cNvSpPr><p:nvPr><p:ph type=`"title`"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang=`"en-US`" sz=`"2800`" b=`"1`" dirty=`"0`" smtClean=`"0`"/><a:t>$(Escape-Xml $text)</a:t></a:r><a:endParaRPr lang=`"en-US`" sz=`"2800`" dirty=`"0`"/></a:p></p:txBody></p:sp>"
}

function New-SubtitlePlaceholderXml([int]$id, [string]$text) {
    return "<p:sp><p:nvSpPr><p:cNvPr id=`"$id`" name=`"Subtitle $id`"/><p:cNvSpPr><a:spLocks noGrp=`"1`"/></p:cNvSpPr><p:nvPr><p:ph type=`"subTitle`" idx=`"1`"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr><a:normAutofit fontScale=`"85000`" lnSpcReduction=`"20000`"/></a:bodyPr><a:lstStyle/><a:p><a:r><a:rPr lang=`"en-US`" sz=`"1600`" dirty=`"0`" smtClean=`"0`"/><a:t>$(Escape-Xml $text)</a:t></a:r><a:endParaRPr lang=`"en-US`" sz=`"1600`" dirty=`"0`"/></a:p></p:txBody></p:sp>"
}

function New-TextBoxXml([int]$id, [int]$x, [int]$y, [int]$cx, [int]$cy, [string[]]$paragraphs, [int]$fontSize = 1800) {
    $paragraphXml = ($paragraphs | ForEach-Object { New-ParagraphXml $_ $fontSize $false }) -join ""
    return "<p:sp><p:nvSpPr><p:cNvPr id=`"$id`" name=`"TextBox $id`"/><p:cNvSpPr txBox=`"1`"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x=`"$x`" y=`"$y`"/><a:ext cx=`"$cx`" cy=`"$cy`"/></a:xfrm><a:prstGeom prst=`"rect`"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap=`"square`" rtlCol=`"0`"><a:spAutoFit/></a:bodyPr><a:lstStyle/>$paragraphXml</p:txBody></p:sp>"
}

function New-SlideXml([string]$title, [string[]]$bodyLines, [string[]]$bodyLinesRight = @()) {
    $shapes = @()
    $shapes += New-TitlePlaceholderXml 2 $title
    $shapes += New-TextBoxXml 3 731520 1463040 10149888 4200000 $bodyLines 1800
    if ($bodyLinesRight.Count -gt 0) {
        $shapes = @()
        $shapes += New-TitlePlaceholderXml 2 $title
        $shapes += New-TextBoxXml 3 731520 1680000 4620000 3400000 $bodyLines 1700
        $shapes += New-TextBoxXml 4 5670000 1680000 4620000 3400000 $bodyLinesRight 1700
    }
    $shapeXml = $shapes -join ""
    return "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><p:sld xmlns:a=`"http://schemas.openxmlformats.org/drawingml/2006/main`" xmlns:r=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships`" xmlns:p=`"http://schemas.openxmlformats.org/presentationml/2006/main`"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id=`"1`" name=`"`"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x=`"0`" y=`"0`"/><a:ext cx=`"0`" cy=`"0`"/><a:chOff x=`"0`" y=`"0`"/><a:chExt cx=`"0`" cy=`"0`"/></a:xfrm></p:grpSpPr>$shapeXml</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>"
}

function New-TitleSlideXml([string]$title, [string]$subtitle) {
    $shapeXml = @(
        (New-TitlePlaceholderXml 2 $title),
        (New-SubtitlePlaceholderXml 3 $subtitle),
        (New-TextBoxXml 4 731520 4572000 5486400 700000 @("Generated from the updated Docs folder on 28 Mar 2026") 1100)
    ) -join ""
    return "<?xml version=`"1.0`" encoding=`"UTF-8`" standalone=`"yes`"?><p:sld xmlns:a=`"http://schemas.openxmlformats.org/drawingml/2006/main`" xmlns:r=`"http://schemas.openxmlformats.org/officeDocument/2006/relationships`" xmlns:p=`"http://schemas.openxmlformats.org/presentationml/2006/main`"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id=`"1`" name=`"`"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x=`"0`" y=`"0`"/><a:ext cx=`"0`" cy=`"0`"/><a:chOff x=`"0`" y=`"0`"/><a:chExt cx=`"0`" cy=`"0`"/></a:xfrm></p:grpSpPr>$shapeXml</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>"
}

function Set-ZipEntryText($zip, [string]$entryPath, [string]$content) {
    $existing = $zip.GetEntry($entryPath)
    if ($existing -ne $null) {
        $existing.Delete()
    }
    $entry = $zip.CreateEntry($entryPath)
    $writer = New-Object System.IO.StreamWriter($entry.Open(), [System.Text.UTF8Encoding]::new($false))
    try {
        $writer.Write($content)
    }
    finally {
        $writer.Dispose()
    }
}

$slides = @{
    "ppt/slides/slide1.xml" = (New-TitleSlideXml "Gadget Seva Hub" "Operations portal, runner workflow, hybrid mobile app, billing, notifications, and audit");
    "ppt/slides/slide2.xml" = (New-SlideXml "Platform At A Glance" @(
        "- Role-based admin portal for service request intake and lifecycle management",
        "- Indian device workflows covering mobile, TV, laptop, AC, and camera repair cases",
        "- Modules include Pickup, Hub, Service Center, Estimates, Cashless, QC, Delivery, Billing, Reports, and Audit",
        "- INR and rupee formatting are aligned across operational and finance screens"
    ));
    "ppt/slides/slide3.xml" = (New-SlideXml "Live Architecture" @(
        "- Frontend: Vite + React portal with protected routes, menu hierarchy, and shared toasts",
        "- Backend: Spring Boot API for auth, workflow transitions, attachments, notifications, billing, and audit",
        "- Storage: file-backed H2 locally and PostgreSQL-style integrated mode with the same domain model",
        "- Files and notifications support signed access, LOG mode, and HTTP gateway delivery for SMS / WhatsApp"
    ));
    "ppt/slides/slide4.xml" = (New-SlideXml "API Surface" @(
        "- /api/auth/login for portal and runner authentication",
        "- /api/service-requests for create, list, detail, pickup, estimate, status, delivery, attachments, invoice, payment, reconcile, and refund actions",
        "- /api/public/pickups/{token} for runner accept, evidence upload, delete, and pickup completion",
        "- /api/mobile/runner/notifications, /api/users, /api/users/pickup-runners, /api/devices/scan-qr, and /api/files/access"
    ));
    "ppt/slides/slide5.xml" = (New-SlideXml "End-To-End Workflow" @(
        "- REQUEST_CREATED -> PICKUP_ASSIGNED -> PICKUP_IN_PROGRESS -> PICKUP_COMPLETED",
        "- RECEIVED_AT_HUB -> DIAGNOSIS_IN_PROGRESS -> ESTIMATE_PREPARED",
        "- CASHLESS_PENDING_APPROVAL, ESTIMATE_APPROVED, and TOTAL_LOSS branches are supported",
        "- REPAIR_IN_PROGRESS -> REPAIR_COMPLETED -> READY_FOR_DISPATCH -> DELIVERY_ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED -> INVOICED -> CLOSED",
        "- status_history records each major transition"
    ));
    "ppt/slides/slide6.xml" = (New-SlideXml "Pickup Runner Flow" @(
        "- Admin onboards runner with mandatory mobile number and optional WhatsApp number",
        "- Assign Pickup sends a smart link by SMS, WhatsApp, and rider APP only to the scheduled runner",
        "- Runner opens the link in browser or hybrid mobile app and accepts the pickup",
        "- Runner uploads 10 mandatory device photos plus optional extra photos before pickup completion",
        "- Pickup done updates DB and API state and stores customer and admin notification records"
    ));
    "ppt/slides/slide7.xml" = (New-SlideXml "Menu, Data, And Mobile Parity" @(
        "- Menu source of truth: frontend/src/utils/menuHierarchy.ts and frontend/src/main.tsx",
        "- Specialized pages already exist for pickup dashboard, runner onboarding, assign pickup, delivery tracking, billing, and timeline",
        "- Core tables include service_requests, pickups, attachments, notifications, invoices, payments, status_history, users, and roles"
    ) @(
        "- Runner-specific fields include runner_portal_token, accepted_at, runner_link_sent_at, and whatsapp_number",
        "- Public rider routes: /runner-access/:token, /runner-portal/:token, and /runner-app",
        "- The Expo hybrid app uses the same live web pickup flow inside WebView for UI and behavior parity"
    ));
    "ppt/slides/slide8.xml" = (New-SlideXml "QA And Handoff" @(
        "- Updated Docs folder now includes API, architecture, DB schema, menu mapping, and test scenarios",
        "- Test scenarios cover auth, claim registration, runner onboarding, pickup, hub, estimates, cashless, repair, delivery, billing, notifications, and data checks",
        "- Web toasts and mobile alerts now provide submit feedback across major modules",
        "- This deck is saved in Docs for demo walkthroughs, stakeholder review, and handoff"
    ));
}

$zip = [System.IO.Compression.ZipFile]::Open($outputPath, [System.IO.Compression.ZipArchiveMode]::Update)

try {
    $contentTypesEntry = $zip.GetEntry("[Content_Types].xml")
    $reader = New-Object System.IO.StreamReader($contentTypesEntry.Open())
    try {
        $contentTypesXml = $reader.ReadToEnd()
    }
    finally {
        $reader.Dispose()
    }
    $contentTypesXml = $contentTypesXml.Replace(
        "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
    )
    Set-ZipEntryText $zip "[Content_Types].xml" $contentTypesXml

    foreach ($entryPath in $slides.Keys) {
        Set-ZipEntryText $zip $entryPath $slides[$entryPath]
    }
}
finally {
    $zip.Dispose()
}

Write-Output "Created presentation: $outputPath"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $projectRoot "public\support\tutorials"

function New-RoundedRectanglePath {
    param(
        [System.Drawing.RectangleF]$Rectangle,
        [float]$Radius
    )

    $diameter = $Radius * 2
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $path.AddArc($Rectangle.X, $Rectangle.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($Rectangle.Right - $diameter, $Rectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($Rectangle.X, $Rectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Add-TutorialAnnotation {
    param(
        [string]$Source,
        [string]$Output,
        [string]$Title,
        [string]$Caption,
        [int]$BoxX,
        [int]$BoxY,
        [int]$BoxWidth,
        [int]$ArrowStartX,
        [int]$ArrowStartY,
        [int]$TargetX,
        [int]$TargetY,
        [int]$TargetWidth,
        [int]$TargetHeight
    )

    $sourcePath = Join-Path $assetDir $Source
    $outputPath = Join-Path $assetDir $Output
    $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
    $bitmap = [System.Drawing.Bitmap]::new($sourceImage.Width, $sourceImage.Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $graphics.DrawImage($sourceImage, 0, 0, $sourceImage.Width, $sourceImage.Height)

    $blue = [System.Drawing.Color]::FromArgb(255, 0, 82, 255)
    $cyan = [System.Drawing.Color]::FromArgb(255, 0, 212, 166)
    $white = [System.Drawing.Color]::White

    $targetBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(42, 0, 82, 255))
    $targetPen = [System.Drawing.Pen]::new($cyan, 4)
    $targetRect = [System.Drawing.RectangleF]::new($TargetX, $TargetY, $TargetWidth, $TargetHeight)
    $targetPath = New-RoundedRectanglePath -Rectangle $targetRect -Radius 12
    $graphics.FillPath($targetBrush, $targetPath)
    $graphics.DrawPath($targetPen, $targetPath)

    $arrowPen = [System.Drawing.Pen]::new($cyan, 6)
    $arrowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $arrowPen.CustomEndCap = [System.Drawing.Drawing2D.AdjustableArrowCap]::new(7, 9, $true)
    $graphics.DrawLine($arrowPen, $ArrowStartX, $ArrowStartY, $TargetX + ($TargetWidth / 2), $TargetY + ($TargetHeight / 2))

    $boxHeight = 102
    $boxRect = [System.Drawing.RectangleF]::new($BoxX, $BoxY, $BoxWidth, $boxHeight)
    $boxPath = New-RoundedRectanglePath -Rectangle $boxRect -Radius 14
    $boxBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(244, 4, 10, 22))
    $boxBorder = [System.Drawing.Pen]::new($blue, 3)
    $graphics.FillPath($boxBrush, $boxPath)
    $graphics.DrawPath($boxBorder, $boxPath)

    $badgeRect = [System.Drawing.RectangleF]::new($BoxX + 14, $BoxY + 15, 32, 32)
    $badgeBrush = [System.Drawing.SolidBrush]::new($blue)
    $graphics.FillEllipse($badgeBrush, $badgeRect)

    $titleFont = [System.Drawing.Font]::new("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
    $captionFont = [System.Drawing.Font]::new("Segoe UI", 10.5, [System.Drawing.FontStyle]::Regular)
    $badgeFont = [System.Drawing.Font]::new("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $whiteBrush = [System.Drawing.SolidBrush]::new($white)
    $captionBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(225, 220, 229, 244))
    $center = [System.Drawing.StringFormat]::new()
    $center.Alignment = [System.Drawing.StringAlignment]::Center
    $center.LineAlignment = [System.Drawing.StringAlignment]::Center

    $stepNumber = [System.IO.Path]::GetFileNameWithoutExtension($Output).Split("-")[1]
    $graphics.DrawString($stepNumber, $badgeFont, $whiteBrush, $badgeRect, $center)
    $graphics.DrawString($Title, $titleFont, $whiteBrush, $BoxX + 58, $BoxY + 12)
    $captionRect = [System.Drawing.RectangleF]::new($BoxX + 58, $BoxY + 45, $BoxWidth - 72, 48)
    $graphics.DrawString($Caption, $captionFont, $captionBrush, $captionRect)

    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $center.Dispose()
    $captionBrush.Dispose()
    $whiteBrush.Dispose()
    $badgeFont.Dispose()
    $captionFont.Dispose()
    $titleFont.Dispose()
    $badgeBrush.Dispose()
    $boxBorder.Dispose()
    $boxBrush.Dispose()
    $boxPath.Dispose()
    $arrowPen.Dispose()
    $targetPath.Dispose()
    $targetPen.Dispose()
    $targetBrush.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
    $sourceImage.Dispose()
}

$annotations = @(
    @{ Source = "campagne-informations.png"; Output = "test-01-ouvrir-campagnes.png"; Title = "Ouvrez Campagnes"; Caption = "Cliquez sur Campagnes, puis sur Nouvelle campagne."; BoxX = 265; BoxY = 72; BoxWidth = 430; ArrowStartX = 290; ArrowStartY = 150; TargetX = 18; TargetY = 142; TargetWidth = 205; TargetHeight = 48 },
    @{ Source = "campagne-informations.png"; Output = "test-02-preparer-assistante.png"; Title = "Preparez l'assistante"; Caption = "Ajoutez l'objectif dans le Brief IA et choisissez la voix plus bas."; BoxX = 790; BoxY = 70; BoxWidth = 445; ArrowStartX = 830; ArrowStartY = 165; TargetX = 290; TargetY = 314; TargetWidth = 560; TargetHeight = 150 },
    @{ Source = "appel-test.png"; Output = "test-03-saisir-numero.png"; Title = "Saisissez votre numero"; Caption = "Utilisez le format international, par exemple +225XXXXXXXXXX."; BoxX = 630; BoxY = 245; BoxWidth = 450; ArrowStartX = 930; ArrowStartY = 345; TargetX = 902; TargetY = 362; TargetWidth = 307; TargetHeight = 46 },
    @{ Source = "appel-test.png"; Output = "test-04-lancer-test.png"; Title = "Lancez l'appel test"; Caption = "Cliquez ici, decrochez et verifiez que la conversation est naturelle."; BoxX = 600; BoxY = 520; BoxWidth = 480; ArrowStartX = 920; ArrowStartY = 520; TargetX = 902; TargetY = 410; TargetWidth = 307; TargetHeight = 48 },
    @{ Source = "campagne-informations.png"; Output = "campagne-01-nommer.png"; Title = "Nommez la campagne"; Caption = "Choisissez un nom clair, puis selectionnez le secteur."; BoxX = 770; BoxY = 70; BoxWidth = 455; ArrowStartX = 790; ArrowStartY = 165; TargetX = 290; TargetY = 86; TargetWidth = 560; TargetHeight = 148 },
    @{ Source = "campagne-informations.png"; Output = "campagne-02-brief.png"; Title = "Redigez le Brief IA"; Caption = "Precisez l'objectif, les questions, le ton et la fin de l'appel."; BoxX = 770; BoxY = 70; BoxWidth = 455; ArrowStartX = 800; ArrowStartY = 165; TargetX = 290; TargetY = 314; TargetWidth = 560; TargetHeight = 150 },
    @{ Source = "campagne-lancement.png"; Output = "campagne-03-importer-csv.png"; Title = "Importez les contacts"; Caption = "Deposez ici votre CSV avec prenom, nom et telephone."; BoxX = 300; BoxY = 350; BoxWidth = 470; ArrowStartX = 530; ArrowStartY = 450; TargetX = 292; TargetY = 480; TargetWidth = 552; TargetHeight = 152 },
    @{ Source = "campagne-lancement.png"; Output = "campagne-04-regles-appel.png"; Title = "Reglez les appels"; Caption = "Faites defiler vers le bas pour choisir horaires, relances, duree et voix."; BoxX = 300; BoxY = 555; BoxWidth = 535; ArrowStartX = 590; ArrowStartY = 655; TargetX = 280; TargetY = 668; TargetWidth = 570; TargetHeight = 50 },
    @{ Source = "campagne-lancement.png"; Output = "campagne-05-lancer.png"; Title = "Lancez la campagne"; Caption = "Apres l'appel test, cliquez ici pour demarrer les appels."; BoxX = 700; BoxY = 590; BoxWidth = 500; ArrowStartX = 1030; ArrowStartY = 590; TargetX = 890; TargetY = 470; TargetWidth = 330; TargetHeight = 65 }
)

foreach ($annotation in $annotations) {
    Add-TutorialAnnotation @annotation
}

Write-Output "Generated $($annotations.Count) annotated tutorial images in $assetDir"

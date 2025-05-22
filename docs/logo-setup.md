# Logo Setup for PDF Generation

## Current Status
The PDF generation system includes a placeholder for the logo in the lower right corner (20% max width).

## To Enable Real Logo

### Option 1: Convert SVG to PNG
1. Convert `public/images/logo.svg` to `public/images/logo.png`
2. Uncomment the logo code in `src/app/api/dossier/generate/route.ts` (lines with actual logo loading)
3. Comment out the placeholder rectangle code

### Option 2: Use Online Converter
```bash
# Install svg2png if needed
npm install -g svg2png-cli

# Convert the logo
svg2png public/images/logo.svg public/images/logo.png --width=200
```

### Option 3: Manual Export
1. Open `public/images/logo.svg` in design software (Figma, Illustrator, etc.)
2. Export as PNG with transparent background
3. Save as `public/images/logo.png`

## Code Changes Needed
Once you have `logo.png`, update the route file:

```typescript
// Replace this placeholder code:
page.drawRectangle({
  x: pageWidth - marginRight - (pageWidth * 0.15),
  y: marginBottom - 30,
  width: pageWidth * 0.15,
  height: 25,
  color: brandColor,
});

// With this real logo code:
const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
if (fs.existsSync(logoPath)) {
  const logoBytes = fs.readFileSync(logoPath);
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const logoMaxWidth = pageWidth * 0.2; // 20% of page width
  const logoDims = logoImage.scale(logoMaxWidth / logoImage.width);
  
  page.drawImage(logoImage, {
    x: pageWidth - marginRight - logoDims.width,
    y: marginBottom - logoDims.height,
    width: logoDims.width,
    height: logoDims.height,
  });
}
``` 
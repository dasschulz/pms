import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

// Import fontkit using require for compatibility
const fontkit = require('fontkit');

// Helper function to add page numbers
async function addPageNumber(page: any, pageNumber: number, totalPages: number, pageWidth: number, marginBottom: number, interRegular: any, textColor: any) {
  const pageText = `Seite ${pageNumber} von ${totalPages}`;
  const pageTextWidth = interRegular.widthOfTextAtSize(pageText, 10);
  const pageTextX = (pageWidth - pageTextWidth) / 2; // Center horizontally
  
  page.drawText(pageText, {
    x: pageTextX,
    y: marginBottom - 30, // Same height as logo area
    size: 10,
    font: interRegular,
    color: textColor,
  });
}

// Helper function to add logo to page
async function addLogoToPage(page: any, pdfDoc: any, pageWidth: number, marginRight: number, marginBottom: number, brandColor: any, interBold: any) {
  try {
    // Use the actual logo_rw.png file
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo_rw.png');
    
    if (fs.existsSync(logoPath)) {
      console.log('Loading actual logo from:', logoPath);
      const logoBytes = fs.readFileSync(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      
      // Scale logo to max 20% of page width
      const logoMaxWidth = pageWidth * 0.2;
      const logoScale = Math.min(logoMaxWidth / logoImage.width, 50 / logoImage.height); // Also limit height to 50px
      const logoDims = logoImage.scale(logoScale);
      
      // Position in lower right corner
      page.drawImage(logoImage, {
        x: pageWidth - marginRight - logoDims.width,
        y: marginBottom - logoDims.height - 10,
        width: logoDims.width,
        height: logoDims.height,
      });
      
      console.log(`Actual logo embedded successfully: ${logoDims.width}x${logoDims.height}px`);
    } else {
      console.log('Actual logo not found, using fallback');
      // Fallback to improved placeholder
      const logoWidth = pageWidth * 0.15;
      const logoHeight = 30;
      const logoX = pageWidth - marginRight - logoWidth;
      const logoY = marginBottom - logoHeight - 10;
      
      // Draw a subtle background rectangle
      page.drawRectangle({
        x: logoX - 5,
        y: logoY - 5,
        width: logoWidth + 10,
        height: logoHeight + 10,
        color: rgb(0.95, 0.95, 0.95), // Light gray background
      });
      
      // Draw brand-colored accent line
      page.drawRectangle({
        x: logoX,
        y: logoY + logoHeight - 3,
        width: logoWidth,
        height: 3,
        color: brandColor,
      });
      
      // Add stylized text placeholder
      page.drawText('MdB', {
        x: logoX + 5,
        y: logoY + 8,
        size: 14,
        font: interBold,
        color: brandColor,
      });
      
      page.drawText('Platform', {
        x: logoX + 45,
        y: logoY + 8,
        size: 10,
        font: interBold,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    
  } catch (error) {
    console.error('Error adding logo:', error);
    // Minimal fallback - just log the error and continue without logo
  }
}

// Helper function to wrap text with proper width
function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (textWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Text processing function for plaintext structure
const processPlaintextStructure = (text: string) => {
  const segments: Array<{text: string, isBold: boolean, isItalic: boolean}> = [];
  
  // Process **bold** formatting
  let currentPos = 0;
  let currentText = '';
  let inBold = false;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '*' && i + 1 < text.length && text[i + 1] === '*') {
      // Found ** - toggle bold
      if (currentText) {
        segments.push({text: currentText, isBold: inBold, isItalic: false});
        currentText = '';
      }
      inBold = !inBold;
      i++; // Skip the second *
    } else {
      currentText += text[i];
    }
  }
  
  // Add remaining text
  if (currentText) {
    segments.push({text: currentText, isBold: inBold, isItalic: false});
  }
  
  return segments;
};

// Helper function to clean up text spacing issues
function cleanupTextSpacing(text: string): string {
  return text
    // Fix extra spaces inside parentheses: (  text  ) -> (text)
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    // Fix extra spaces inside square brackets: [  text  ] -> [text]
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    // Fix multiple consecutive spaces
    .replace(/\s{2,}/g, ' ')
    // Fix spaces before punctuation
    .replace(/\s+([,.!?;:])/g, '$1')
    // Trim leading/trailing spaces
    .trim();
}

// Function to detect heading levels in plaintext
const detectHeadingLevel = (text: string): {level: number, cleanText: string} => {
  const trimmed = cleanupTextSpacing(text.trim());
  
  // Handle markdown-style headings with multiple #
  const hashMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
  if (hashMatch) {
    const level = Math.min(hashMatch[1].length, 3); // Cap at level 3
    return {level, cleanText: cleanupTextSpacing(hashMatch[2])};
  }
  
  // Handle **bold** headings - common in AI-generated content
  const boldHeadingMatch = trimmed.match(/^\*\*(.*?)\*\*$/);
  if (boldHeadingMatch) {
    const cleanText = cleanupTextSpacing(boldHeadingMatch[1]);
    // Determine level based on content characteristics
    if (cleanText === cleanText.toUpperCase() && cleanText.length > 3) {
      return {level: 1, cleanText}; // All caps = level 1
    } else if (cleanText.includes('.') && cleanText.length < 80) {
      return {level: 2, cleanText}; // Numbered headings = level 2
    } else {
      return {level: 3, cleanText}; // Others = level 3
    }
  }
  
  // HAUPTÜBERSCHRIFT: All caps text (level 1)
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.includes(':') && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.startsWith('#')) {
    return {level: 1, cleanText: trimmed};
  }
  
  // Unterüberschrift: Ends with colon (level 2)
  if (trimmed.endsWith(':') && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.startsWith('#')) {
    return {level: 2, cleanText: trimmed.replace(/:$/, '')};
  }
  
  // Sub-Unterüberschrift: Detect by context - shorter lines that aren't bullets (level 3)
  if (trimmed.length < 50 && !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.includes('.') && trimmed !== trimmed.toUpperCase() && !trimmed.startsWith('#')) {
    return {level: 3, cleanText: trimmed};
  }
  
  return {level: 0, cleanText: trimmed};
};

// Helper function to extract and process footnotes
function extractFootnotes(text: string): { processedText: string, footnotes: Array<{id: string, content: string}> } {
  const footnotes: Array<{id: string, content: string}> = [];
  const footnoteRefs: Set<string> = new Set();
  
  // First pass: find all footnote references [number] (handle various spacing patterns)
  const refMatches = text.matchAll(/\[\s*(\d+)\s*\]/g);
  for (const match of refMatches) {
    footnoteRefs.add(match[1]);
  }
  
  // Second pass: extract footnote definitions
  let processedText = text;
  const footnotePattern = /\[\s*(\d+)\s*\]:\s*([^\n]*(?:\n(?!\[\s*\d+\s*\])\s*[^\n]*)*)/g;
  
  let match;
  while ((match = footnotePattern.exec(text)) !== null) {
    const footnoteId = match[1];
    const footnoteContent = cleanupTextSpacing(match[2].trim()); // Clean up footnote content
    
    footnotes.push({
      id: footnoteId,
      content: footnoteContent
    });
    
    // Remove the footnote definition from the main text
    processedText = processedText.replace(match[0], '');
  }
  
  // Clean up extra spaces around footnote references in the main text
  processedText = processedText.replace(/\[\s*(\d+)\s*\]/g, '[^$1]');
  
  // Sort footnotes by number
  footnotes.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  
  return { processedText: processedText.trim(), footnotes };
}

// Enhanced text processing function for markdown and footnotes
const processTextWithMarkdownAndFootnotes = (text: string) => {
  const segments: Array<{text: string, isBold: boolean, isItalic: boolean, isFootnoteRef?: boolean, footnoteId?: string}> = [];
  
  // Clean up the input text first
  const cleanText = cleanupTextSpacing(text);
  
  let currentPos = 0;
  let currentText = '';
  let inBold = false;
  
  for (let i = 0; i < cleanText.length; i++) {
    // Check for footnote reference [^number]
    if (cleanText[i] === '[' && i + 1 < cleanText.length && cleanText[i + 1] === '^') {
      const footnoteMatch = cleanText.slice(i).match(/^\[\^(\d+)\]/);
      if (footnoteMatch) {
        // Save current text segment
        if (currentText) {
          segments.push({text: cleanupTextSpacing(currentText), isBold: inBold, isItalic: false});
          currentText = '';
        }
        
        // Add footnote reference segment
        segments.push({
          text: footnoteMatch[1], // Just the number
          isBold: false,
          isItalic: false,
          isFootnoteRef: true,
          footnoteId: footnoteMatch[1]
        });
        
        i += footnoteMatch[0].length - 1; // Skip the footnote reference
        continue;
      }
    }
    
    // Check for **bold** formatting
    if (cleanText[i] === '*' && i + 1 < cleanText.length && cleanText[i + 1] === '*') {
      // Found ** - toggle bold
      if (currentText) {
        segments.push({text: cleanupTextSpacing(currentText), isBold: inBold, isItalic: false});
        currentText = '';
      }
      inBold = !inBold;
      i++; // Skip the second *
    } else if (cleanText[i] === '*' && !inBold) {
      // Single * for italic - start italic
      if (currentText) {
        segments.push({text: cleanupTextSpacing(currentText), isBold: inBold, isItalic: false});
        currentText = '';
      }
      // Look for the closing *
      let closingPos = -1;
      for (let j = i + 1; j < cleanText.length; j++) {
        if (cleanText[j] === '*' && (j + 1 >= cleanText.length || cleanText[j + 1] !== '*')) {
          closingPos = j;
          break;
        }
      }
      if (closingPos !== -1) {
        // Extract italic text
        const italicText = cleanText.substring(i + 1, closingPos);
        segments.push({text: cleanupTextSpacing(italicText), isBold: inBold, isItalic: true});
        i = closingPos; // Skip to after the closing *
      } else {
        currentText += cleanText[i];
      }
    } else {
      currentText += cleanText[i];
    }
  }
  
  // Add remaining text
  if (currentText) {
    segments.push({text: cleanupTextSpacing(currentText), isBold: inBold, isItalic: false});
  }
  
  return segments;
};

// Helper function to add footnotes to a page
function addFootnotesToPage(page: any, footnotes: Array<{id: string, content: string}>, pageWidth: number, marginLeft: number, marginBottom: number, interRegular: any, brandColor: any) {
  if (footnotes.length === 0) return marginBottom;
  
  const footnoteStartY = marginBottom + 40; // Start footnotes 40px above bottom margin
  let currentY = footnoteStartY;
  
  // Draw red separator line
  page.drawLine({
    start: { x: marginLeft, y: currentY },
    end: { x: pageWidth - 50, y: currentY },
    thickness: 1,
    color: brandColor, // Red color
  });
  
  currentY -= 15; // Space below separator
  
  // Add footnotes
  for (const footnote of footnotes) {
    const footnoteText = `${footnote.id}. ${footnote.content}`;
    const fontSize = 10; // 2pt smaller than body text (12pt)
    
    // Wrap footnote text
    const maxWidth = pageWidth - marginLeft - 50;
    const wrappedLines = wrapText(footnoteText, maxWidth, fontSize, interRegular);
    
    for (const line of wrappedLines) {
      page.drawText(line, {
        x: marginLeft,
        y: currentY,
        size: fontSize,
        font: interRegular,
        color: brandColor, // Red color
      });
      currentY -= 12; // Line height for footnotes
    }
    
    currentY -= 5; // Extra space between footnotes
  }
  
  return currentY; // Return the new bottom position
}

export async function POST(request: NextRequest) {
  try {
    const { politicianName, partyAffiliation } = await request.json();
    
    if (!politicianName) {
      return NextResponse.json({ error: 'Politiker Name ist erforderlich' }, { status: 400 });
    }

    console.log('Generating dossier for:', { politicianName, partyAffiliation });

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const userId = session.user.id; // Supabase UUID
    console.log('Dossier Generate: Processing for user:', userId);

    // Verify user exists in Supabase
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !userRecord) {
      console.log('Dossier Generate: User not found:', userId, userError?.message);
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Use Perplexity Sonar Pro API for dossier generation
    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!perplexityApiKey) {
      return NextResponse.json({ error: 'Perplexity API key not configured' }, { status: 500 });
    }

    let dossierContent: string;
    
    try {
      console.log('Calling Perplexity Sonar Pro API...');
      
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "user", 
              content: `Erstelle mir ein Dossier über ${politicianName}${partyAffiliation ? ` ${partyAffiliation}` : ''}.
Ich brauche Kritikpunkte, Skandale, Angriffspunkte und rhetorische Kniffe, um ihn aus Sicht eines linken Abgeordneten in einer Diskussion anzugreifen & zu stellen. Gib mir rhetorische Ideen. Unterteile das Dossier in einzelne Kapitel.`
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!perplexityResponse.ok) {
        const errorText = await perplexityResponse.text();
        console.error('Perplexity API error:', perplexityResponse.status, errorText);
        throw new Error(`Perplexity API error: ${perplexityResponse.status} - ${errorText}`);
      }

      const perplexityData = await perplexityResponse.json();
      console.log('Perplexity response received:', {
        usage: perplexityData.usage,
        contentLength: perplexityData.choices?.[0]?.message?.content?.length || 0
      });

      if (!perplexityData.choices?.[0]?.message?.content) {
        throw new Error('No content received from Perplexity API');
      }

      dossierContent = perplexityData.choices[0].message.content;
      
    } catch (apiError) {
      console.error('Error calling Perplexity API:', apiError);
      return NextResponse.json({ 
        error: 'Fehler bei der AI-Generierung mit Perplexity Sonar Pro',
        details: process.env.NODE_ENV === 'development' ? (apiError instanceof Error ? apiError.message : 'Unknown error') : undefined
      }, { status: 500 });
    }

    console.log(`Dossier content generated (${dossierContent.length} characters)`);
    console.log('Starting PDF creation process...');

    // Create PDF with custom styling
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit to enable custom font embedding
    pdfDoc.registerFontkit(fontkit as any);
    
    // Embed custom fonts from /public/fonts with error handling
    let interRegular, interBold, interItalic, workSansBlack, workSansLight, workSansRegular;
    
    try {
      console.log('Loading custom fonts...');
      
      // Check if font files exist and load them
      const fontPaths = {
        interRegular: path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'),
        interBold: path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'),
        interItalic: path.join(process.cwd(), 'public', 'fonts', 'Inter-Italic.ttf'),
        workSansBlack: path.join(process.cwd(), 'public', 'fonts', 'WorkSans-Black.ttf'),
        workSansLight: path.join(process.cwd(), 'public', 'fonts', 'WorkSans-Light.ttf'),
        workSansRegular: path.join(process.cwd(), 'public', 'fonts', 'WorkSans-Regular.ttf'),
      };
      
      // Load font files and embed them
      for (const [fontName, fontPath] of Object.entries(fontPaths)) {
        if (fs.existsSync(fontPath)) {
          console.log(`Loading font: ${fontName} from ${fontPath}`);
        } else {
          console.error(`Font file not found: ${fontPath}`);
          throw new Error(`Font file not found: ${fontPath}`);
        }
      }
      
      const interRegularBytes = fs.readFileSync(fontPaths.interRegular);
      const interBoldBytes = fs.readFileSync(fontPaths.interBold);
      const interItalicBytes = fs.readFileSync(fontPaths.interItalic);
      const workSansBlackBytes = fs.readFileSync(fontPaths.workSansBlack);
      const workSansLightBytes = fs.readFileSync(fontPaths.workSansLight);
      const workSansRegularBytes = fs.readFileSync(fontPaths.workSansRegular);
      
      interRegular = await pdfDoc.embedFont(interRegularBytes);
      interBold = await pdfDoc.embedFont(interBoldBytes);
      interItalic = await pdfDoc.embedFont(interItalicBytes);
      workSansBlack = await pdfDoc.embedFont(workSansBlackBytes);
      workSansLight = await pdfDoc.embedFont(workSansLightBytes);
      workSansRegular = await pdfDoc.embedFont(workSansRegularBytes);
      
      console.log('Custom fonts loaded successfully');
    } catch (fontError) {
      console.error('Error loading custom fonts:', fontError);
      console.log('Falling back to standard fonts');
      
      // Fallback to standard fonts if custom fonts fail
      interRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      interBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      interItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
      workSansBlack = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      workSansLight = await pdfDoc.embedFont(StandardFonts.Helvetica);
      workSansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    const pageWidth = 595; // A4 width
    const pageHeight = 842; // A4 height
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 50;
    const marginBottom = 100; // Extra space for logo
    const bodyWidth = (pageWidth - marginLeft - marginRight) * 0.7; // 70% width for body text
    
    // Color definitions
    const brandColor = rgb(111/255, 0/255, 60/255); // #6F003C
    const textColor = rgb(0.2, 0.2, 0.2); // Darker text color (was 0.6, 0.6, 0.6)
    const bulletColor = rgb(111/255, 0/255, 60/255); // Red squares for bullets
    
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - marginTop;
    let pageNumber = 1;
    const pages: any[] = [currentPage]; // Track all pages for numbering
    
    // Add logo to first page
    await addLogoToPage(currentPage, pdfDoc, pageWidth, marginRight, marginBottom, brandColor, interBold);
    
    // Header
    const currentDate = new Date().toLocaleDateString('de-DE');
    
    // Add "Nicht zur Veröffentlichung bestimmt" header (centered)
    const confidentialText = "Nicht zur Veröffentlichung bestimmt";
    const confidentialTextWidth = interBold.widthOfTextAtSize(confidentialText, 12);
    const confidentialX = (pageWidth - confidentialTextWidth) / 2;
    
    currentPage.drawText(confidentialText, {
      x: confidentialX,
      y: yPosition,
      size: 12,
      font: interBold,
      color: brandColor,
    });
    yPosition -= 25;
    
    // Add user information header (right-aligned)
    const userName = `${session.user.name || session.user.email || 'Unbekannt'}, MdB`;
    const dateText = `Erstellt am: ${currentDate}`;
    
    // Calculate right-aligned positions
    const userNameWidth = interRegular.widthOfTextAtSize(userName, 10);
    const dateTextWidth = interRegular.widthOfTextAtSize(dateText, 10);
    const userNameX = pageWidth - marginRight - userNameWidth;
    const dateTextX = pageWidth - marginRight - dateTextWidth;
    
    currentPage.drawText(`Erstellt für: ${userName}`, {
      x: userNameX - interRegular.widthOfTextAtSize('Erstellt für: ', 10),
      y: yPosition,
      size: 10,
      font: interRegular,
      color: textColor,
    });
    yPosition -= 15;
    
    currentPage.drawText(dateText, {
      x: dateTextX,
      y: yPosition,
      size: 10,
      font: interRegular,
      color: textColor,
    });
    yPosition -= 40;
    
    // Main title with line break between name and party
    currentPage.drawText(`Dossier: ${politicianName}`, {
      x: marginLeft,
      y: yPosition,
      size: 24,
      font: workSansBlack,
      color: brandColor,
    });
    yPosition -= 30; // Smaller spacing for party line
    
    if (partyAffiliation) {
      currentPage.drawText(`(${partyAffiliation})`, {
        x: marginLeft,
        y: yPosition,
        size: 18, // Slightly smaller for party
        font: workSansLight,
        color: brandColor,
      });
    }
    yPosition -= 60;

    // Process content with enhanced styling and footnote support
    const { processedText, footnotes } = extractFootnotes(dossierContent);
    const paragraphs = processedText.split('\n');
    
    // Store footnotes for each page
    let currentPageFootnotes: Array<{id: string, content: string}> = [];
    
    // Filter out duplicate dossier titles and separators
    const filteredParagraphs = paragraphs.filter(paragraph => {
      const trimmed = paragraph.trim();
      return !(
        (// Remove separator lines
        trimmed.includes(`${politicianName} (`) && trimmed.includes('Dossier') ||
        trimmed.match(/^#+\s*.*Dossier.*$/i) ||
        trimmed === `${politicianName} - Dossier` ||
        trimmed === `Feinddossier: ${politicianName}` ||
        trimmed === '---' || trimmed.match(/^-{3,}$/)) // Remove multiple dashes
      );
    });
    
    console.log(`Processing ${filteredParagraphs.length} paragraphs for PDF generation...`);
    console.log(`Found ${footnotes.length} footnotes to process`);
    
    for (const paragraph of filteredParagraphs) {
      if (!paragraph.trim()) {
        // Empty line - add spacing
        yPosition -= 15;
        continue;
      }
      
      let currentFont = interRegular; // Body text uses Inter Regular
      let currentFontSize = 12; // Body text: 12pt
      let currentLineHeight = 18; // 150% of 12pt
      let currentColor = textColor;
      let textToRender = cleanupTextSpacing(paragraph.trim()); // Clean up spacing before processing
      let textWidth = bodyWidth; // 70% width for body text
      
      // Detect heading level using plaintext structure
      const headingInfo = detectHeadingLevel(textToRender);
      
      if (headingInfo.level === 1) {
        // HAUPTÜBERSCHRIFT: Work Sans Black, #6F003C
        textToRender = headingInfo.cleanText;
        currentFont = workSansBlack;
        currentFontSize = 20;
        currentLineHeight = 22;
        currentColor = brandColor;
        textWidth = pageWidth - marginLeft - marginRight; // Full width for headings
        yPosition -= 15; // Extra spacing before H1
      } else if (headingInfo.level === 2) {
        // Unterüberschrift: Work Sans Light, #6F003C
        textToRender = headingInfo.cleanText;
        currentFont = workSansLight;
        currentFontSize = 18;
        currentLineHeight = 20;
        currentColor = brandColor;
        textWidth = pageWidth - marginLeft - marginRight; // Full width for headings
        yPosition -= 12; // Extra spacing before H2
      } else if (headingInfo.level === 3) {
        // Sub-Unterüberschrift: Work Sans Black, #6F003C
        textToRender = headingInfo.cleanText;
        currentFont = workSansBlack;
        currentFontSize = 14;
        currentLineHeight = 16;
        currentColor = brandColor;
        textWidth = pageWidth - marginLeft - marginRight; // Full width for headings
        yPosition -= 8; // Extra spacing before H3
      } else if (textToRender.startsWith('- ') || textToRender.startsWith('* ') || 
                 textToRender.match(/^[\u2022\u2023\u25E6\u2043\u2219]\s/) || // Unicode bullets
                 textToRender.match(/^[•·▪▫]\s/)) { // Common bullet characters
        // Bullet points with red squares
        textToRender = textToRender.replace(/^[-*\u2022\u2023\u25E6\u2043\u2219•·▪▫]\s*/, '');
        currentFontSize = 12; // Body text size
        currentLineHeight = 18; // 150% line height
        currentFont = interRegular;
        currentColor = textColor;
        
        // Check for important markers
        if (textToRender.toUpperCase().startsWith('WICHTIG:') || textToRender === textToRender.toUpperCase()) {
          currentFont = interBold;
        }
        
        // Process bullet text with footnotes
        const segments = processTextWithMarkdownAndFootnotes(textToRender);
        
        // Draw red square bullet
        const bulletSize = 4;
        currentPage.drawRectangle({
          x: marginLeft + 5,
          y: yPosition - bulletSize,
          width: bulletSize,
          height: bulletSize,
          color: bulletColor,
        });
        
        // Indent text after bullet
        const bulletIndent = 15;
        let xOffset = marginLeft + bulletIndent;
        let lineStartX = marginLeft + bulletIndent;
        let currentLineWidth = 0;
        const maxLineWidth = textWidth - bulletIndent;
        
        for (const segment of segments) {
          let font = currentFont;
          let color = currentColor;
          let size = currentFontSize;
          
          if (segment.isBold) {
            font = interBold;
          }
          if (segment.isItalic) {
            font = interItalic;
          }
          
          if (segment.isFootnoteRef && segment.footnoteId) {
            // Handle footnote reference
            const footnoteRef = `${segment.footnoteId}`;
            const refWidth = interRegular.widthOfTextAtSize(footnoteRef, 8);
            
            // Check if we need a new page
            if (yPosition < marginBottom + currentLineHeight) {
              // Add footnotes to current page before creating new page
              addFootnotesToPage(currentPage, currentPageFootnotes, pageWidth, marginLeft, marginBottom, interRegular, brandColor);
              currentPageFootnotes = [];
              
              currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
              pageNumber++;
              pages.push(currentPage);
              await addLogoToPage(currentPage, pdfDoc, pageWidth, marginRight, marginBottom, brandColor, interBold);
              yPosition = pageHeight - marginTop;
              xOffset = lineStartX;
              currentLineWidth = 0;
            }
            
            // Check if footnote reference fits on current line
            if (currentLineWidth + refWidth > maxLineWidth) {
              // Move to next line
              yPosition -= currentLineHeight;
              xOffset = lineStartX;
              currentLineWidth = 0;
            }
            
            // Draw footnote reference as superscript
            currentPage.drawText(footnoteRef, {
              x: xOffset,
              y: yPosition + 4, // Slightly raised
              size: 8, // Smaller size for footnote reference
              font: interRegular,
              color: brandColor, // Red color for footnote refs
            });
            
            xOffset += refWidth + 2;
            currentLineWidth += refWidth + 2;
            
            // Add footnote to current page footnotes if not already added
            const footnoteContent = footnotes.find(f => f.id === segment.footnoteId);
            if (footnoteContent && !currentPageFootnotes.find(f => f.id === segment.footnoteId)) {
              currentPageFootnotes.push(footnoteContent);
            }
          } else {
            // Regular text segment - wrap properly
            const words = segment.text.split(' ');
            
            for (const word of words) {
              if (!word) continue;
              
              const wordWidth = font.widthOfTextAtSize(word + ' ', size);
              
              // Check if word fits on current line
              if (currentLineWidth + wordWidth > maxLineWidth && currentLineWidth > 0) {
                // Move to next line
                yPosition -= currentLineHeight;
                xOffset = lineStartX;
                currentLineWidth = 0;
                
                // Check if we need a new page
                if (yPosition < marginBottom + currentLineHeight) {
                  // Add footnotes to current page before creating new page
                  addFootnotesToPage(currentPage, currentPageFootnotes, pageWidth, marginLeft, marginBottom, interRegular, brandColor);
                  currentPageFootnotes = [];
                  
                  currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                  pageNumber++;
                  pages.push(currentPage);
                  await addLogoToPage(currentPage, pdfDoc, pageWidth, marginRight, marginBottom, brandColor, interBold);
                  yPosition = pageHeight - marginTop;
                  xOffset = lineStartX;
                  currentLineWidth = 0;
                }
              }
              
              // Draw the word
              currentPage.drawText(word + ' ', {
                x: xOffset,
                y: yPosition,
                size: size,
                font: font,
                color: color,
              });
              
              xOffset += wordWidth;
              currentLineWidth += wordWidth;
            }
          }
        }
        continue; // Skip the regular text processing below
      } else if (/^\d+\.\s/.test(textToRender)) {
        // Numbered lists - keep as-is with body text styling
        currentFontSize = 12;
        currentLineHeight = 18;
      } else {
        // Regular body text
        currentFontSize = 12;
        currentLineHeight = 18; // 150% line height
        currentFont = interRegular;
        currentColor = textColor;
        
        // Check for important markers in body text
        if (textToRender.toUpperCase().startsWith('WICHTIG:') || textToRender === textToRender.toUpperCase()) {
          currentFont = interBold;
        }
      }
      
      // Process text with inline formatting and footnotes for non-bullet text
      if (headingInfo.level === 0) {
        // Regular text with potential **bold** formatting and footnotes
        const segments = processTextWithMarkdownAndFootnotes(textToRender);
        
        let xOffset = marginLeft;
        let lineStartX = marginLeft;
        let currentLineWidth = 0;
        const maxLineWidth = textWidth;
        
        for (const segment of segments) {
          let font = interRegular;
          let color = currentColor;
          let size = currentFontSize;
          
          if (segment.isBold) {
            font = interBold;
          }
          if (segment.isItalic) {
            font = interItalic;
          }
          
          if (segment.isFootnoteRef && segment.footnoteId) {
            // Handle footnote reference
            const footnoteRef = `[${segment.footnoteId}]`;
            const refWidth = interRegular.widthOfTextAtSize(footnoteRef, 8);
            
            // Check if we need a new page
            if (yPosition < marginBottom + currentLineHeight) {
              // Add footnotes to current page before creating new page
              addFootnotesToPage(currentPage, currentPageFootnotes, pageWidth, marginLeft, marginBottom, interRegular, brandColor);
              currentPageFootnotes = [];
              
              currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
              pageNumber++;
              pages.push(currentPage);
              await addLogoToPage(currentPage, pdfDoc, pageWidth, marginRight, marginBottom, brandColor, interBold);
              yPosition = pageHeight - marginTop;
              xOffset = marginLeft;
              lineStartX = marginLeft;
              currentLineWidth = 0;
            }
            
            // Check if footnote reference fits on current line
            if (currentLineWidth + refWidth > maxLineWidth) {
              // Move to next line
              yPosition -= currentLineHeight;
              xOffset = lineStartX;
              currentLineWidth = 0;
            }
            
            // Draw footnote reference as superscript
            currentPage.drawText(footnoteRef, {
              x: xOffset,
              y: yPosition + 4, // Slightly raised
              size: 8, // Smaller size for footnote reference
              font: interRegular,
              color: brandColor, // Red color for footnote refs
            });
            
            xOffset += refWidth + 2;
            currentLineWidth += refWidth + 2;
            
            // Add footnote to current page footnotes if not already added
            const footnoteContent = footnotes.find(f => f.id === segment.footnoteId);
            if (footnoteContent && !currentPageFootnotes.find(f => f.id === segment.footnoteId)) {
              currentPageFootnotes.push(footnoteContent);
            }
          } else {
            // Regular text segment - wrap properly
            const words = segment.text.split(' ');
            
            for (const word of words) {
              if (!word) continue;
              
              const wordWidth = font.widthOfTextAtSize(word + ' ', size);
              
              // Check if word fits on current line
              if (currentLineWidth + wordWidth > maxLineWidth && currentLineWidth > 0) {
                // Move to next line
                yPosition -= currentLineHeight;
                xOffset = lineStartX;
                currentLineWidth = 0;
                
                // Check if we need a new page
                if (yPosition < marginBottom + currentLineHeight) {
                  // Add footnotes to current page before creating new page
                  addFootnotesToPage(currentPage, currentPageFootnotes, pageWidth, marginLeft, marginBottom, interRegular, brandColor);
                  currentPageFootnotes = [];
                  
                  currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
                  pageNumber++;
                  pages.push(currentPage);
                  await addLogoToPage(currentPage, pdfDoc, pageWidth, marginRight, marginBottom, brandColor, interBold);
                  yPosition = pageHeight - marginTop;
                  xOffset = marginLeft;
                  lineStartX = marginLeft;
                  currentLineWidth = 0;
                }
              }
              
              // Draw the word
              currentPage.drawText(word + ' ', {
                x: xOffset,
                y: yPosition,
                size: size,
                font: font,
                color: color,
              });
              
              xOffset += wordWidth;
              currentLineWidth += wordWidth;
            }
          }
        }
        
        // Move to next line after processing all segments
        yPosition -= currentLineHeight;
      } else {
        // Process as simple text for headings (no footnotes in headings)
        const wrappedLines = wrapText(textToRender, textWidth, currentFontSize, currentFont);
        
        for (const line of wrappedLines) {
          // Check if we need a new page
          if (yPosition < marginBottom + currentLineHeight) {
            // Add footnotes to current page before creating new page
            addFootnotesToPage(currentPage, currentPageFootnotes, pageWidth, marginLeft, marginBottom, interRegular, brandColor);
            currentPageFootnotes = [];
            
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            pageNumber++;
            pages.push(currentPage);
            await addLogoToPage(currentPage, pdfDoc, pageWidth, marginRight, marginBottom, brandColor, interBold);
            yPosition = pageHeight - marginTop;
          }
          
          currentPage.drawText(line, {
            x: marginLeft,
            y: yPosition,
            size: currentFontSize,
            font: currentFont,
            color: currentColor,
          });
          
          yPosition -= currentLineHeight;
        }
      }
      
      // Add extra spacing after headings
      if (headingInfo.level > 0) {
        yPosition -= 8;
      }
    }
    
    // Add any remaining footnotes to the last page
    if (currentPageFootnotes.length > 0) {
      addFootnotesToPage(currentPage, currentPageFootnotes, pageWidth, marginLeft, marginBottom, interRegular, brandColor);
    }

    // Add page numbers to all pages
    const totalPages = pages.length;
    for (let i = 0; i < totalPages; i++) {
      await addPageNumber(pages[i], i + 1, totalPages, pageWidth, marginBottom, interRegular, textColor);
    }

    console.log('Saving PDF document...');
    let pdfBytes;
    try {
      pdfBytes = await pdfDoc.save();
      console.log(`PDF generated successfully, size: ${pdfBytes.length} bytes`);
    } catch (pdfSaveError) {
      console.error('Error saving PDF:', pdfSaveError);
      const errorMessage = pdfSaveError instanceof Error ? pdfSaveError.message : 'Unknown PDF save error';
      throw new Error(`PDF save failed: ${errorMessage}`);
    }

    // Save to Supabase with proper error handling
    try {
      await supabase
        .from('feinddossier')
        .insert([
          {
            user_id: userId,
            gegner: politicianName,
            notes: dossierContent,
          }
        ]);
      console.log('Successfully saved dossier record to Supabase');
    } catch (supabaseError) {
      console.error('Failed to save to Supabase:', supabaseError);
      // Continue even if Supabase save fails - don't block PDF generation
    }

    return NextResponse.json({
      success: true,
      pdfData: Buffer.from(pdfBytes).toString('base64'),
      filename: `${politicianName.replace(/[^a-zA-Z0-9]/g, '_')}_Dossier_${currentDate.replace(/\./g, '-')}.pdf`,
      message: 'Dossier erfolgreich erstellt'
    });

  } catch (error) {
    console.error('Error generating dossier:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('OpenAI') || error.message.includes('API')) {
        return NextResponse.json({ 
          error: 'Fehler bei der AI-Generierung. Bitte versuchen Sie es später erneut.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
      }
      if (error.message.includes('PDF') || error.message.includes('pdf')) {
        return NextResponse.json({ 
          error: 'Fehler bei der PDF-Erstellung. Bitte versuchen Sie es erneut.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
      }
      if (error.message.includes('Font') || error.message.includes('font')) {
        return NextResponse.json({ 
          error: 'Fehler beim Laden der Schriftarten. Bitte versuchen Sie es erneut.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
      }
      if (error.message.includes('Supabase')) {
        // Don't fail the whole request for Supabase issues, just log it
        console.warn('Supabase error (non-blocking):', error.message);
      }
    }
    
    return NextResponse.json({ 
      error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    }, { status: 500 });
  }
} 
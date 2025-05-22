import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { base } from '@/lib/airtable';
import { openai } from '@/lib/openai';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to add logo to page
async function addLogoToPage(page: any, pdfDoc: any, pageWidth: number, marginRight: number, marginBottom: number, brandColor: any, interBold: any) {
  try {
    // Note: You'd need to convert SVG to PNG first, or use a PNG version
    // const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    // if (fs.existsSync(logoPath)) {
    //   const logoBytes = fs.readFileSync(logoPath);
    //   const logoImage = await pdfDoc.embedPng(logoBytes);
    //   const logoMaxWidth = pageWidth * 0.2; // 20% of page width
    //   const logoDims = logoImage.scale(logoMaxWidth / logoImage.width);
    //   
    //   page.drawImage(logoImage, {
    //     x: pageWidth - marginRight - logoDims.width,
    //     y: marginBottom - logoDims.height,
    //     width: logoDims.width,
    //     height: logoDims.height,
    //   });
    // }
    
    // Placeholder for logo - draw brand-colored rectangle for now
    page.drawRectangle({
      x: pageWidth - marginRight - (pageWidth * 0.15),
      y: marginBottom - 30,
      width: pageWidth * 0.15,
      height: 25,
      color: brandColor,
    });
    page.drawText('LOGO', {
      x: pageWidth - marginRight - (pageWidth * 0.12),
      y: marginBottom - 22,
      size: 10,
      font: interBold,
      color: rgb(1, 1, 1),
    });
  } catch (error) {
    console.log('Could not add logo:', error);
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

// Helper function to process Markdown-like formatting
function processMarkdownLine(line: string): { text: string; isBold: boolean; isItalic: boolean } {
  let text = line;
  let isBold = false;
  let isItalic = false;

  // Handle bold text (**text** or __text__)
  if (text.includes('**') || text.includes('__')) {
    text = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1');
    isBold = true;
  }

  // Handle italic text (*text* or _text_)
  if (text.includes('*') || text.includes('_')) {
    text = text.replace(/\*(.*?)\*/g, '$1').replace(/_(.*?)_/g, '$1');
    isItalic = true;
  }

  return { text, isBold, isItalic };
}

export async function POST(request: NextRequest) {
  try {
    const { politicianName } = await request.json();
    
    if (!politicianName) {
      return NextResponse.json({ error: 'Politiker Name ist erforderlich' }, { status: 400 });
    }

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Get user's Airtable record ID
    const userRecords = await base('Users')
      .select({ filterByFormula: `{UserID} = '${session.user.id}'`, maxRecords: 1 })
      .firstPage();
    
    if (userRecords.length === 0) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }
    
    const userAirtableId = userRecords[0].id;

    // Get OpenAI assistant ID from environment variables or use chat completions
    const assistantId = process.env.OPENAI_FEINDDOSSIER_ASSISTANT_ID;
    
    let dossierContent: string;
    
    if (assistantId) {
      // Use Assistants API if assistant ID is configured
      const thread = await openai.beta.threads.create();
      
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Erstelle ein detailliertes Feinddossier für ${politicianName}. 

Bitte strukturiere deine Antwort in Markdown-Format mit:
- Hauptüberschriften mit # (z.B. # Politische Positionen)
- Unterüberschriften mit ## (z.B. ## Kontroversen)
- Sub-Unterüberschriften mit ### wenn nötig
- Aufzählungszeichen mit - oder *
- **Fettdruck** für wichtige Punkte

Analysiere folgende Bereiche:
- Politische Positionen und Abstimmungsverhalten
- Kontroversen und Schwachstellen  
- Mögliche Angriffspunkte für politische Gegner
- Hintergrundinformationen und Karriere-Highlights

Verwende konkrete Beispiele und strukturiere alles übersichtlich.`
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistantId
      });

      let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      let attempts = 0;
      const maxAttempts = 60;
      
      while ((runStatus.status === 'in_progress' || runStatus.status === 'queued') && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        attempts++;
      }

      if (runStatus.status !== 'completed') {
        console.error('OpenAI run failed:', runStatus.status, runStatus.last_error);
        return NextResponse.json({ error: `Dossier-Generierung fehlgeschlagen: ${runStatus.status}` }, { status: 500 });
      }

      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      
      if (!assistantMessage || !assistantMessage.content[0]) {
        return NextResponse.json({ error: 'Keine Antwort vom AI-Assistenten erhalten' }, { status: 500 });
      }

      // Handle both text and JSON response formats
      const messageContent = assistantMessage.content[0];
      if (messageContent.type === 'text') {
        dossierContent = messageContent.text.value;
      } else {
        console.error('Unexpected message content type:', messageContent.type);
        return NextResponse.json({ error: 'Unerwartetes Antwortformat vom AI-Assistenten' }, { status: 500 });
      }

      // If the content looks like JSON, try to extract the actual dossier content
      try {
        const possibleJson = JSON.parse(dossierContent);
        // Look for common JSON field names that might contain the dossier
        if (possibleJson.dossier) {
          dossierContent = possibleJson.dossier;
        } else if (possibleJson.content) {
          dossierContent = possibleJson.content;
        } else if (possibleJson.text) {
          dossierContent = possibleJson.text;
        } else if (possibleJson.analysis) {
          dossierContent = possibleJson.analysis;
        } else {
          // If it's a complex JSON object, try to stringify it nicely
          dossierContent = Object.values(possibleJson).join('\n\n');
        }
      } catch (jsonError) {
        // Not JSON, use as-is (which is fine for text responses)
        console.log('Content is not JSON, using as text');
      }

    } else {
      // Use Chat Completions API as fallback
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: `Erstelle ein detailliertes Feinddossier für ${politicianName}.`
          }
        ],
        max_tokens: 3000,
        temperature: 0.7
      });

      if (!completion.choices[0]?.message?.content) {
        return NextResponse.json({ error: 'Keine Antwort vom AI-System erhalten' }, { status: 500 });
      }

      dossierContent = completion.choices[0].message.content;
    }

    // Create PDF with custom styling
    const pdfDoc = await PDFDocument.create();
    
    // Embed custom fonts from /public/fonts
    const interRegularBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'));
    const interBoldBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'));
    const interItalicBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Inter-Italic.ttf'));
    const workSansBlackBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'WorkSans-Black.ttf'));
    const workSansLightBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'WorkSans-Light.ttf'));
    const workSansRegularBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'WorkSans-Regular.ttf'));
    
    const interRegular = await pdfDoc.embedFont(interRegularBytes);
    const interBold = await pdfDoc.embedFont(interBoldBytes);
    const interItalic = await pdfDoc.embedFont(interItalicBytes);
    const workSansBlack = await pdfDoc.embedFont(workSansBlackBytes);
    const workSansLight = await pdfDoc.embedFont(workSansLightBytes);
    const workSansRegular = await pdfDoc.embedFont(workSansRegularBytes);
    
    const pageWidth = 595; // A4 width
    const pageHeight = 842; // A4 height
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 50;
    const marginBottom = 100; // Extra space for logo
    const bodyWidth = (pageWidth - marginLeft - marginRight) * 0.7; // 70% width for body text
    
    // Color definitions
    const brandColor = rgb(111/255, 0/255, 60/255); // #6F003C
    const textColor = rgb(0.1, 0.1, 0.1); // 90% black
    const bulletColor = rgb(111/255, 0/255, 60/255); // Red squares for bullets
    
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - marginTop;
    
    // Add logo to first page
    await addLogoToPage(currentPage, pdfDoc, pageWidth, marginRight, marginBottom, brandColor, interBold);
    
    // Header
    const currentDate = new Date().toLocaleDateString('de-DE');
    // Note: Using largest available font size as fallback for 200pt
    currentPage.drawText(`Feinddossier: ${politicianName}`, {
      x: marginLeft,
      y: yPosition,
      size: 24, // Fallback for 200pt Work Sans Black
      font: workSansBlack,
      color: brandColor,
    });
    yPosition -= 35; // ~105% line height equivalent
    
    currentPage.drawText(`Erstellt am: ${currentDate}`, {
      x: marginLeft,
      y: yPosition,
      size: 10,
      font: interRegular,
      color: textColor,
    });
    yPosition -= 50;

    // Process content with enhanced styling
    const paragraphs = dossierContent.split('\n');
    
    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        // Empty line - add spacing
        yPosition -= 15;
        continue;
      }
      
      let currentFont = interRegular; // Body text uses Inter Regular
      let currentFontSize = 12; // Body text: 12pt
      let currentLineHeight = 18; // 150% of 12pt
      let currentColor = textColor;
      let textToRender = paragraph.trim();
      let textWidth = bodyWidth; // 70% width for body text
      
      // Handle different heading levels with custom styling
      if (textToRender.startsWith('# ')) {
        // H1: Work Sans Black 200pt equivalent, #6F003C
        textToRender = textToRender.replace(/^#\s*/, '');
        currentFont = workSansBlack;
        currentFontSize = 20; // Scaled down from 200pt for readability
        currentLineHeight = 22; // ~105% line height
        currentColor = brandColor;
        textWidth = pageWidth - marginLeft - marginRight; // Full width for headings
        yPosition -= 15; // Extra spacing before H1
      } else if (textToRender.startsWith('## ')) {
        // H2: Work Sans Light 200pt equivalent, #6F003C
        textToRender = textToRender.replace(/^##\s*/, '');
        currentFont = workSansLight; // Using regular as fallback for light
        currentFontSize = 18; // Scaled down from 200pt
        currentLineHeight = 20; // ~105% line height
        currentColor = brandColor;
        textWidth = pageWidth - marginLeft - marginRight; // Full width for headings
        yPosition -= 12; // Extra spacing before H2
      } else if (textToRender.startsWith('### ')) {
        // Subheadline 1: Work Sans Black 80pt equivalent, #6F003C
        textToRender = textToRender.replace(/^###\s*/, '');
        currentFont = workSansBlack;
        currentFontSize = 14; // Scaled down from 80pt
        currentLineHeight = 16; // ~110% line height
        currentColor = brandColor;
        textWidth = pageWidth - marginLeft - marginRight; // Full width for headings
        yPosition -= 8; // Extra spacing before H3
      } else if (textToRender.startsWith('#### ')) {
        // Subheadline 2: Work Sans Light 80pt equivalent, #6F003C
        textToRender = textToRender.replace(/^####\s*/, '');
        currentFont = workSansLight;
        currentFontSize = 13; // Scaled down from 80pt
        currentLineHeight = 15; // ~110% line height
        currentColor = brandColor;
        textWidth = pageWidth - marginLeft - marginRight; // Full width for headings
        yPosition -= 6; // Extra spacing before H4
      } else if (textToRender.startsWith('- ') || textToRender.startsWith('* ')) {
        // Bullet points with red squares
        textToRender = textToRender.replace(/^[-*]\s*/, '');
        currentFontSize = 12; // Body text size
        currentLineHeight = 18; // 150% line height
        
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
        const wrappedLines = wrapText(textToRender, textWidth - bulletIndent, currentFontSize, currentFont);
        
        for (let i = 0; i < wrappedLines.length; i++) {
          const line = wrappedLines[i];
          
          // Check if we need a new page
          if (yPosition < marginBottom + currentLineHeight) {
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            await addLogoToPage(currentPage, pdfDoc, pageWidth, marginRight, marginBottom, brandColor, interBold);
            yPosition = pageHeight - marginTop;
          }
          
          currentPage.drawText(line, {
            x: marginLeft + bulletIndent,
            y: yPosition,
            size: currentFontSize,
            font: currentFont,
            color: currentColor,
          });
          
          yPosition -= currentLineHeight;
        }
        continue; // Skip the regular text processing below
        
      } else if (/^\d+\.\s/.test(textToRender)) {
        // Numbered lists - keep as-is with body text styling
        currentFontSize = 12;
        currentLineHeight = 18;
      } else {
        // Regular body text - check for bold/italic
        const processed = processMarkdownLine(textToRender);
        textToRender = processed.text;
        if (processed.isBold && processed.isItalic) {
          // For now, bold takes precedence since we don't have bold-italic
          currentFont = interBold;
        } else if (processed.isBold) {
          currentFont = interBold; // Use Inter Bold for body text
        } else if (processed.isItalic) {
          currentFont = interItalic; // Use Inter Italic for body text
        }
        // Body text: Inter Regular 12pt, 120-150% line height, 90% black
        currentFontSize = 12;
        currentLineHeight = 18; // 150% line height
      }
      
      const wrappedLines = wrapText(textToRender, textWidth, currentFontSize, currentFont);
      
      for (const line of wrappedLines) {
        // Check if we need a new page
        if (yPosition < marginBottom + currentLineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
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
      
      // Add extra spacing after headings
      if (textToRender !== paragraph.trim() || paragraph.startsWith('#')) {
        yPosition -= 8;
      }
    }

    const pdfBytes = await pdfDoc.save();

    // Save to Airtable with proper error handling
    try {
      await base('Feinddossier').create([
        {
          fields: {
            'User-ID': [userAirtableId],
            'Gegner': politicianName,
            'Date': new Date().toISOString().split('T')[0],
            'Status': 'Generated',
            'Content': dossierContent.substring(0, 1000) // Store first 1000 chars as preview
          },
        },
      ]);
      console.log('Successfully saved dossier record to Airtable');
    } catch (airtableError) {
      console.error('Failed to save to Airtable:', airtableError);
      // Continue even if Airtable save fails - don't block PDF generation
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
      if (error.message.includes('OpenAI')) {
        return NextResponse.json({ error: 'Fehler bei der AI-Generierung. Bitte versuchen Sie es später erneut.' }, { status: 500 });
      }
      if (error.message.includes('PDF')) {
        return NextResponse.json({ error: 'Fehler bei der PDF-Erstellung. Bitte versuchen Sie es erneut.' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' }, { status: 500 });
  }
} 
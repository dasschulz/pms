import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

async function searchWikipediaPage(name: string): Promise<{ title: string; pageId: string } | null> {
  try {
    const searchUrl = `https://de.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(name)}&limit=1&namespace=0&format=json`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      console.error('Wikipedia search API error:', searchResponse.status, await searchResponse.text());
      return null;
    }
    const searchData = await searchResponse.json();
    if (!searchData || !searchData[1] || searchData[1].length === 0 || !searchData[3] || searchData[3].length === 0) {
      console.log('No Wikipedia page found for:', name);
      return null;
    }
    
    // Extract page ID from URL
    const pageUrl = searchData[3][0];
    const pageIdMatch = pageUrl.match(/wiki\/([^\/]+)$/);
    const pageId = pageIdMatch ? pageIdMatch[1] : null;
    
    return { 
      title: searchData[1][0], // The title of the first search result
      pageId: pageId // The page ID extracted from URL
    };
  } catch (error) {
    console.error('Error searching Wikipedia page:', error);
    return null;
  }
}

// Add function to fetch image from Wikipedia
async function fetchWikipediaImage(pageTitle: string): Promise<{ imageUrl: string; attribution: string } | null> {
  try {
    // First get the page info to get the image name
    const infoUrl = `https://de.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=400&format=json`;
    const infoResponse = await fetch(infoUrl);
    if (!infoResponse.ok) {
      console.error('Wikipedia info API error:', infoResponse.status, await infoResponse.text());
      return null;
    }
    
    const infoData = await infoResponse.json();
    const pages = infoData.query?.pages;
    if (!pages) return null;
    
    // Get the first page ID (there should only be one)
    const pageId = Object.keys(pages)[0];
    if (!pageId || pageId === '-1') return null;
    
    const page = pages[pageId];
    if (!page.thumbnail || !page.thumbnail.source) return null;
    
    // Get image info for attribution
    const imageName = page.pageimage;
    if (!imageName) return null;
    
    const imageInfoUrl = `https://de.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(imageName)}&prop=imageinfo&iiprop=user|extmetadata&format=json`;
    const imageInfoResponse = await fetch(imageInfoUrl);
    if (!imageInfoResponse.ok) return { imageUrl: page.thumbnail.source, attribution: 'Wikimedia Commons' };
    
    const imageInfoData = await imageInfoResponse.json();
    const imagePages = imageInfoData.query?.pages;
    if (!imagePages) return { imageUrl: page.thumbnail.source, attribution: 'Wikimedia Commons' };
    
    const imagePageId = Object.keys(imagePages)[0];
    if (!imagePageId) return { imageUrl: page.thumbnail.source, attribution: 'Wikimedia Commons' };
    
    const imagePage = imagePages[imagePageId];
    const imageInfo = imagePage.imageinfo?.[0];
    
    let attribution = 'Wikimedia Commons';
    if (imageInfo) {
      const user = imageInfo.user;
      const license = imageInfo.extmetadata?.LicenseShortName?.value || '';
      attribution = `© ${user || 'Unbekannt'}, ${license}, Wikimedia Commons`;
    }
    
    return {
      imageUrl: page.thumbnail.source,
      attribution
    };
  } catch (error) {
    console.error('Error fetching Wikipedia image:', error);
    return null;
  }
}

// Add a helper function to escape CSS selectors
function escapeCSSSelector(selector: string): string {
  return selector.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
}

// Fix the citation reference parsing to extract external URLs
function cleanupWikipediaHtml(html: string, pageTitle: string): string {
  if (!html) return '';
  
  const $ = cheerio.load(html);
  
  // 1. Remove "[Bearbeiten | Quelltext bearbeiten]" text
  $('.mw-editsection').remove();
  
  // 2. Add more spacing between paragraphs and subheadings
  $('p').css('margin-bottom', '1.5em');
  $('h2, h3, h4, h5').css('margin-top', '1.5em').css('margin-bottom', '0.75em');
  
  // 3. NEW APPROACH: Extract reference data first to build a citation map
  const citationMap = new Map<string, string>();
  
  // Look for citation elements and extract their targets
  const refList = $('.references li');
  refList.each((i, el) => {
    try {
      const $el = $(el);
      const id = $el.attr('id');
      
      if (id && id.startsWith('cite_note-')) {
        // Get the reference number from the ID
        const refNum = id.replace('cite_note-', '').split('-')[0]; // Handle complex IDs
        
        // Look for external links in this citation
        const externalLinks = $el.find('a.external');
        if (externalLinks.length > 0) {
          // Use the first external link as the citation target
          const targetUrl = externalLinks.first().attr('href');
          if (targetUrl) {
            citationMap.set(refNum, targetUrl);
            console.log(`[Citation] Mapped citation ${refNum} to external URL: ${targetUrl}`);
          }
        }
      }
    } catch (e) {
      console.error('Error extracting citation data:', e);
    }
  });
  
  // 4. Now update the citation references in the text to point to the external URLs
  $('sup.reference a').each((i, el) => {
    try {
      const $el = $(el);
      const href = $el.attr('href') || '';
      
      if (href.startsWith('#cite_note-')) {
        // Extract reference number from the href
        const refNum = href.replace('#cite_note-', '').split('-')[0]; // Handle complex IDs
        
        // Check if we have an external URL for this citation
        if (citationMap.has(refNum)) {
          const externalUrl = citationMap.get(refNum);
          // Make sure externalUrl is not undefined before using it
          if (externalUrl) {
            // Update the link to point directly to the external source
            $el.attr('href', externalUrl);
            $el.attr('target', '_blank');
            $el.attr('rel', 'noopener noreferrer');
            $el.attr('title', 'Direkt zur Quelle');
            $el.addClass('text-blue-500 hover:underline');
          }
        } else {
          // Fallback to Wikipedia if no external URL found
          const wikiUrl = `https://de.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}${href}`;
          $el.attr('href', wikiUrl);
          $el.attr('target', '_blank');
          $el.attr('rel', 'noopener noreferrer');
          $el.addClass('text-blue-500 hover:underline');
        }
      }
    } catch (e) {
      console.error('Error processing citation reference:', e);
    }
  });
  
  // 5. REMOVE ALL IMAGES - important requirement
  $('img, figure, .image, .thumb, .thumbinner').remove();
  
  // 6. More aggressively remove citation sections at the end
  // First, remove ol.references elements completely
  $('ol.references').remove();
  
  // Remove specific citation sections by their IDs and titles
  $('#Einzelnachweise, #Literatur, #Weblinks, #Anmerkungen, #Quellen, #Einzelbelege, #Anmerkungen_und_Einzelnachweise').each((i, el) => {
    // Remove the heading
    $(el).remove();
    
    // Find the next element - could be a div containing refs or a direct ol
    let nextEl = $(el).next();
    while (nextEl.length && !nextEl.is('h2')) {
      const $temp = nextEl.next();
      nextEl.remove();
      nextEl = $temp;
    }
  });
  
  // Also look for citation headings without IDs
  $('h2, h3').each((i, el) => {
    const headingText = $(el).text().toLowerCase().trim();
    if (
      headingText.includes('einzelnachweise') || 
      headingText.includes('literatur') || 
      headingText.includes('weblinks') || 
      headingText.includes('quellen') || 
      headingText.includes('references') ||
      headingText.includes('anmerkungen') ||
      headingText.includes('belege')
    ) {
      // Simple approach: Remove this heading and its siblings until the next h2 or h3
      $(el).nextUntil('h2, h3').remove();
      $(el).remove();
    }
  });
  
  // 7. Remove duplicate headings - this happens when we fetch both a section and its parent
  const seenHeadings = new Set<string>();
  $('h2, h3, h4, h5').each((i, el) => {
    const headingText = $(el).text().trim();
    if (seenHeadings.has(headingText)) {
      $(el).remove(); // Remove duplicate heading
    } else {
      seenHeadings.add(headingText);
    }
  });
  
  // 8. Additional cleanup
  // Remove navigation elements, tables, boxes that are not needed
  $('.navbox, .vertical-navbox, .sidebar, .infobox, .box-More_citations_needed, .ambox').remove();
  
  return $.html();
}

// Modify the fetchSectionWithSubsections function to prevent duplicate headers
async function fetchSectionWithSubsections(pageTitle: string, sectionIndex: number, sectionTitle: string): Promise<string | null> {
  try {
    console.log(`Fetching section ${sectionIndex} (${sectionTitle}) with subsections for ${pageTitle}`);
    const sectionUrl = `https://de.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${sectionIndex}&prop=text&format=json`;
    
    const sectionResponse = await fetch(sectionUrl);
    if (!sectionResponse.ok) {
      console.error(`Error fetching section ${sectionIndex}:`, sectionResponse.status);
      return null;
    }
    
    const sectionData = await sectionResponse.json();
    if (!sectionData.parse?.text?.['*']) {
      console.error(`No content found for section ${sectionIndex}`);
      return null;
    }
    
    console.log(`Successfully fetched content for section ${sectionIndex} (${sectionTitle})`);
    
    // Don't add the section title as an H3 since it's already in the content
    // This prevents duplicate headings
    return cleanupWikipediaHtml(sectionData.parse.text['*'], pageTitle);
  } catch (error) {
    console.error(`Error in fetchSectionWithSubsections for ${pageTitle}, section ${sectionIndex}:`, error);
    return null;
  }
}

// Improve the controversies fetching to be more targeted and limit content
async function fetchAndParseWikipediaPage(pageTitle: string): Promise<string | null> {
  try {
    // First fetch the page sections to identify relevant controversy sections
    const sectionsUrl = `https://de.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json`;
    const sectionsResponse = await fetch(sectionsUrl);
    if (!sectionsResponse.ok) {
      console.error('Wikipedia sections API error:', sectionsResponse.status, await sectionsResponse.text());
      return null;
    }
    
    const sectionsData = await sectionsResponse.json();
    const sections = sectionsData.parse?.sections || [];
    
    // Log all section titles for debugging
    console.log(`Found ${sections.length} sections for ${pageTitle} when looking for controversies:`);
    sections.forEach((section: any) => {
      console.log(`Section ${section.index}: "${section.line}" (level: ${section.level}, anchor: ${section.anchor})`);
    });
    
    // Expanded list of keywords to identify controversy sections
    const controversyKeywords = [
      'skandal', 'kontrovers', 'kritik', 'korruption', 'affäre', 'vorwurf', 'umstritten',
      'maskenaffäre', 'untersuchung', 'ermittlung', 'verfahren', 'plagiat', 'rücktritt',
      'entlassung', 'parteiausschluss', 'betrug', 'lobbyismus', 'streit', 'streitpunkt',
      'konflikt', 'causa', 'fehler', 'verstrickung', 'vorwürfe', 'kontroverse'
    ];
    
    // Find sections with controversy keywords in the title
    const controversySections = sections.filter((section: any) => {
      const sectionTitle = section.line.toLowerCase();
      return controversyKeywords.some(keyword => sectionTitle.includes(keyword));
    });
    
    console.log(`Found ${controversySections.length} potential controversy sections: ${controversySections.map((s: any) => s.line).join(', ')}`);
    
    // If we found explicit controversy sections, use them
    if (controversySections.length > 0) {
      let controversyContent = '';
      
      // Get the content for each controversy section
      for (const section of controversySections) {
        try {
          const sectionUrl = `https://de.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${section.index}&prop=text&format=json`;
          console.log(`Fetching controversy section: ${section.line} (index: ${section.index})`);
          
          const sectionResponse = await fetch(sectionUrl);
          if (sectionResponse.ok) {
            const sectionData = await sectionResponse.json();
            if (sectionData.parse?.text?.['*']) {
              controversyContent += `<h3>${section.line}</h3>${sectionData.parse.text['*']}`;
            }
          }
        } catch (error) {
          console.error(`Error fetching controversy section ${section.line}:`, error);
        }
      }
      
      if (controversyContent) {
        return cleanupWikipediaHtml(controversyContent, pageTitle);
      }
    }
    
    // If no explicit controversy sections found, look for other relevant sections
    // that might contain controversies (like biography sections for politicians)
    const relevantSections = ['Biografie', 'Leben', 'Karriere', 'Politik', 'Wirken', 'Tätigkeit', 'Arbeit'];
    const potentialSections = sections.filter((section: any) => 
      relevantSections.some(keyword => section.line.toLowerCase().includes(keyword.toLowerCase()))
    );

    // Process up to 8 relevant sections, but avoid the intro (index 0) and exclude overly general sections
    if (potentialSections.length > 0) {
      console.log(`No direct controversy sections found, using up to 8 relevant sections: ${potentialSections.slice(0, 8).map((s: any) => s.line).join(', ')}`);
      
      // Process only up to 8 relevant sections
      let controversyContent = '';
      let processedCount = 0;
      
      for (let i = 0; i < potentialSections.length && processedCount < 8; i++) {
        const section = potentialSections[i];
        
        // Skip intro section or sections with index 0 or 1
        if (section.index < 2 || section.line === 'Einleitung' || section.line === 'Überblick') {
          console.log(`Skipping section ${section.line} as it's likely an intro section`);
          continue;
        }
        
        try {
          const sectionUrl = `https://de.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${section.index}&prop=text&format=json`;
          const sectionResponse = await fetch(sectionUrl);
          
          if (sectionResponse.ok) {
            const sectionData = await sectionResponse.json();
            if (sectionData.parse?.text?.['*']) {
              // For these general sections, we want to extract only paragraphs containing controversy keywords
              const $ = cheerio.load(sectionData.parse.text['*']);
              let relevantContent = '';
              
              // Extract only paragraphs with controversy-related content
              $('p').each((i, el) => {
                const text = $(el).text().toLowerCase();
                if (controversyKeywords.some(keyword => text.includes(keyword))) {
                  relevantContent += $.html(el) + '\n';
                }
              });
              
              if (relevantContent) {
                controversyContent += `<h3>${section.line}</h3>${relevantContent}`;
                processedCount++;
                console.log(`Added content from section ${section.line}, processed ${processedCount} sections so far`);
              }
            }
          }
        } catch (error) {
          console.error(`Error processing general section ${section.line}:`, error);
        }
      }
      
      if (controversyContent) {
        return cleanupWikipediaHtml(controversyContent, pageTitle);
      }
    }
    
    console.log(`No controversy content found for: ${pageTitle}`);
    return null;
  } catch (error) {
    console.error('Error fetching/parsing Wikipedia page content for:', pageTitle, error);
    return null;
  }
}

// Improve the political positions fetching to be more inclusive and reliable
async function fetchPoliticalPositions(pageTitle: string): Promise<string | null> {
  try {
    console.log(`Fetching political positions for ${pageTitle}`);
    const sectionsUrl = `https://de.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json`;
    const sectionsResponse = await fetch(sectionsUrl);
    
    if (!sectionsResponse.ok) {
      console.error('Wikipedia sections API error:', sectionsResponse.status);
      return null;
    }
    
    const sectionsData = await sectionsResponse.json();
    const sections = sectionsData.parse?.sections || [];
    
    console.log(`Found ${sections.length} sections for ${pageTitle} when looking for political positions`);
    
    // Log all sections to help with debugging
    sections.forEach((section: any) => {
      console.log(`Section ${section.index}: "${section.line}" (level: ${section.level})`);
    });
    
    // Look for "Politische Positionen" or similar sections with expanded keywords
    const positionKeywords = [
      "Politische Positionen", 
      "Politische Position", 
      "Positionen", 
      "Position", 
      "Politische Standpunkte",
      "Standpunkte",
      "Politische Ansichten",
      "Politische Haltung",
      "Politik",
      "Politische Karriere",
      "Politische Arbeit",
      "Politische Tätigkeit",
      "Themen",
      "Schwerpunkte",
      "Politische Inhalte"
    ];
    
    // Find sections with matching titles, broader criteria
    const positionSections = sections.filter((section: any) => 
      positionKeywords.some(keyword => 
        section.line.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    console.log(`Found ${positionSections.length} potential position sections: ${positionSections.map((s: any) => s.line).join(', ')}`);
    
    if (positionSections.length > 0) {
      // Start with the most relevant section (often the one explicitly about positions)
      const bestMatchSection = positionSections.find((section: any) => 
        section.line.toLowerCase().includes("position")
      ) || positionSections[0];
      
      console.log(`Selected best position section: ${bestMatchSection.line} (index: ${bestMatchSection.index})`);
      
      // Fetch the selected section
      const sectionUrl = `https://de.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${bestMatchSection.index}&prop=text&format=json`;
      const sectionResponse = await fetch(sectionUrl);
      
      if (sectionResponse.ok) {
        const sectionData = await sectionResponse.json();
        if (sectionData.parse?.text?.['*']) {
          return cleanupWikipediaHtml(sectionData.parse.text['*'], pageTitle);
        }
      }
    }
    
    // If no specific position section found, try to construct a general political overview
    // This is a fallback approach to ensure we have some position content
    let generalPoliticalContent = '';
    
    // Look for other politics-related sections
    const politicalSections = sections.filter((section: any) => {
      const title = section.line.toLowerCase();
      return title.includes('polit') || 
             title.includes('regierung') || 
             title.includes('minister') || 
             title.includes('bundestag') || 
             title.includes('abgeordnet') ||
             title.includes('partei');
    });
    
    if (politicalSections.length > 0) {
      console.log(`Using general political sections as fallback: ${politicalSections.map((s: any) => s.line).join(', ')}`);
      
      // Get content from the first 1-2 political sections
      for (let i = 0; i < Math.min(2, politicalSections.length); i++) {
        const section = politicalSections[i];
        try {
          const url = `https://de.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${section.index}&prop=text&format=json`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            if (data.parse?.text?.['*']) {
              generalPoliticalContent += `<h3>${section.line}</h3>${data.parse.text['*']}`;
            }
          }
        } catch (e) {
          console.error(`Error fetching political section ${section.line}:`, e);
        }
      }
      
      if (generalPoliticalContent) {
        return cleanupWikipediaHtml(generalPoliticalContent, pageTitle);
      }
    }
    
    console.log(`No political positions found for ${pageTitle}`);
    return null;
    
  } catch (error) {
    console.error('Error fetching political positions:', error);
    return null;
  }
}

// Update the GET handler to handle the new approach
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const getImage = searchParams.get('getImage') === 'true';
  const directSection = searchParams.get('section');

  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
  }

  try {
    console.log(`[Wikipedia API] Processing request for ${name}, getImage: ${getImage}, directSection: ${directSection}`);
    
    // Regular flow for all politicians
    const pageInfo = await searchWikipediaPage(name);
    if (!pageInfo) {
      return NextResponse.json({ 
        htmlContent: null, 
        politicalPositionsHtml: null,
        message: 'No relevant Wikipedia page found.',
        image: null
      });
    }

    // Create a response object
    const response: any = {
      pageTitle: pageInfo.title,
      pageId: pageInfo.pageId
    };

    // Fetch image if requested
    if (getImage) {
      const imageData = await fetchWikipediaImage(pageInfo.title);
      response.image = imageData;
    }

    // Fetch controversies content
    const htmlContent = await fetchAndParseWikipediaPage(pageInfo.title);
    
    // Fetch political positions separately
    const politicalPositionsHtml = await fetchPoliticalPositions(pageInfo.title);
    response.politicalPositionsHtml = politicalPositionsHtml;
    
    if (htmlContent) {
      response.htmlContent = htmlContent;
    } else {
      response.message = `Keine Kontroversen gefunden für ${pageInfo.title}.`;
    }
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in Wikipedia GET handler:', error);
    return NextResponse.json({ error: 'Failed to process Wikipedia information' }, { status: 500 });
  }
} 
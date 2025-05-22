import { NextResponse } from 'next/server';

let currentLegislatureId: number | null = null;
let lastFetchedTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

async function getCurrentBundestagLegislatureId(): Promise<number | null> {
  const now = Date.now();
  if (currentLegislatureId && (now - lastFetchedTime < CACHE_DURATION)) {
    console.log('(Search Route) Using cached Bundestag legislature ID:', currentLegislatureId);
    return currentLegislatureId;
  }

  try {
    // Fetch the Bundestag (ID 5) and get its current_project.id
    const response = await fetch('https://www.abgeordnetenwatch.de/api/v2/parliaments/5');
    if (!response.ok) {
      console.error('Failed to fetch Bundestag data:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    if (data && data.data && data.data.current_project && data.data.current_project.id) {
      currentLegislatureId = data.data.current_project.id;
      lastFetchedTime = now;
      console.log('Fetched and cached current Bundestag legislature ID (search route) from parliament.current_project:', currentLegislatureId);
      return currentLegislatureId;
    }
    
    console.error('Could not find current_project.id in Bundestag data');
    return null;
  } catch (error) {
    console.error('Error fetching Bundestag legislature ID:', error);
    return null;
  }
}

/**
 * This tries to enrich politicians with parliament_period data if it's missing,
 * to help with the frontend display and filtering.
 */
async function augmentPoliticians(politicians: any[]): Promise<any[]> {
  // This ID is primarily to enrich results that don't have parliament information
  const currentBundestagLegislatureId = await getCurrentBundestagLegislatureId();
  
  return Promise.all(politicians.map(async (politician) => {
    // If the politician already has parliament_period data, we can use it directly
    if (politician.parliament_period && politician.parliament_period.parliament) {
      return politician;
    }
    
    // Otherwise, we need to do a simplified augmentation
    console.log(`[DEBUG] Search API: Politician ${politician.id} (${politician.label}) MISSING parliament_period. Attempting simplified augmentation...`);
    
    // Try to determine parliament from the mandates, if available directly
    if (!politician.parliament_period) {
      console.log(`[DEBUG] Search API: No parliament period directly on politician ${politician.id}. Trying to fetch mandates...`);
      
      try {
        // Simplified fetch that doesn't specify parliament or period - just get candidate info
        const mandatesResponse = await fetch(`https://www.abgeordnetenwatch.de/api/v2/candidacies-mandates?politician=${politician.id}&parliament=*`);
        
        if (mandatesResponse.ok) {
          const mandatesData = await mandatesResponse.json();
          const mandates = mandatesData.data || [];
          
          // Find a valid mandate with parliament information
          const validMandate = mandates.find((m: any) => 
            m.type === 'mandate' && 
            m.parliament && 
            m.parliament_period
          );
          
          if (validMandate) {
            console.log(`[DEBUG] Search API: Found parliament period from mandate for ${politician.id}. Parliament ID: ${validMandate.parliament.id}`);
            
            // Use the mandate's parliament info
            politician.parliament_period = validMandate.parliament_period;
            politician.currentParliamentId = validMandate.parliament.id;
            return politician;
          }
        }
      } catch (error) {
        console.error(`[DEBUG] Search API: Error fetching mandates for politician ${politician.id}:`, error);
      }
    }
    
    // If we still don't have parliament information, provide Bundestag as a default
    // This is a simplified approach that makes a reasonable assumption for German politicians
    if (!politician.parliament_period && currentBundestagLegislatureId) {
      console.log(`[DEBUG] Search API: Using default Bundestag assumption for politician ${politician.id}`);
      politician.currentParliamentId = 5; // Bundestag ID
      return politician;
    }
    
    return politician;
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  
  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
  }

  try {
    // Simplified search - only filter by name without specifying parliament or period
    // This reduces API calls and allows finding politicians across all parliaments
    const url = `https://www.abgeordnetenwatch.de/api/v2/politicians?label[cn]=${encodeURIComponent(name)}&range_end=10`;
    
    console.log(`[DEBUG] Search API: Fetching politicians from: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch politicians from Abgeordnetenwatch: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    const politicians = data.data || [];
    
    // Augment politicians with missing parliament data when needed
    const augmentedPoliticians = await augmentPoliticians(politicians);
    
    return NextResponse.json({ data: augmentedPoliticians });
  } catch (error) {
    console.error('Error in politicians search:', error);
    return NextResponse.json({ error: 'Failed to search politicians' }, { status: 500 });
  }
} 
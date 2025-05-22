import { NextResponse } from 'next/server';

// Cache for current legislature ID - now an object to store per parliament
let currentLegislatureIdCache: { [parliamentId: string]: number | null } = {};
let lastFetchedTimeCache: { [parliamentId: string]: number } = {};
const CACHE_DURATION_MS = 1000 * 60 * 60 * 24; // 24 hours

async function getCurrentLegislatureIdCached(parliamentId: string): Promise<number | null> {
  const now = Date.now();
  if (currentLegislatureIdCache[parliamentId] && (now - (lastFetchedTimeCache[parliamentId] || 0) < CACHE_DURATION_MS)) {
    console.log(`(Details Route) Using cached legislature ID for parliament ${parliamentId}:`, currentLegislatureIdCache[parliamentId]);
    return currentLegislatureIdCache[parliamentId]!;
  }
  try {
    console.log(`(Details Route) Fetching parliament data for parliament ID: ${parliamentId}`);
    const response = await fetch(`https://www.abgeordnetenwatch.de/api/v2/parliaments/${parliamentId}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch parliament data for ID ${parliamentId} (details route)`, response.status, errorText);
      return currentLegislatureIdCache[parliamentId] || null; // Return old cache if fetch fails
    }
    const data = await response.json();
    if (data.data && data.data.current_project && data.data.current_project.id) {
      currentLegislatureIdCache[parliamentId] = data.data.current_project.id;
      lastFetchedTimeCache[parliamentId] = now;
      console.log(`Fetched/updated legislature ID for parliament ${parliamentId} (details route) from current_project:`, currentLegislatureIdCache[parliamentId]);
      return currentLegislatureIdCache[parliamentId]!;
    }
    console.warn(`Could not parse current legislature ID for parliament ${parliamentId} from current_project. Data:`, JSON.stringify(data, null, 2));
    return currentLegislatureIdCache[parliamentId] || null; // Return old cache if parsing fails
  } catch (error) {
    console.error(`Error fetching current legislature ID for parliament ${parliamentId} using current_project (details route):`, error);
    return currentLegislatureIdCache[parliamentId] || null; // Return old cache on error
  }
}

// NEW Helper function to wrap individual related data fetches
async function fetchAWRelatedDataItem(url: string, itemName: string, politicianId: string, enrichPolls: boolean = false): Promise<any> {
  console.log(`[DEBUG] fetchAWRelatedDataItem: Fetching ${itemName} for ${politicianId} from ${url}`);
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      console.log(`[DEBUG] fetchAWRelatedDataItem: Successfully fetched ${itemName} for ${politicianId}. Count: ${data.data?.length || 0}`);
      
      // Check if this is a votes result and we need to enrich with poll data
      if (enrichPolls && itemName.includes('Abstimmungen') && data.data && data.data.length > 0) {
        console.log(`[DEBUG] fetchAWRelatedDataItem: Enriching ${data.data.length} votes with poll data`);
        
        // Process votes to add web URLs and get poll details where needed
        const enrichedData = await Promise.all(data.data.map(async (vote: any) => {
          // Get poll ID if available
          const pollId = vote.poll?.id;
          if (!pollId) return vote;
          
          try {
            // Fetch detailed poll information
            const pollUrl = `https://www.abgeordnetenwatch.de/api/v2/polls/${pollId}`;
            const pollResponse = await fetch(pollUrl);
            if (pollResponse.ok) {
              const pollData = await pollResponse.json();
              if (pollData.data) {
                // Update the vote with detailed poll info
                vote.poll = {
                  ...vote.poll,
                  ...pollData.data,
                  field_poll_date: pollData.data.field_poll_date || vote.poll.field_poll_date, 
                  abgeordnetenwatch_url: pollData.data.abgeordnetenwatch_url || 
                                        `https://www.abgeordnetenwatch.de/bundestag/abstimmungen/${pollId}`
                };
              }
            }
          } catch (pollError) {
            console.error(`[DEBUG] fetchAWRelatedDataItem: Error enriching poll ${pollId}:`, pollError);
          }
          return vote;
        }));
        
        return { data: enrichedData, aw_status: response.status };
      }
      
      return { data: data.data || [], aw_status: response.status };
    }
    // Specific handling for 404
    if (response.status === 404) {
        console.warn(`[DEBUG] fetchAWRelatedDataItem: ${itemName} not found (404) for ${politicianId} at ${url}.`);
        return { data: [], aw_status: 404 };
    }
    // Handle other non-ok responses (e.g., 500)
    const errorText = await response.text();
    console.warn(`[DEBUG] fetchAWRelatedDataItem: Failed to fetch ${itemName} for ${politicianId}: ${response.status}. Details: ${errorText}`);
    return {
        data: [],
        error: {
            status: response.status,
            message: `Fehler (${response.status}) beim Abrufen von ${itemName} vom externen Dienst.`,
        },
        aw_status: response.status,
    };
  } catch (error: any) {
    console.error(`[DEBUG] fetchAWRelatedDataItem: Network or other error fetching ${itemName} for ${politicianId}. Error:`, error);
    return {
        data: [],
        error: {
            status: 503, // Service Unavailable / Network Error
            message: `Netzwerk- oder Verbindungsfehler beim Abrufen von ${itemName}. Message: ${error.message}`,
        },
    };
  }
}

// Helper to fetch mandates if not already available, specifically for parliament ID derivation
async function getMandatesForDerivation(politicianId: string, existingPoliticianData: any): Promise<any[] | null> {
  if (existingPoliticianData && existingPoliticianData.all_candidacies_mandates && existingPoliticianData.all_candidacies_mandates.data && existingPoliticianData.all_candidacies_mandates.data.length > 0) {
    console.log(`[DEBUG] getMandatesForDerivation: Using existing embedded mandates for ${politicianId}`);
    return existingPoliticianData.all_candidacies_mandates.data;
  }
  console.log(`[DEBUG] getMandatesForDerivation: No usable embedded mandates for ${politicianId}. Fetching separately...`);
  try {
    const mandatesUrl = `https://www.abgeordnetenwatch.de/api/v2/candidacies-mandates?politician=${politicianId}`;
    const mandatesResponse = await fetch(mandatesUrl);
    if (mandatesResponse.ok) {
      const mandatesData = await mandatesResponse.json();
      if (mandatesData.data && mandatesData.data.length > 0) {
        console.log(`[DEBUG] getMandatesForDerivation: Successfully fetched ${mandatesData.data.length} mandates for ${politicianId}.`);
        // Enrich mandates with full parliament_period data if necessary (simplified enrichment for derivation)
        return await Promise.all(mandatesData.data.map(async (mandate: any) => {
          if (mandate.parliament_period && mandate.parliament_period.api_url && !mandate.parliament_period.parliament) {
            try {
              const ppResponse = await fetch(mandate.parliament_period.api_url);
              if (ppResponse.ok) {
                const ppData = await ppResponse.json();
                if (ppData.data) mandate.parliament_period = ppData.data;
              }
            } catch (enrichError) { /* ignore enrich error for derivation */ }
          }
          return mandate;
        }));
      }
    }
    console.warn(`[DEBUG] getMandatesForDerivation: Failed to fetch or no mandates found for ${politicianId}. Status: ${mandatesResponse.status}`);
  } catch (error) {
    console.error(`[DEBUG] getMandatesForDerivation: Error fetching mandates for ${politicianId}:`, error);
  }
  return null;
}

export async function GET(
  request: Request, 
  { params }: { params: { id: string } }
) {
  const politicianId = params.id;
  let { searchParams } = new URL(request.url);
  let parliamentIdFromQuery = searchParams.get('parliamentId');

  if (!politicianId) {
    return NextResponse.json({ error: 'Politician ID is required' }, { status: 400 });
  }

  console.log(`[DEBUG] Details API: Initial GET for Politician ID ${politicianId}. Parliament ID from query: ${parliamentIdFromQuery}`);

  let politicianData: any = null;
  let awError = null;
  let awStatus = 200;
  let fetchMandatesSeparatelyInRelated = true; 
  let determinedParliamentId = parliamentIdFromQuery; // Will be updated if not provided or if derived internally
  let determinedTargetPeriodId: number | null = null;

  // Step 1: Fetch main politician data, potentially with embedded mandates
  // This data might also give us parliament_period info if not supplied by query
  try {
    const initialPoliticianUrl = `https://www.abgeordnetenwatch.de/api/v2/politicians/${politicianId}?related_data=all_candidacies_mandates`;
    console.log('[DEBUG] API Route Details: Fetching initial politician data with embedded mandates attempt:', initialPoliticianUrl);
    const response = await fetch(initialPoliticianUrl);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[DEBUG] API Route Details: Error fetching politician ${politicianId} (embed attempt): ${response.status}`, errorData);
      awError = `Error fetching politician ${politicianId} (embed attempt): ${response.status} - ${errorData}`;
      awStatus = response.status;
      // Try fallback without embed
      const fallbackResponse = await fetch(`https://www.abgeordnetenwatch.de/api/v2/politicians/${politicianId}`);
      if (fallbackResponse.ok) {
        const fallbackJson = await fallbackResponse.json();
        politicianData = fallbackJson.data;
        console.log(`[DEBUG] API Route Details: Successfully fetched main data for ${politicianId} via fallback.`);
        fetchMandatesSeparatelyInRelated = true; // Mandates definitely need to be fetched separately
      } else {
        const fallbackErrorData = await fallbackResponse.text();
        console.error(`[DEBUG] API Route Details: Fallback fetch for ${politicianId} also failed: ${fallbackResponse.status}`, fallbackErrorData);
        awError = (awError || "") + ` | Fallback fetch also failed: ${fallbackResponse.status} - ${fallbackErrorData}`;
        // politicianData remains null, error out early
        return NextResponse.json({ error: awError, aw_status: awStatus, data: null, related_data: {} }, { status: awStatus });
      }
    } else {
      const politicianApiResponse = await response.json();
      politicianData = politicianApiResponse.data;
      awStatus = response.status;
      console.log(`[DEBUG] API Route Details: Successfully fetched politician ${politicianId} (embed attempt).`);
      const hasEmbeddedMandates = politicianData.all_candidacies_mandates && politicianData.all_candidacies_mandates.data && politicianData.all_candidacies_mandates.data.length > 0;
      fetchMandatesSeparatelyInRelated = !hasEmbeddedMandates;
      if (hasEmbeddedMandates) console.log(`[DEBUG] API Route Details: Mandates were embedded for ${politicianId}.`);
      else console.log(`[DEBUG] API Route Details: Mandates were NOT embedded for ${politicianId}, will fetch separately.`);
    }
  } catch (e: any) {
    console.error(`[DEBUG] API Route Details: Unexpected error during initial politician fetch for ${politicianId}:`, e);
    awError = e.message || 'Unknown error during initial fetch';
    awStatus = 500;
    return NextResponse.json({ error: awError, aw_status: awStatus, data: null, related_data: {} }, { status: awStatus });
  }

  // Step 2: Determine Parliament ID and Target Legislative Period ID
  if (!determinedParliamentId) {
    console.log(`[DEBUG] Details API: Parliament ID not from query. Attempting to derive from fetched politician data for ${politicianId}.`);
    if (politicianData && politicianData.current_parliament_period && politicianData.current_parliament_period.parliament && politicianData.current_parliament_period.parliament.id) {
      determinedParliamentId = politicianData.current_parliament_period.parliament.id.toString();
      console.log(`[DEBUG] Details API: Derived Parliament ID ${determinedParliamentId} from politicianData.current_parliament_period.`);
    } else if (politicianData && politicianData.parliament_period && politicianData.parliament_period.parliament && politicianData.parliament_period.parliament.id) {
      determinedParliamentId = politicianData.parliament_period.parliament.id.toString();
      console.log(`[DEBUG] Details API: Derived Parliament ID ${determinedParliamentId} from politicianData.parliament_period (fallback).`);
    } else {
      // If not found directly on politicianData, try fetching/using mandates
      const mandatesForDerivation = await getMandatesForDerivation(politicianId, politicianData);
      if (mandatesForDerivation && mandatesForDerivation.length > 0) {
        const latestMandate = mandatesForDerivation[0]; // AW usually sorts most recent first
        if (latestMandate && latestMandate.parliament_period && latestMandate.parliament_period.parliament && latestMandate.parliament_period.parliament.id) {
          determinedParliamentId = latestMandate.parliament_period.parliament.id.toString();
          console.log(`[DEBUG] Details API: Derived Parliament ID ${determinedParliamentId} from mandates obtained via getMandatesForDerivation.`);
          // If mandates were fetched by getMandatesForDerivation, store them on politicianData
          // so fetchSeparateRelatedData might not need to re-fetch if fetchMandatesSeparatelyInRelated was true
          if (!politicianData.all_candidacies_mandates || !politicianData.all_candidacies_mandates.data || politicianData.all_candidacies_mandates.data.length === 0) {
             politicianData.all_candidacies_mandates = { data: mandatesForDerivation }; // Mimic AW structure
             fetchMandatesSeparatelyInRelated = false; // Indicate mandates are now available
             console.log(`[DEBUG] Details API: Updated politicianData.all_candidacies_mandates from getMandatesForDerivation results. fetchMandatesSeparatelyInRelated set to false.`);
          }
        }
      }
    }
    if (!determinedParliamentId) {
        console.warn(`[DEBUG] Details API: Could not derive Parliament ID for ${politicianId} through any means. Defaulting to Bundestag ('5').`);
        determinedParliamentId = '5'; // Default to Bundestag if still not found
    }
  }

  // Ensure politicianData has a parliament_period consistent with determinedParliamentId for UI display
  if (determinedParliamentId && politicianData) {
    const currentPoliticianParliamentId = politicianData.parliament_period?.parliament?.id.toString();
    if (currentPoliticianParliamentId !== determinedParliamentId) {
      console.log(`[DEBUG] Details API: politicianData.parliament_period.parliament.id (${currentPoliticianParliamentId}) does not match determinedParliamentId (${determinedParliamentId}). Attempting to update.`);
      // Try to find the mandate that led to determinedParliamentId (if derivation occurred)
      const mandatesUsedForDerivation = politicianData.all_candidacies_mandates?.data;
      if (mandatesUsedForDerivation && mandatesUsedForDerivation.length > 0) {
        const matchingMandate = mandatesUsedForDerivation.find(
          (m:any) => m.parliament_period?.parliament?.id.toString() === determinedParliamentId
        );
        if (matchingMandate && matchingMandate.parliament_period) {
          politicianData.parliament_period = matchingMandate.parliament_period;
          console.log(`[DEBUG] Details API: Updated politicianData.parliament_period from matching mandate. New parliament label: ${politicianData.parliament_period?.parliament?.label}`);
          // Also ensure top-level fields used by UI are consistent if possible
          if (!politicianData.party && matchingMandate.party) politicianData.party = matchingMandate.party;
          if (!politicianData.fraction_membership && matchingMandate.fraction_membership) politicianData.fraction_membership = matchingMandate.fraction_membership; // this might not exist directly on mandate
        } else {
          console.log(`[DEBUG] Details API: Could not find a mandate matching determinedParliamentId (${determinedParliamentId}) to update politicianData.parliament_period.`);
        }
      } else {
        console.log(`[DEBUG] Details API: No mandates available on politicianData.all_candidacies_mandates to update politicianData.parliament_period.`);
      }
    } else {
      console.log(`[DEBUG] Details API: politicianData.parliament_period.parliament.id already matches determinedParliamentId. No update needed.`);
    }
  }
  
  determinedTargetPeriodId = await getCurrentLegislatureIdCached(determinedParliamentId);
  console.log(`[DEBUG] Details API: Final Parliament ID: ${determinedParliamentId}, TargetPeriodId: ${determinedTargetPeriodId} for Politician ${politicianId}`);
  
  // Step 3: Fetch related data using the determined context
  const relatedDataResults = await fetchSeparateRelatedData(
    politicianId,
    politicianData, 
    fetchMandatesSeparatelyInRelated,
    determinedTargetPeriodId, // Use the now determined target period ID
    true 
  );

  return NextResponse.json({
    data: politicianData,
    related_data: {
      candidacies_mandates_wrapped: relatedDataResults.candidacies_mandates_wrapped,
      committee_memberships_wrapped: relatedDataResults.committee_memberships_wrapped,
      side_jobs_wrapped: relatedDataResults.side_jobs_wrapped,
      votes_wrapped: relatedDataResults.votes_wrapped
    },
    aw_status: awStatus, // Include the status of the main politician fetch
    error: awError // Include any error message from the main politician fetch
  });
}

async function fetchSeparateRelatedData(
    politicianId: string, 
    mainPoliticianData: any, 
    fetchMandatesSeparately: boolean = false,
    targetPeriodId: number | null,
    fetchSideJobsSeparately: boolean = true 
) {
    console.log(`[DEBUG] fetchSeparateRelatedData called for Politician ID ${politicianId}. TargetPeriodId: ${targetPeriodId}. FetchMandatesSeparately: ${fetchMandatesSeparately}. FetchSideJobsSeparately: ${fetchSideJobsSeparately}`);
    mainPoliticianData.related_data = mainPoliticianData.related_data || {};

    if (fetchMandatesSeparately) {
        console.log(`[DEBUG] fetchSeparate: Fetching mandates separately for ${politicianId}`);
        try {
            const mandatesUrl = `https://www.abgeordnetenwatch.de/api/v2/candidacies-mandates?politician=${politicianId}`;
            const mandatesResponse = await fetch(mandatesUrl);
            if (mandatesResponse.ok) {
                const mandatesData = await mandatesResponse.json();
                console.log(`[DEBUG] fetchSeparate: Successfully fetched separate candidacies-mandates for ${politicianId}. Raw count: ${mandatesData.data?.length || 0}`);
                if (mandatesData.data && mandatesData.data.length > 0) {
                    const enrichedMandates = await Promise.all(mandatesData.data.map(async (mandate: any) => {
                        if (mandate.parliament_period && mandate.parliament_period.api_url) {
                            try {
                                const ppResponse = await fetch(mandate.parliament_period.api_url);
                                if (ppResponse.ok) {
                                    const ppData = await ppResponse.json();
                                    if (ppData.data && ppData.data.parliament) {
                                        mandate.parliament_period = ppData.data;
                                    }
                                } 
                            } catch (enrichError) {
                                console.error(`[DEBUG] fetchSeparate: Error enriching parliament_period for mandate ${mandate.id}:`, enrichError);
                            }
                        }
                        return mandate;
                    }));
                    mainPoliticianData.related_data.all_candidacies_mandates = { data: enrichedMandates, meta: mandatesData.meta }; // Store as an object matching AW structure
                } else {
                    mainPoliticianData.related_data.all_candidacies_mandates = { data: [], meta: mandatesData.meta };
                }
            } else {
                console.warn(`[DEBUG] fetchSeparate: Failed to fetch separate candidacies-mandates for ${politicianId}: ${mandatesResponse.status}.`);
                mainPoliticianData.related_data.all_candidacies_mandates = { data: [] };
            }
        } catch (mandatesError) {
            console.error(`[DEBUG] fetchSeparate: Error during separate fetch for candidacies-mandates for ${politicianId}. Error:`, mandatesError);
            mainPoliticianData.related_data.all_candidacies_mandates = { data: [] };
        }
    }

    let aggregatedCommitteesData: any[] = [];
    let aggregatedVotesData: any[] = [];
    let aggregatedSideJobsData: any[] = [];

    let committeesError: any = null;
    let votesError: any = null;
    let sideJobsError: any = null;

    let committeesAwStatus: number | undefined = undefined;
    let votesAwStatus: number | undefined = undefined;
    let sideJobsAwStatus: number | undefined = undefined;

    // Use mandates from related_data if fetched, otherwise from embedded data in mainPoliticianData
    console.log(`[DEBUG] fetchSeparate: Checking mainPoliticianData.related_data.all_candidacies_mandates:`, JSON.stringify(mainPoliticianData.related_data.all_candidacies_mandates, null, 2));
    console.log(`[DEBUG] fetchSeparate: Checking mainPoliticianData.all_candidacies_mandates:`, JSON.stringify(mainPoliticianData.all_candidacies_mandates, null, 2));
    
    const mandatesSource = mainPoliticianData.related_data.all_candidacies_mandates || mainPoliticianData.all_candidacies_mandates;
    console.log(`[DEBUG] fetchSeparate: mandatesSource resolved to:`, JSON.stringify(mandatesSource, null, 2));
    
    const mandatesList = mandatesSource?.data || [];
    console.log(`[DEBUG] fetchSeparate: mandatesList derived as (length: ${mandatesList.length}):`, JSON.stringify(mandatesList, null, 2));
    
    console.log(`[DEBUG] fetchSeparate: Processing ${mandatesList.length} mandates/candidacies for related data. TargetPeriodId: ${targetPeriodId}`);

    if (mandatesList.length > 0) {
        // First try to get data for the target period
        let targetPeriodProcessed = false;
        if (targetPeriodId !== null) {
            const targetPeriodMandates = mandatesList.filter((mandate: any) => 
                mandate.type === 'mandate' && mandate.id && mandate.parliament_period?.id === targetPeriodId
            );
            
            if (targetPeriodMandates.length > 0) {
                console.log(`[DEBUG] fetchSeparate: Found ${targetPeriodMandates.length} mandate(s) matching target period ID ${targetPeriodId}.`);
                targetPeriodProcessed = true;
                
                for (const mandate of targetPeriodMandates) {
                    console.log(`[DEBUG] fetchSeparate: Processing mandate ${mandate.id} from target period.`);
                    
                    const committeesUrl = `https://www.abgeordnetenwatch.de/api/v2/committee-memberships?candidacy_mandate=${mandate.id}`;
                    const committeeResult = await fetchAWRelatedDataItem(committeesUrl, `Ausschussmitgliedschaften für Mandat ${mandate.id}`, politicianId);
                    if (committeeResult.data && committeeResult.data.length > 0) aggregatedCommitteesData.push(...committeeResult.data);
                    if (committeeResult.error && !committeesError) committeesError = committeeResult.error;
                    if (committeeResult.aw_status && (committeesAwStatus === undefined || committeeResult.aw_status !== 404)) committeesAwStatus = committeeResult.aw_status;
                    else if (committeeResult.aw_status === 404 && committeesAwStatus === undefined) committeesAwStatus = 404;

                    const votesUrl = `https://www.abgeordnetenwatch.de/api/v2/votes?mandate=${mandate.id}`;
                    const voteResult = await fetchAWRelatedDataItem(votesUrl, `Abstimmungen für Mandat ${mandate.id}`, politicianId, true);
                    if (voteResult.data && voteResult.data.length > 0) aggregatedVotesData.push(...voteResult.data);
                    if (voteResult.error && !votesError) votesError = voteResult.error;
                    if (voteResult.aw_status && (votesAwStatus === undefined || voteResult.aw_status !== 404)) votesAwStatus = voteResult.aw_status;
                    else if (voteResult.aw_status === 404 && votesAwStatus === undefined) votesAwStatus = 404;

                    if (fetchSideJobsSeparately) {
                        const sideJobsUrl = `https://www.abgeordnetenwatch.de/api/v2/side-jobs?candidacy_mandate=${mandate.id}`;
                        const sideJobResult = await fetchAWRelatedDataItem(sideJobsUrl, `Nebentätigkeiten für Mandat ${mandate.id}`, politicianId);
                        if (sideJobResult.data && sideJobResult.data.length > 0) aggregatedSideJobsData.push(...sideJobResult.data);
                        if (sideJobResult.error && !sideJobsError) sideJobsError = sideJobResult.error;
                        if (sideJobResult.aw_status && (sideJobsAwStatus === undefined || sideJobResult.aw_status !== 404)) sideJobsAwStatus = sideJobResult.aw_status;
                        else if (sideJobResult.aw_status === 404 && sideJobsAwStatus === undefined) sideJobsAwStatus = 404;
                    }
                }
            } else {
                console.log(`[DEBUG] fetchSeparate: No mandates found matching target period ID ${targetPeriodId}. Will use other mandates.`);
            }
        }
        
        // If we didn't process the target period (or it doesn't exist), use the most recent mandate
        if (!targetPeriodProcessed && mandatesList.length > 0) {
            // Sort mandates by period ID (descending) to get the most recent first
            const mandatesForProcessing = mandatesList
                .filter((mandate: any) => mandate.type === 'mandate' && mandate.id)
                .sort((a: any, b: any) => {
                    // Try to sort by period ID (assuming higher ID = more recent)
                    if (a.parliament_period?.id && b.parliament_period?.id) {
                        return b.parliament_period.id - a.parliament_period.id;
                    }
                    return 0;
                });
            
            if (mandatesForProcessing.length > 0) {
                const mostRecentMandate = mandatesForProcessing[0];
                console.log(`[DEBUG] fetchSeparate: Using most recent mandate ${mostRecentMandate.id} (Period ID: ${mostRecentMandate.parliament_period?.id}) for data.`);
                
                const committeesUrl = `https://www.abgeordnetenwatch.de/api/v2/committee-memberships?candidacy_mandate=${mostRecentMandate.id}`;
                const committeeResult = await fetchAWRelatedDataItem(committeesUrl, `Ausschussmitgliedschaften für Mandat ${mostRecentMandate.id}`, politicianId);
                if (committeeResult.data && committeeResult.data.length > 0) aggregatedCommitteesData.push(...committeeResult.data);
                if (committeeResult.error && !committeesError) committeesError = committeeResult.error;
                if (committeeResult.aw_status && (committeesAwStatus === undefined || committeeResult.aw_status !== 404)) committeesAwStatus = committeeResult.aw_status;
                else if (committeeResult.aw_status === 404 && committeesAwStatus === undefined) committeesAwStatus = 404;

                const votesUrl = `https://www.abgeordnetenwatch.de/api/v2/votes?mandate=${mostRecentMandate.id}`;
                const voteResult = await fetchAWRelatedDataItem(votesUrl, `Abstimmungen für Mandat ${mostRecentMandate.id}`, politicianId, true);
                if (voteResult.data && voteResult.data.length > 0) aggregatedVotesData.push(...voteResult.data);
                if (voteResult.error && !votesError) votesError = voteResult.error;
                if (voteResult.aw_status && (votesAwStatus === undefined || voteResult.aw_status !== 404)) votesAwStatus = voteResult.aw_status;
                else if (voteResult.aw_status === 404 && votesAwStatus === undefined) votesAwStatus = 404;

                if (fetchSideJobsSeparately) {
                    const sideJobsUrl = `https://www.abgeordnetenwatch.de/api/v2/side-jobs?candidacy_mandate=${mostRecentMandate.id}`;
                    const sideJobResult = await fetchAWRelatedDataItem(sideJobsUrl, `Nebentätigkeiten für Mandat ${mostRecentMandate.id}`, politicianId);
                    if (sideJobResult.data && sideJobResult.data.length > 0) aggregatedSideJobsData.push(...sideJobResult.data);
                    if (sideJobResult.error && !sideJobsError) sideJobsError = sideJobResult.error;
                    if (sideJobResult.aw_status && (sideJobsAwStatus === undefined || sideJobResult.aw_status !== 404)) sideJobsAwStatus = sideJobResult.aw_status;
                    else if (sideJobResult.aw_status === 404 && sideJobsAwStatus === undefined) sideJobsAwStatus = 404;
                }
            } else {
                console.log(`[DEBUG] fetchSeparate: No valid mandates found for processing.`);
            }
        }
    } else {
        console.log(`[DEBUG] fetchSeparate: No mandates found for politician ${politicianId} in mandatesList to fetch related data from.`);
        committeesAwStatus = 404;
        votesAwStatus = 404;
        if (fetchSideJobsSeparately) sideJobsAwStatus = 404;
    }

    mainPoliticianData.related_data.committee_memberships_wrapped = {
        data: aggregatedCommitteesData,
        error: committeesError,
        aw_status: committeesError ? committeesError.status : (aggregatedCommitteesData.length > 0 ? 200 : committeesAwStatus || 404)
    };

    mainPoliticianData.related_data.votes_wrapped = {
        data: aggregatedVotesData,
        error: votesError,
        aw_status: votesError ? votesError.status : (aggregatedVotesData.length > 0 ? 200 : votesAwStatus || 404)
    };

    if (fetchSideJobsSeparately) {
        mainPoliticianData.related_data.side_jobs_wrapped = {
            data: aggregatedSideJobsData,
            error: sideJobsError,
            aw_status: sideJobsError ? sideJobsError.status : (aggregatedSideJobsData.length > 0 ? 200 : sideJobsAwStatus || 404)
        };
    } 
    
    console.log(`[DEBUG] fetchSeparate: Final committee_memberships_wrapped for ${politicianId} (items: ${aggregatedCommitteesData.length}, status: ${mainPoliticianData.related_data.committee_memberships_wrapped.aw_status}, error: ${!!committeesError})`);
    console.log(`[DEBUG] fetchSeparate: Final votes_wrapped for ${politicianId} (items: ${aggregatedVotesData.length}, status: ${mainPoliticianData.related_data.votes_wrapped.aw_status}, error: ${!!votesError})`);
    if (mainPoliticianData.related_data.side_jobs_wrapped) {
         console.log(`[DEBUG] fetchSeparate: Final side_jobs_wrapped for ${politicianId} (items: ${mainPoliticianData.related_data.side_jobs_wrapped.data?.length || 0}, status: ${mainPoliticianData.related_data.side_jobs_wrapped.aw_status}, error: ${!!mainPoliticianData.related_data.side_jobs_wrapped.error})`);
    } else {
        console.log(`[DEBUG] fetchSeparate: side_jobs_wrapped was not populated for ${politicianId} (likely because fetchSideJobsSeparately was false and embedding failed or was empty).`);
    }

    return {
        candidacies_mandates_wrapped: mainPoliticianData.related_data.all_candidacies_mandates || { data: [] }, // Return the AW-like object
        committee_memberships_wrapped: mainPoliticianData.related_data.committee_memberships_wrapped,
        side_jobs_wrapped: mainPoliticianData.related_data.side_jobs_wrapped,
        votes_wrapped: mainPoliticianData.related_data.votes_wrapped
    };
} 
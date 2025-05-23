"use client";
import { PageLayout } from "@/components/page-layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toast, ToastAction } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { FaWikipediaW } from "react-icons/fa";
import { FaExternalLinkAlt } from "react-icons/fa";
import { BiSolidBuildings } from "react-icons/bi";
import { ImEarth } from "react-icons/im";
import PdfGenerator from '@/components/ui/PdfGenerator';
import { PDFDocument, rgb } from 'pdf-lib';

interface Parliament {
  id: string; // API uses string IDs for parliaments sometimes, e.g. "5"
  label: string;
}

// New interface for wrapping related data with error/status info
interface RelatedDataWrapper<T> {
  data: T[];
  error?: {
    status: number;
    message: string;
  };
  aw_status?: number; // To specifically track Abgeordnetenwatch's direct status
}

// Define specific types for related data items
interface Committee {
  id: number;
  name: string;
  role?: string;
}
interface SideJob {
  id: string;
  label: string;
  organization?: string;
  category?: string;
}
interface Vote {
  id: string;
  topic: string;
  decision: string;
  date?: string;
  pollId?: string;
  abgeordnetenwatch_url?: string; // Added for linking to the actual webpage
}

// Updated Politician interface for detailed view
interface Politician {
  id: number;
  label: string; // Name
  profile_image_url?: string; // For the face image
  image_attribution?: string; // Add attribution for the image
  age?: number | null;
  year_of_birth?: string;
  birth_date?: string;
  parliament_period?: { // This structure is often present in search results too
    id: number;
    label: string; // e.g., "19. Legislaturperiode"
    parliament: {
      id: number; // Crucial for knowing which parliament this period belongs to
      label: string; // e.g., "Bundestag"
    };
  };
  fraction_membership?: Array<{ // Could be multiple over time, usually show current
    id: number;
    fraction: {
      id: number;
      label: string; // Fraction name
    };
    // valid_from, valid_until might be useful if available
  }>;
  constituency?: {
    id: number;
    name:string; // Constituency name
    // number?: string; // Constituency number if available
  };
  committees_wrapped?: RelatedDataWrapper<Committee>;
  side_jobs_wrapped?: RelatedDataWrapper<SideJob>;
  votes_wrapped?: RelatedDataWrapper<Vote>;

  // Keep original fields for simplicity if direct data is ever restored, but prefer _wrapped
  committees?: Committee[];
  side_jobs?: SideJob[];
  votes?: Vote[];
  // Add other fields from Abgeordnetenwatch API as needed
  // e.g., party, vita, etc.
  party?: {
    id: number;
    label: string;
  };
  // Field for profile image from Abgeordnetenwatch
  square_picture_url?: string; 
  // Field for main mandate information (often most relevant)
  current_mandate?: any; // This will be from related_data.candidacies_mandates, processed
  wikipediaControversiesHtml?: string; // For Wikipedia controversies
  wikipediaPoliticalPositionsHtml?: string; // New field for political positions
  wikipediaPageUrl?: string; // Optional: URL to the Wikipedia page
  website?: string; // Add this field for personal websites
}

// Define a type for mandate objects to fix the implicit any type errors
interface Mandate {
  id?: number | string;
  type?: string;
  label?: string;
  electoral_data?: {
    constituency?: {
      id: number | string;
      label?: string;
      name?: string;
    };
    mandate_type?: string;
  };
  constituency?: {
    id: number | string;
    label?: string;
    name?: string;
  };
  wahlkreis?: {
    id: number | string;
    label?: string;
    name?: string;
  };
  electoral_district?: {
    constituency?: {
      id: number | string;
      label?: string;
      name?: string;
    };
  };
  parliament_period?: {
    id: number | string;
    label?: string;
    parliament?: {
      id: number | string;
      label?: string;
    };
  };
  fraction_membership?: any;
  party?: any;
}

// API call to our backend
async function searchPoliticians(name: string): Promise<Politician[]> {
  if (!name || name.length < 3) return [];
  try {
    const response = await fetch(`/api/politicians?name=${encodeURIComponent(name)}`);
    if (!response.ok) {
      console.error("Error fetching search results from backend:", response.status, await response.text());
      return [];
    }
    const apiResponse = await response.json();
    // Abgeordnetenwatch API typically wraps results in a 'data' field.
    // Our proxy at /api/politicians should ideally forward this structure.
    return apiResponse.data || [];
  } catch (error) {
    console.error("Failed to search politicians via backend:", error);
    return [];
  }
}

// Function to fetch detailed data for a selected politician
async function fetchPoliticianDetails(id: number, name: string, parliamentId?: string | number): Promise<Politician | null> {
  try {
    let apiUrl = `/api/politicians/${id}`;
    if (parliamentId) {
      apiUrl += `?parliamentId=${parliamentId}`;
    }
    console.log(`[DEBUG] Fetching politician details from: ${apiUrl}`);
    const awResponse = await fetch(apiUrl);
    if (!awResponse.ok) {
      console.error(`Error fetching details for politician ID ${id} (parliament ${parliamentId}) from backend:`, awResponse.status, await awResponse.text());
      return null;
    }
    const awApiResponse = await awResponse.json();
    const rawData = awApiResponse.data; 

    // DEBUGGING: Log the rawData and candidacies_mandates received by the frontend
    console.log("[DEBUG] Raw data for politician:", id, JSON.stringify(rawData, null, 2));
    if (rawData && awApiResponse.related_data) {
      console.log("[DEBUG] All Candidacies/Mandates received:", JSON.stringify(awApiResponse.related_data.candidacies_mandates_wrapped, null, 2));
    }

    if (!rawData) {
      console.error(`No data object found for politician ID ${id} in API response.`);
      return null;
    }

    // Attempt to find the most relevant mandate from the list
    const currentMandates = awApiResponse.related_data?.candidacies_mandates_wrapped?.data || 
                           rawData.related_data?.all_candidacies_mandates || 
                           [];
    let currentMandateToUse = null;

    if (currentMandates && currentMandates.length > 0) {
      // Find the first item that is an actual mandate, not just a candidacy
      // Prefer mandates from a "legislature" type parliament_period if possible
      currentMandateToUse = 
        currentMandates.find((m: any) => m.type === 'mandate' && m.parliament_period?.type === 'legislature') ||
        currentMandates.find((m: any) => m.type === 'mandate') ||
        currentMandates[0]; // Fallback to the first item if no specific mandate found

       console.log("[DEBUG] Using currentMandateToUse:", JSON.stringify(currentMandateToUse, null, 2));
       // Specific log for fraction data
       if (currentMandateToUse && currentMandateToUse.fraction_membership) {
         console.log("[DEBUG] currentMandateToUse.fraction_membership:", JSON.stringify(currentMandateToUse.fraction_membership, null, 2));
       } else {
         console.log("[DEBUG] currentMandateToUse has no fraction_membership field.");
       }
    }

    // Extract parliament period data, ensuring we get the proper nested data
    const parliamentPeriod = currentMandateToUse?.parliament_period || 
                            rawData.parliament_period || 
                            rawData.current_parliament_period ||
                            // Fallback: extract from the first mandate if available
                            (currentMandates && currentMandates.length > 0 ? currentMandates[0].parliament_period : null);
    
    // Extract fraction data - check multiple possible locations
    const fractionMembership = currentMandateToUse?.fraction_membership || 
                              rawData.fraction_membership || 
                              (rawData.related_data?.fraction_membership?.data || []);
    
    // Extract constituency data from electoral_data in mandate
    console.log("[DEBUG] Checking for constituency data...");
    let constituency = undefined;
    try {
      // Log the current mandate structure for debugging
      if (currentMandateToUse) {
        console.log("[DEBUG] currentMandateToUse structure:", JSON.stringify({
          id: currentMandateToUse.id,
          type: currentMandateToUse.type,
          label: currentMandateToUse.label,
          hasElectoralData: !!currentMandateToUse.electoral_data,
          electoralDataStructure: currentMandateToUse.electoral_data ? {
            hasConstituency: !!currentMandateToUse.electoral_data.constituency,
            constituencyData: currentMandateToUse.electoral_data.constituency
          } : null
        }, null, 2));
      }

      // Primary extraction: Try currentMandateToUse first
      if (currentMandateToUse?.electoral_data?.constituency) {
        const constituencyData = currentMandateToUse.electoral_data.constituency;
        constituency = {
          id: constituencyData.id,
          name: cleanConstituencyName(constituencyData.label || constituencyData.name || `Wahlkreis ${constituencyData.id}`)
        };
        console.log("[DEBUG] ✅ Found constituency in currentMandateToUse:", JSON.stringify(constituency, null, 2));
      } 
      // Secondary: Try rawData
      else if (rawData.electoral_data?.constituency) {
        const constituencyData = rawData.electoral_data.constituency;
        constituency = {
          id: constituencyData.id,
          name: cleanConstituencyName(constituencyData.label || constituencyData.name || `Wahlkreis ${constituencyData.id}`)
        };
        console.log("[DEBUG] ✅ Found constituency in rawData:", JSON.stringify(constituency, null, 2));
      } 
      // Tertiary: Search through ALL mandates systematically
      else {
        console.log("[DEBUG] Primary sources failed, searching through all mandates...");
        const allMandates = currentMandates; // Use the same corrected source
        console.log(`[DEBUG] Total mandates to check: ${allMandates.length}`);
        
        for (let i = 0; i < allMandates.length; i++) {
          const mandate = allMandates[i];
          console.log(`[DEBUG] Checking mandate ${i + 1}/${allMandates.length}:`, JSON.stringify({
            id: mandate.id,
            type: mandate.type,
            label: mandate.label,
            hasElectoralData: !!mandate.electoral_data,
            hasConstituency: !!mandate.electoral_data?.constituency
          }, null, 2));
          
          if (mandate.electoral_data?.constituency) {
            const constituencyData = mandate.electoral_data.constituency;
            constituency = {
              id: constituencyData.id,
              name: cleanConstituencyName(constituencyData.label || constituencyData.name || `Wahlkreis ${constituencyData.id}`)
            };
            console.log(`[DEBUG] ✅ Found constituency in mandate ${i + 1}:`, JSON.stringify(constituency, null, 2));
            break; // Stop at first found
          }
        }
        
        // Last resort: Try direct constituency fields on any object
        if (!constituency) {
          console.log("[DEBUG] Still no constituency found, trying direct fields...");
          
          // Check rawData directly
          if (rawData.constituency) {
            constituency = {
              id: rawData.constituency.id || 0,
              name: cleanConstituencyName(rawData.constituency.label || rawData.constituency.name || `Wahlkreis`)
            };
            console.log("[DEBUG] ✅ Found constituency directly on rawData:", JSON.stringify(constituency, null, 2));
          }
          // Check currentMandateToUse directly
          else if (currentMandateToUse?.constituency) {
            constituency = {
              id: currentMandateToUse.constituency.id || 0,
              name: cleanConstituencyName(currentMandateToUse.constituency.label || currentMandateToUse.constituency.name || `Wahlkreis`)
            };
            console.log("[DEBUG] ✅ Found constituency directly on currentMandateToUse:", JSON.stringify(constituency, null, 2));
          }
          // Check for alternative field names
          else {
            for (const mandate of allMandates) {
              if (mandate.constituency || mandate.wahlkreis) {
                const constituencyData = mandate.constituency || mandate.wahlkreis;
                constituency = {
                  id: constituencyData.id || 0,
                  name: cleanConstituencyName(constituencyData.label || constituencyData.name || `Wahlkreis`)
                };
                console.log("[DEBUG] ✅ Found constituency through alternative fields:", JSON.stringify(constituency, null, 2));
                break;
              }
            }
          }
        }
      }
      
      // Final result logging
      if (constituency) {
        console.log("[DEBUG] 🎉 FINAL CONSTITUENCY RESULT:", JSON.stringify(constituency, null, 2));
      } else {
        console.log("[DEBUG] ❌ NO CONSTITUENCY FOUND AFTER ALL ATTEMPTS");
        console.log("[DEBUG] Raw data keys:", Object.keys(rawData));
        console.log("[DEBUG] Related data keys:", Object.keys(awApiResponse.related_data || {}));
      }
      
    } catch (error) {
      console.error("Error extracting constituency data:", error);
    }

    // Calculate age if birth_date is available
    let age = null;
    if (rawData.year_of_birth) {
      const currentYear = new Date().getFullYear();
      age = currentYear - parseInt(rawData.year_of_birth);
      console.log(`[DEBUG] Calculated age ${age} from year_of_birth ${rawData.year_of_birth}`);
    }

    const mappedPolitician: Politician = {
      id: rawData.id,
      label: rawData.label,
      square_picture_url: rawData.square_picture_url,
      profile_image_url: rawData.square_picture_url || rawData.picture_url,
      image_attribution: rawData.image_attribution,
      age: age,
      year_of_birth: rawData.year_of_birth,
      birth_date: rawData.birth_date,

      // Ensure parliament_period has full nested structure with parliament
      parliament_period: parliamentPeriod 
        ? { 
            id: parliamentPeriod.id, 
            label: parliamentPeriod.label, 
            parliament: parliamentPeriod.parliament 
              ? { 
                  id: parliamentPeriod.parliament.id,
                  label: parliamentPeriod.parliament.label
                }
              : { id: 0, label: "N/A" } // Fallback if parliament is missing
          }
        : undefined,
      
      // Process fraction data
      fraction_membership: fractionMembership 
        ? (Array.isArray(fractionMembership) ? fractionMembership : [fractionMembership])
            .filter(fm => fm && fm.fraction) // Filter out invalid entries
        : [],
      
      // Process constituency data
      constituency: constituency,

      party: currentMandateToUse?.party || rawData.party, 

      // Map the wrapped structures
      committees_wrapped: awApiResponse.related_data?.committee_memberships_wrapped 
        ? {
            data: (awApiResponse.related_data.committee_memberships_wrapped.data || []).map((cm: any) => ({
                id: cm.id,
                name: cm.committee.label,
                role: cm.role_label,
            })),
            error: awApiResponse.related_data.committee_memberships_wrapped.error,
            aw_status: awApiResponse.related_data.committee_memberships_wrapped.aw_status,
        }
        : { data: [], aw_status: 404 },

      side_jobs_wrapped: awApiResponse.related_data?.side_jobs_wrapped
        ? {
            data: (awApiResponse.related_data.side_jobs_wrapped.data || []).map((sj: any, index: number) => ({
                id: sj.id || `sj-${index}`,
                label: sj.label,
                organization: sj.organization_name || sj.organisation_name,
                category: sj.category?.label || sj.category_label,
            })),
            error: awApiResponse.related_data.side_jobs_wrapped.error,
            aw_status: awApiResponse.related_data.side_jobs_wrapped.aw_status,
        }
        : { data: [], aw_status: 404 },

      votes_wrapped: awApiResponse.related_data?.votes_wrapped
        ? {
            data: (awApiResponse.related_data.votes_wrapped.data || []).map((vote: any, index: number) => {
              // According to the API docs, the vote field contains the actual voting decision
              const voteDecision = vote.vote || 'Keine Angabe';
              // Get the poll data
              const poll = vote.poll || {};
              
              // Check for dates in multiple possible locations
              const pollDate = poll.field_poll_date || poll.field_legislature?.field_poll_date || poll.date;
              
              // Get the webpage URL, fallback to API URL if not available
              const webpageUrl = poll.abgeordnetenwatch_url || 
                                `https://www.abgeordnetenwatch.de/bundestag/abstimmungen/${poll.id}`;

              return {
                id: poll.id || `vote-${index}`,
                topic: poll.label || 'Unbekanntes Thema',
                decision: voteDecision,
                date: pollDate,
                pollId: poll.id,
                abgeordnetenwatch_url: webpageUrl
              };
            }),
            error: awApiResponse.related_data.votes_wrapped.error,
            aw_status: awApiResponse.related_data.votes_wrapped.aw_status,
        }
        : { data: [], aw_status: 404 },

      // Populate the old fields for compatibility
      committees: awApiResponse.related_data?.committee_memberships_wrapped?.data?.map((cm: any) => ({
        id: cm.id,
        name: cm.committee.label,
        role: cm.role_label,
      })) || [],
      side_jobs: awApiResponse.related_data?.side_jobs_wrapped?.data?.map((sj: any, index: number) => ({
        id: sj.id || `sj-${index}`,
        label: sj.label,
        organization: sj.organization_name || sj.organisation_name,
        category: sj.category?.label || sj.category_label,
      })) || [],
      votes: awApiResponse.related_data?.votes_wrapped?.data?.map((vote: any, index: number) => {
        // According to the API docs, the vote field contains the actual voting decision
        const voteDecision = vote.vote || 'Keine Angabe';
        // Get the poll data
        const poll = vote.poll || {};
        
        // Check for dates in multiple possible locations
        const pollDate = poll.field_poll_date || poll.field_legislature?.field_poll_date || poll.date;
        
        // Get the webpage URL, fallback to API URL if not available
        const webpageUrl = poll.abgeordnetenwatch_url || 
                          `https://www.abgeordnetenwatch.de/bundestag/abstimmungen/${poll.id}`;

        return {
          id: poll.id || `vote-${index}`,
          topic: poll.label || 'Unbekanntes Thema',
          decision: voteDecision,
          date: pollDate,
          pollId: poll.id,
          abgeordnetenwatch_url: webpageUrl
        };
      }) || [],

      current_mandate: currentMandateToUse,
      wikipediaControversiesHtml: undefined, // Will be fetched next
      wikipediaPoliticalPositionsHtml: undefined, // New field for political positions
      website: undefined, // Add this field for personal websites
    };
    
    // Fetch Wikipedia data (existing logic)
    try {
      const wikiResponse = await fetch(`/api/wikipedia?name=${encodeURIComponent(name)}`);
      if (wikiResponse.ok) {
        const wikiData = await wikiResponse.json();
        mappedPolitician.wikipediaControversiesHtml = wikiData.htmlContent;
        mappedPolitician.wikipediaPoliticalPositionsHtml = wikiData.politicalPositionsHtml; // Store positions separately
      } else {
        console.warn("Could not fetch Wikipedia data:", wikiResponse.status, await wikiResponse.text());
      }
    } catch (wikiError) {
      console.warn("Error during Wikipedia data fetch:", wikiError);
    }

    // After mapping the politician data, check if we have an image
    if (!mappedPolitician.profile_image_url) {
      // No image from Abgeordnetenwatch, try to get from Wikipedia
      try {
        const wikiImageResponse = await fetch(`/api/wikipedia?name=${encodeURIComponent(name)}&getImage=true`);
        if (wikiImageResponse.ok) {
          const wikiData = await wikiImageResponse.json();
          if (wikiData.image && wikiData.image.imageUrl) {
            mappedPolitician.profile_image_url = wikiData.image.imageUrl;
            mappedPolitician.image_attribution = wikiData.image.attribution;
            console.log("Found Wikipedia image:", wikiData.image.imageUrl);
          }
          mappedPolitician.wikipediaControversiesHtml = wikiData.htmlContent;
          mappedPolitician.wikipediaPoliticalPositionsHtml = wikiData.politicalPositionsHtml;
        } else {
          console.warn("Could not fetch Wikipedia data:", wikiImageResponse.status, await wikiImageResponse.text());
        }
      } catch (wikiError) {
        console.warn("Error during Wikipedia data fetch:", wikiError);
      }
    } else {
      // We have an image from Abgeordnetenwatch, but still need to fetch controversy content
      try {
        const wikiResponse = await fetch(`/api/wikipedia?name=${encodeURIComponent(name)}`);
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          mappedPolitician.wikipediaControversiesHtml = wikiData.htmlContent;
          mappedPolitician.wikipediaPoliticalPositionsHtml = wikiData.politicalPositionsHtml;
        } else {
          console.warn("Could not fetch Wikipedia data:", wikiResponse.status, await wikiResponse.text());
        }
      } catch (wikiError) {
        console.warn("Error during Wikipedia data fetch:", wikiError);
      }
    }

    // Add website support in fetchPoliticianDetails - look for it in the politician data
    if (rawData.contact_information?.website) {
      mappedPolitician.website = rawData.contact_information.website;
      console.log(`[DEBUG] Found website URL: ${mappedPolitician.website}`);
    } else if (currentMandateToUse?.contact_information?.website) {
      mappedPolitician.website = currentMandateToUse.contact_information.website;
      console.log(`[DEBUG] Found website URL in mandate: ${mappedPolitician.website}`);
    }

    return mappedPolitician;

  } catch (error) {
    console.error(`Failed to fetch or map details for politician ID ${id}:`, error);
    return null;
  }
}

const SearchResultsListSkeleton = () => (
  <Card className="max-w-xl">
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </CardContent>
  </Card>
);

const PoliticianCardSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-8 w-3/4 mb-2" />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="w-32 h-32 md:w-48 md:h-48 rounded flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/6" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>
      <div>
        <Skeleton className="h-6 w-1/3 mb-3" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-full" />
      </div>
      <Separator />
      <div>
        <Skeleton className="h-6 w-1/3 mb-3" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Separator />
      <div>
        <Skeleton className="h-6 w-1/3 mb-3" />
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

// Helper function to clean constituency name by removing parentheses and content
function cleanConstituencyName(name: string): string {
  if (!name) return name;
  // Remove everything from the first opening parenthesis onwards
  const cleanedName = name.split('(')[0].trim();
  return cleanedName;
}

// Helper function to format date strings
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

// Helper to convert vote string to display text
function getVoteDisplayText(vote: string): string {
  switch (vote.toLowerCase()) {
    case 'yes':
      return 'Ja';
    case 'no':
      return 'Nein';
    case 'abstain':
      return 'Enthaltung';
    case 'no_show':
    case 'no-show':
      return 'Nicht anwesend';
    default:
      return vote;
  }
}

// Add a helper function to get party color
function getPartyColor(partyLabel: string | undefined): string {
  if (!partyLabel) return '';
  
  const normalizedLabel = partyLabel.toUpperCase();
  
  if (normalizedLabel.includes('FDP')) return 'yellow';
  if (normalizedLabel.includes('CDU')) return 'black';
  if (normalizedLabel.includes('AFD')) return 'brown';
  if (normalizedLabel.includes('SPD')) return 'red';
  if (normalizedLabel.includes('LINKE')) return 'red';
  if (normalizedLabel.includes('GRÜNE') || normalizedLabel.includes('GRUENE')) return 'green';
  if (normalizedLabel.includes('BSW')) return 'purple';
  if (normalizedLabel.includes('CSU')) return 'black';
  
  return '';
}

// Add a function to get the shadow class based on party
function getPartyShadowClass(partyLabel: string | undefined): string {
  const color = getPartyColor(partyLabel);
  
  switch (color) {
    case 'yellow': return 'shadow-[0_0_15px_rgba(255,215,0,0.5)]';
    case 'black': return 'shadow-[0_0_15px_rgba(0,0,0,0.5)]';
    case 'brown': return 'shadow-[0_0_15px_rgba(165,42,42,0.5)]';
    case 'red': return 'shadow-[0_0_15px_rgba(255,0,0,0.5)]';
    case 'green': return 'shadow-[0_0_15px_rgba(0,128,0,0.5)]';
    case 'purple': return 'shadow-[0_0_15px_rgba(128,0,128,0.5)]';
    default: return 'shadow-md';
  }
}

// Add a debug function to inspect party data
function debugPartyInfo(politician: Politician) {
  console.log("[PARTY DEBUG] Politician:", politician.label);
  console.log("[PARTY DEBUG] Party:", JSON.stringify(politician.party, null, 2));
  console.log("[PARTY DEBUG] Fractions:", JSON.stringify(politician.fraction_membership, null, 2));
  
  // Normalize party and fraction labels for consistent testing
  const partyLabel = politician.party?.label?.toLowerCase() || '';
  const fractionLabels = (politician.fraction_membership || [])
    .map(fm => (fm.fraction?.label || '').toLowerCase());
  
  console.log("[PARTY DEBUG] Normalized party label:", partyLabel);
  console.log("[PARTY DEBUG] Normalized fraction labels:", fractionLabels);
  
  // Test for DIE LINKE
  const isLinke = 
    partyLabel.includes("linke") ||
    fractionLabels.some(label => label.includes("linke"));
  
  console.log("[PARTY DEBUG] Is LINKE (test):", isLinke);
  return isLinke;
}

// Add a function to get border color class based on party
function getPartyBorderClass(partyLabel: string | undefined): string {
  const color = getPartyColor(partyLabel);
  
  switch (color) {
    case 'yellow': return 'border-yellow-400 border-4';
    case 'black': return 'border-black border-4';
    case 'brown': return 'border-amber-800 border-4';
    case 'red': return 'border-red-600 border-4';
    case 'green': return 'border-green-600 border-4';
    case 'purple': return 'border-purple-600 border-4';
    default: return 'border-gray-300 border-2';
  }
}

// Add a function to determine social media and other external links
function getSocialMediaLinks(politician: Politician): { type: string; url: string; icon: string }[] {
  const links: { type: string; url: string; icon: string }[] = [];

  // Wikipedia link
  if (politician.wikipediaPageUrl) {
    links.push({
      type: 'Wikipedia',
      url: politician.wikipediaPageUrl,
      icon: 'globe'
    });
  }
  
  // If we have additional links in the future, add them here
  // For example, if we had Twitter, Facebook, etc.
  /*
  if (politician.twitter) {
    links.push({
      type: 'Twitter',
      url: politician.twitter,
      icon: 'twitter'
    });
  }
  */
  
  return links;
}

export default function GegnerRecherchePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Politician[]>([]);
  const [selectedPolitician, setSelectedPolitician] = useState<Politician | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  
  // Dossier generation state
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [dossierProgress, setDossierProgress] = useState(0);
  const [dossierStatus, setDossierStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
  const [dossierData, setDossierData] = useState<{ pdfData: string; filename: string } | null>(null);
  
  const { toast } = useToast();

  // Add a direct toast trigger function that doesn't rely on effect scheduling
  const showLinkeToast = useCallback(() => {
    console.log("[TOAST DEBUG] Showing DIE LINKE toast directly");
    toast({
      title: "👁️ Tschekisten-Alarm",
      description: "Die Zeiten, in denen wir Genoss:innen ausspionieren, ist vorbei. Liebe Grüße aus dem Büro der Genossin Fraktionsvorsitzenden",
      variant: "destructive",
      className: "bg-red-600 text-white border-none",
      duration: 5000,
    });
  }, [toast]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      setIsLoadingSearch(true);
      setSelectedPolitician(null);
      setSearchResults([]);
      const delayDebounceFn = setTimeout(() => {
        searchPoliticians(searchTerm)
          .then(data => setSearchResults(data))
          .catch(error => { console.error("Error fetching politicians:", error); setSearchResults([]); })
          .finally(() => setIsLoadingSearch(false));
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setIsLoadingSearch(false);
    }
  }, [searchTerm]);

  const handleSelectPolitician = async (politicianBrief: Politician) => {
    console.log("[FRONTEND_DEBUG] Politician selected from search (politicianBrief object):", JSON.stringify(politicianBrief, null, 2));
    
    // Check if the politician from search results is already DIE LINKE
    // Use simpler, more direct string matching instead of complex conditions
    const briefPartyLabel = politicianBrief.party?.label?.toLowerCase() || '';
    const briefFractionLabels = (politicianBrief.fraction_membership || [])
      .map(fm => (fm.fraction?.label || '').toLowerCase());
    
    const isLinke = 
      briefPartyLabel.includes("linke") ||
      briefFractionLabels.some(label => label.includes("linke"));
    
    if (isLinke) {
      console.log("[FRONTEND_DEBUG] DIE LINKE politician detected in search results");
      showLinkeToast();
    }
    
    setIsLoadingDetails(true);
    setSelectedPolitician(null); // Clear previous selection
    
    const parliamentIdForDetails = politicianBrief.parliament_period?.parliament?.id;
    if (parliamentIdForDetails) {
        console.log(`[FRONTEND_DEBUG] Extracted parliamentId ${parliamentIdForDetails} from search result for ${politicianBrief.label}`);
    } else {
        console.warn(`[FRONTEND_DEBUG] Could not extract parliamentId from search result for ${politicianBrief.label}. Backend will use default.`);
    }

    const details = await fetchPoliticianDetails(politicianBrief.id, politicianBrief.label, parliamentIdForDetails);
    
    if (details) {
      console.log("[FRONTEND_DEBUG] Politician details fetched successfully");
      
      // Always run the debug function to check party data
      const isDetailedLinke = debugPartyInfo(details);
      
      // Show toast for DIE LINKE even if we already detected it in search results
      // This ensures the toast is shown regardless of where we find the party info
      if (isDetailedLinke) {
        console.log("[FRONTEND_DEBUG] DIE LINKE politician confirmed in detailed results");
        // Call the toast directly
        showLinkeToast();
      }
      
      setSelectedPolitician(details);
    } else {
      // Fallback for error cases
      setSelectedPolitician({
        id: politicianBrief.id,
        label: politicianBrief.label,
        square_picture_url: politicianBrief.square_picture_url,
        committees_wrapped: { data: [], error: { status: 500, message: "Details konnten nicht geladen werden." } },
        side_jobs_wrapped: { data: [], error: { status: 500, message: "Details konnten nicht geladen werden." } },
        votes_wrapped: { data: [], error: { status: 500, message: "Details konnten nicht geladen werden." } },
      });
    }
    setSearchResults([]); // Clear search results after selection
    setSearchTerm(""); // Clear search term
    setIsLoadingDetails(false);
  };

  const handleGeneratePdf = async () => {
    if (!selectedPolitician) {
      toast({
        title: "Fehler",
        description: "Kein Politiker ausgewählt",
        variant: "destructive"
      });
      return;
    }

    setIsDossierLoading(true);
    setDossierStatus('generating');
    setDossierProgress(0);
    setDossierData(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setDossierProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 2000);

      const response = await fetch('/api/dossier/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          politicianName: selectedPolitician.label,
          partyAffiliation: selectedPolitician.party?.label
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler bei der Dossier-Erstellung');
      }

      const data = await response.json();
      
      // Complete the progress bar
      setDossierProgress(100);
      
      setDossierData({
        pdfData: data.pdfData,
        filename: data.filename
      });
      setDossierStatus('completed');
      
      toast({
        title: "✅ Dossier erstellt",
        description: data.message || `Das Dossier für ${selectedPolitician.label} wurde erfolgreich erstellt.`,
        variant: "default",
        duration: 5000
      });

    } catch (error) {
      console.error('Error generating dossier:', error);
      setDossierStatus('error');
      setDossierProgress(0);
      
      toast({
        title: "❌ Fehler bei der Dossier-Erstellung",
        description: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten",
        variant: "destructive",
        duration: 7000
      });
    } finally {
      setIsDossierLoading(false);
    }
  };

  const handleDownloadDossier = () => {
    if (!dossierData) return;

    try {
      // Convert base64 to blob
      const byteCharacters = atob(dossierData.pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = dossierData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download gestartet",
        description: "Das Dossier wird heruntergeladen.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error downloading dossier:', error);
      toast({
        title: "Download-Fehler",
        description: "Das Dossier konnte nicht heruntergeladen werden.",
        variant: "destructive"
      });
    }
  };

  return (
    <PageLayout title="Gegner-Recherche" description="Du hast ein Podium oder einen Fernsehauftritt? Hier kannst du dir zu Abgeordneten auf Landes-, Bundes- oder Europa-Ebene kurze Einschätzungen anzeigen lassen. Wenn du ein detaillierteres Dossier mit Angriffspunkten anfertigen lassen möchtest, kannst du das hier auch erledigen.">
      <div className="space-y-6">
        <Input
          type="search"
          placeholder="Namen des Politikers eingeben..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xl"
          disabled={isLoadingDetails}
        />

        {isLoadingSearch && <SearchResultsListSkeleton />}

        {!isLoadingSearch && searchResults.length > 0 && !selectedPolitician && (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Suchergebnisse</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {searchResults.map((politician) => (
                  <li key={politician.id}>
                    <button
                      onClick={() => handleSelectPolitician(politician)}
                      className="text-blue-600 hover:underline w-full text-left p-2 hover:bg-gray-100 rounded"
                      disabled={isLoadingDetails}
                    >
                      {politician.label}
                      {politician.party && <span className="text-sm text-gray-600 ml-2">({politician.party.label})</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {isLoadingDetails && <PoliticianCardSkeleton />}

        {!isLoadingDetails && selectedPolitician && (
          <Card className="w-full shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">{selectedPolitician.label}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPolitician.wikipediaControversiesHtml ? (
                // Two-column layout if Wikipedia data exists
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left Column: Abgeordnetenwatch Info (65%) */}
                  <div className="w-full md:w-[65%] space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
                        {selectedPolitician.profile_image_url ? (
                          <div className="relative h-full">
                            <img 
                              src={selectedPolitician.profile_image_url} 
                              alt={`Portrait von ${selectedPolitician.label}`} 
                              className={`rounded object-cover w-full h-full ${getPartyBorderClass(selectedPolitician.party?.label)}`}
                            />
                            {selectedPolitician.image_attribution && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 rounded-b">
                                <span className="text-[8px] text-gray-300 block text-center">
                                  {selectedPolitician.image_attribution}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`w-full h-full bg-gray-300 rounded flex items-center justify-center ${getPartyBorderClass(selectedPolitician.party?.label)}`}>
                            <span className="text-gray-500">Kein Bild</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p><strong>Name:</strong> {selectedPolitician.label}</p>
                        {selectedPolitician.age && <p><strong>Alter:</strong> {selectedPolitician.age} Jahre</p>}
                        <p><strong>Partei:</strong> {selectedPolitician.party?.label || 'N/A'}</p>
                        {/* <p><strong>Parlament:</strong> {selectedPolitician.parliament_period?.parliament.label || 'N/A'}</p> */}
                        <p><strong>Fraktion:</strong> {selectedPolitician.fraction_membership?.[0]?.fraction.label || 'N/A'}</p>
                        <p><strong>Wahlkreis:</strong> {selectedPolitician.constituency?.name || 'N/A'}</p>
                      </div>
                    </div>

                    <Separator />
                    <h3 className="text-xl font-semibold mb-4">Infos zur aktuellen Legislatur</h3>

                    <div>
                      <h4 className="text-lg font-semibold mb-2">Ausschüsse</h4>
                      {selectedPolitician.committees_wrapped?.error ? (
                        <p className="text-red-600">{selectedPolitician.committees_wrapped.error.message}</p>
                      ) : selectedPolitician.committees_wrapped?.data && selectedPolitician.committees_wrapped.data.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {selectedPolitician.committees_wrapped.data.map(committee => (
                            <li key={committee.id}>{committee.name} {committee.role && `(${committee.role})`}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>Keine Ausschussmitgliedschaften bekannt.</p>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Nebentätigkeiten</h4>
                      {selectedPolitician.side_jobs_wrapped?.error ? (
                        <p className="text-red-600">{selectedPolitician.side_jobs_wrapped.error.message}</p>
                      ) : selectedPolitician.side_jobs_wrapped?.data && selectedPolitician.side_jobs_wrapped.data.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedPolitician.side_jobs_wrapped.data.map(job => (
                            <li key={job.id} className="p-2 border rounded">
                              <p><strong>Tätigkeit:</strong> {job.label}</p>
                              {job.organization && <p><strong>Organisation:</strong> {job.organization}</p>}
                              {job.category && <p><strong>Kategorie:</strong> {job.category}</p>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Keine Nebentätigkeiten bekannt.</p>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Abstimmungsverhalten</h4>
                      {selectedPolitician.votes_wrapped?.error ? (
                        <p className="text-red-600">{selectedPolitician.votes_wrapped.error.message}</p>
                      ) : selectedPolitician.votes_wrapped?.data && selectedPolitician.votes_wrapped.data.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedPolitician.votes_wrapped.data.map(vote => (
                            <li key={vote.id} className="p-3 border rounded hover:bg-gray-50 transition-colors cursor-pointer" 
                                onClick={() => vote.abgeordnetenwatch_url ? window.open(vote.abgeordnetenwatch_url, '_blank') : null}>
                              <div className="flex justify-between items-start">
                                <p className="font-medium">{vote.topic}</p>
                                {vote.date && <p className="text-sm text-gray-600 whitespace-nowrap ml-2">{formatDate(vote.date)}</p>}
                              </div>
                              <div className="mt-2 flex items-center">
                                <span className="font-semibold mr-2">Entscheidung:</span>
                                {vote.decision === 'yes' && (
                                  <span className="text-green-600 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {getVoteDisplayText(vote.decision)}
                                  </span>
                                )}
                                {vote.decision === 'no' && (
                                  <span className="text-red-600 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    {getVoteDisplayText(vote.decision)}
                                  </span>
                                )}
                                {vote.decision === 'abstain' && (
                                  <span className="text-gray-500 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {getVoteDisplayText(vote.decision)}
                                  </span>
                                )}
                                {(vote.decision === 'no_show' || vote.decision === 'no-show') && (
                                  <span className="text-gray-400 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                    </svg>
                                    {getVoteDisplayText(vote.decision)}
                                  </span>
                                )}
                                {(vote.decision !== 'yes' && vote.decision !== 'no' && vote.decision !== 'abstain' && vote.decision !== 'no_show' && vote.decision !== 'no-show') && (
                                  <span className="text-gray-500">{getVoteDisplayText(vote.decision)}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Kein Abstimmungsverhalten bekannt.</p>
                      )}
                    </div>

                    {selectedPolitician.wikipediaPoliticalPositionsHtml && (
                      <>
                        <Separator />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Positionen über die Jahre</h3>
                          <div 
                            dangerouslySetInnerHTML={{ __html: selectedPolitician.wikipediaPoliticalPositionsHtml }} 
                            className="prose prose-sm dark:prose-invert max-w-none overflow-auto pr-2 prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Vertical Divider - visible on md screens and up */} 
                  <div className="hidden md:block w-px bg-gray-300 dark:bg-gray-700 self-stretch"></div>
                  {/* Horizontal Divider - visible on small screens */} 
                  <Separator className="md:hidden" />

                  {/* Right Column: Wikipedia Info (35%) */}
                  <div className="w-full md:w-[35%] space-y-4">
                    <h3 className="text-xl font-semibold">Kontroversen & Kritik (Wikipedia)</h3>
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedPolitician.wikipediaControversiesHtml }} 
                      className="prose prose-sm dark:prose-invert max-w-none overflow-auto pr-2 prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600"
                    />
                  </div>
                </div>
              ) : (
                // Single-column layout if no Wikipedia data
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
                      {selectedPolitician.profile_image_url ? (
                        <div className="relative h-full">
                          <img 
                            src={selectedPolitician.profile_image_url} 
                            alt={`Portrait von ${selectedPolitician.label}`} 
                            className={`rounded object-cover w-full h-full ${getPartyBorderClass(selectedPolitician.party?.label)}`}
                          />
                          {selectedPolitician.image_attribution && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1 rounded-b">
                              <span className="text-[8px] text-gray-300 block text-center">
                                {selectedPolitician.image_attribution}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`w-full h-full bg-gray-300 rounded flex items-center justify-center ${getPartyBorderClass(selectedPolitician.party?.label)}`}>
                          <span className="text-gray-500">Kein Bild</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p><strong>Name:</strong> {selectedPolitician.label}</p>
                      {selectedPolitician.age && <p><strong>Alter:</strong> {selectedPolitician.age} Jahre</p>}
                      <p><strong>Partei:</strong> {selectedPolitician.party?.label || 'N/A'}</p>
                      {/* <p><strong>Parlament:</strong> {selectedPolitician.parliament_period?.parliament.label || 'N/A'}</p> */}
                      <p><strong>Fraktion:</strong> {selectedPolitician.fraction_membership?.[0]?.fraction.label || 'N/A'}</p>
                      <p><strong>Wahlkreis:</strong> {selectedPolitician.constituency?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <Separator />
                  <h3 className="text-xl font-semibold mb-4">Infos zur aktuellen Legislatur</h3>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Ausschüsse</h4>
                    {selectedPolitician.committees_wrapped?.error ? (
                      <p className="text-red-600">{selectedPolitician.committees_wrapped.error.message}</p>
                    ) : selectedPolitician.committees_wrapped?.data && selectedPolitician.committees_wrapped.data.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {selectedPolitician.committees_wrapped.data.map(committee => (
                          <li key={committee.id}>{committee.name} {committee.role && `(${committee.role})`}</li>
                        ))}
                      </ul>
                    ) : (
                      <p>Keine Ausschussmitgliedschaften bekannt.</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Nebentätigkeiten</h4>
                    {selectedPolitician.side_jobs_wrapped?.error ? (
                      <p className="text-red-600">{selectedPolitician.side_jobs_wrapped.error.message}</p>
                    ) : selectedPolitician.side_jobs_wrapped?.data && selectedPolitician.side_jobs_wrapped.data.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedPolitician.side_jobs_wrapped.data.map(job => (
                          <li key={job.id} className="p-2 border rounded">
                            <p><strong>Tätigkeit:</strong> {job.label}</p>
                            {job.organization && <p><strong>Organisation:</strong> {job.organization}</p>}
                            {job.category && <p><strong>Kategorie:</strong> {job.category}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Keine Nebentätigkeiten bekannt.</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Abstimmungsverhalten</h4>
                    {selectedPolitician.votes_wrapped?.error ? (
                      <p className="text-red-600">{selectedPolitician.votes_wrapped.error.message}</p>
                    ) : selectedPolitician.votes_wrapped?.data && selectedPolitician.votes_wrapped.data.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedPolitician.votes_wrapped.data.map(vote => (
                          <li key={vote.id} className="p-3 border rounded hover:bg-gray-50 transition-colors cursor-pointer" 
                              onClick={() => vote.abgeordnetenwatch_url ? window.open(vote.abgeordnetenwatch_url, '_blank') : null}>
                            <div className="flex justify-between items-start">
                              <p className="font-medium">{vote.topic}</p>
                              {vote.date && <p className="text-sm text-gray-600 whitespace-nowrap ml-2">{formatDate(vote.date)}</p>}
                            </div>
                            <div className="mt-2 flex items-center">
                              <span className="font-semibold mr-2">Entscheidung:</span>
                              {vote.decision === 'yes' && (
                                <span className="text-green-600 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  {getVoteDisplayText(vote.decision)}
                                </span>
                              )}
                              {vote.decision === 'no' && (
                                <span className="text-red-600 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  {getVoteDisplayText(vote.decision)}
                                </span>
                              )}
                              {vote.decision === 'abstain' && (
                                <span className="text-gray-500 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {getVoteDisplayText(vote.decision)}
                                </span>
                              )}
                              {(vote.decision === 'no_show' || vote.decision === 'no-show') && (
                                <span className="text-gray-400 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                  </svg>
                                  {getVoteDisplayText(vote.decision)}
                                </span>
                              )}
                              {(vote.decision !== 'yes' && vote.decision !== 'no' && vote.decision !== 'abstain' && vote.decision !== 'no_show' && vote.decision !== 'no-show') && (
                                <span className="text-gray-500">{getVoteDisplayText(vote.decision)}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Kein Abstimmungsverhalten bekannt.</p>
                    )}
                  </div>
                  <Separator />
                  {selectedPolitician.wikipediaPoliticalPositionsHtml && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-2">Positionen über die Jahre</h3>
                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedPolitician.wikipediaPoliticalPositionsHtml }} 
                        className="prose prose-sm dark:prose-invert max-w-none overflow-auto pr-2 prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Add the bottom section with links and "Create Dossier" button */}
              <Separator className="my-6" />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Weiterführende Infos:</h3>
                  <div className="flex space-x-3">
                    {/* Wikipedia link with proper icon */}
                    <a 
                      href={`https://de.wikipedia.org/wiki/${encodeURIComponent(selectedPolitician.label)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      title="Wikipedia"
                    >
                      <FaWikipediaW className="w-5 h-5" />
                    </a>
                    
                    {/* Bundestag profile link with building icon */}
                    {selectedPolitician.parliament_period?.parliament.label === "Bundestag" && (
                      <a 
                        href={`https://www.bundestag.de/abgeordnete/biografien/${selectedPolitician.label.toLowerCase().replace(/\s+/g, '-')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Bundestag Profil"
                      >
                        <BiSolidBuildings className="w-5 h-5" />
                      </a>
                    )}
                    
                    {/* Abgeordnetenwatch profile link with external link icon */}
                    <a 
                      href={`https://www.abgeordnetenwatch.de/profile/${selectedPolitician.id}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      title="Abgeordnetenwatch Profil"
                    >
                      <FaExternalLinkAlt className="w-4 h-4" />
                    </a>
                    
                    {/* Add website link if available */}
                    {selectedPolitician.website && (
                      <a 
                        href={selectedPolitician.website}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        title="Persönliche Website"
                      >
                        <ImEarth className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
                
                {/* Dossier generation section */}
                <div className="flex flex-col items-end gap-3">
                  {isDossierLoading && (
                    <div className="w-64">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Dossier wird erstellt...</span>
                        <span>{Math.round(dossierProgress)}%</span>
                      </div>
                      <Progress value={dossierProgress} className="h-2" />
                    </div>
                  )}
                  
                  {dossierStatus === 'completed' && dossierData ? (
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                        onClick={handleDownloadDossier}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m5-8a2 2 0 00-2-2H5a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V6z" />
                        </svg>
                        Dossier herunterladen
                      </button>
                      <button
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                        onClick={handleGeneratePdf}
                        disabled={isDossierLoading}
                      >
                        Neues Dossier erstellen
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`px-4 py-2 rounded-md transition-colors font-medium ${
                        dossierStatus === 'error' 
                          ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                      onClick={handleGeneratePdf}
                      disabled={isDossierLoading}
                    >
                      {isDossierLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Wird erstellt...
                        </span>
                      ) : dossierStatus === 'error' ? (
                        'Erneut versuchen'
                      ) : (
                        'Komplettes Dossier erstellen'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoadingSearch && !isLoadingDetails && searchTerm.length > 2 && searchResults.length === 0 && !selectedPolitician && (
          <p>Keine Ergebnisse für "{searchTerm}" gefunden.</p>
        )}

        {!selectedPolitician && !isLoadingSearch && !isLoadingDetails && searchTerm.length <= 2 && searchResults.length === 0 && (
           <p>Bitte gib mindestens 3 Zeichen ein, um die Suche nach einem/einer Abgeordneten zu starten.</p>
        )}

        <Toaster />
      </div>
    </PageLayout>
  );
} 
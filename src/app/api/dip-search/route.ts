import { NextRequest, NextResponse } from 'next/server';

const DIP_BASE_URL = 'https://search.dip.bundestag.de/api/v1';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const filters = searchParams.get('f');
    const num = searchParams.get('num') || '20';
    const start = searchParams.get('start') || '0';

    if (!query) {
      return NextResponse.json({ 
        success: false, 
        error: 'Suchbegriff ist erforderlich' 
      }, { status: 400 });
    }

    // Parse filters
    let parsedFilters: any = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (e) {
        console.error('Failed to parse filters:', e);
      }
    }

    // Build search parameters for DIP API
    const dipParams = new URLSearchParams({
      q: query,
      num: num,
      start: start,
      format: 'json'
    });

    // Add filters to the DIP API call
    if (parsedFilters.documentType && parsedFilters.documentType !== '') {
      dipParams.append('entitaet', parsedFilters.documentType);
    }
    
    if (parsedFilters.wahlperiode && parsedFilters.wahlperiode !== '') {
      dipParams.append('wahlperiode', parsedFilters.wahlperiode);
    }

    if (parsedFilters.dateFrom && parsedFilters.dateFrom !== '') {
      dipParams.append('datum.start', parsedFilters.dateFrom);
    }

    if (parsedFilters.dateTo && parsedFilters.dateTo !== '') {
      dipParams.append('datum.end', parsedFilters.dateTo);
    }

    if (parsedFilters.urheber && parsedFilters.urheber !== '') {
      dipParams.append('urheber', parsedFilters.urheber);
    }

    console.log('DIP API URL:', `${DIP_BASE_URL}/search?${dipParams.toString()}`);

    // Make request to DIP API
    const response = await fetch(`${DIP_BASE_URL}/search?${dipParams.toString()}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MdB-App/1.0'
      }
    });

    if (!response.ok) {
      console.error('DIP API error:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        error: `DIP API Fehler: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const dipData = await response.json();
    console.log('DIP API response:', dipData);

    // Transform the response to match our interface
    const transformedDocuments = dipData.documents?.map((doc: any) => ({
      id: doc.id || '',
      title: doc.titel || doc.title || 'Ohne Titel',
      subtitle: doc.untertitel || doc.subtitle,
      documentType: doc.typ || doc.documentType || 'Unbekannt',
      date: doc.datum || doc.date || '',
      drucksachetyp: doc.drucksachetyp,
      nummer: doc.nummer || doc.number,
      wahlperiode: doc.wahlperiode,
      herausgeber: doc.herausgeber,
      fundstelle: doc.fundstelle,
      urheber: doc.urheber || [],
      bearbeitet: doc.bearbeitet,
      aktualisiert: doc.aktualisiert
    })) || [];

    return NextResponse.json({
      success: true,
      documents: transformedDocuments,
      numFound: dipData.numFound || 0,
      start: dipData.start || 0,
      num: dipData.num || 20
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({
      success: false,
      error: 'Interner Serverfehler beim Durchsuchen der Dokumente'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

const DIP_BASE_URL = 'https://search.dip.bundestag.de/api/v1';
// API key from environment variable (.env.local)
// To get a personal API key, email: infoline.id3@bundestag.de
const DIP_API_KEY = process.env.DIP_API_KEY;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const filters = searchParams.get('f');
    const num = searchParams.get('num') || '20';
    const start = searchParams.get('start') || '0';

    if (!DIP_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'DIP API-Schlüssel nicht konfiguriert. Bitte DIP_API_KEY in .env.local hinzufügen.'
      }, { status: 500 });
    }

    let parsedFilters: any = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (e) {
        console.error('Failed to parse filters:', e);
      }
    }

    let apiPath = '/drucksache-text';
    let isDrucksacheSearch = true;

    if (parsedFilters.documentType === 'Plenarprotokoll') {
      apiPath = '/plenarprotokoll-text';
      isDrucksacheSearch = false;
    } else if (parsedFilters.documentType === 'Drucksache') {
      // apiPath is already '/drucksache-text'
      // isDrucksacheSearch is already true
    }

    const dipParams = new URLSearchParams({
      rows: num,
      offset: start,
      format: 'json',
      apikey: DIP_API_KEY
    });

    if (query) {
      dipParams.append('f.titel', query);
    }
    
    if (parsedFilters.wahlperiode && parsedFilters.wahlperiode !== '') {
      dipParams.append('f.wahlperiode', parsedFilters.wahlperiode);
    }

    if (parsedFilters.dateFrom && parsedFilters.dateFrom !== '') {
      dipParams.append('f.datum.start', parsedFilters.dateFrom);
    }

    if (parsedFilters.dateTo && parsedFilters.dateTo !== '') {
      dipParams.append('f.datum.end', parsedFilters.dateTo);
    }

    if (isDrucksacheSearch && parsedFilters.urheber && parsedFilters.urheber !== '') {
      dipParams.append('f.urheber', parsedFilters.urheber);
    }

    const apiUrl = `${DIP_BASE_URL}${apiPath}?${dipParams.toString()}`;
    console.log('DIP API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MdB-App/1.0'
      }
    });

    if (!response.ok) {
      console.error('DIP API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('DIP API raw error response:', errorText);
      
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'API-Schlüssel ungültig oder abgelaufen. Bitte wenden Sie sich an infoline.id3@bundestag.de für einen neuen Schlüssel.'
        }, { status: 401 });
      }
      
      return NextResponse.json({
        success: false,
        error: `DIP API Fehler: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const responseText = await response.text();
    console.log('DIP API raw response:', responseText);

    let dipData;
    try {
      dipData = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse DIP API response as JSON:', jsonError);
      console.error('DIP API raw response that failed parsing:', responseText);
      return NextResponse.json({
        success: false,
        error: 'Fehler beim Verarbeiten der DIP API Antwort'
      }, { status: 500 });
    }
    
    console.log('DIP API parsed response:', dipData);

    const transformedDocuments = dipData.documents?.map((doc: any) => ({
      id: doc.id || '',
      title: doc.titel || doc.title || 'Ohne Titel',
      subtitle: doc.untertitel || doc.subtitle,
      documentType: doc.dokumentart || doc.typ || 'Unbekannt',
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
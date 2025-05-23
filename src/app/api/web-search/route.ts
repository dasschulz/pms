import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    console.log('Web search request received:', { query });
    
    if (!query) {
      console.log('No query provided');
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Check if Tavily API key is available
    const tavilyKey = process.env.TAVILY_API_KEY;
    console.log('Tavily API key status:', tavilyKey ? 'Present' : 'Missing');
    console.log('Tavily API key length:', tavilyKey?.length || 0);
    console.log('Tavily API key prefix:', tavilyKey?.substring(0, 10) || 'N/A');

    // Use Tavily API for real web search
    if (tavilyKey) {
      try {
        console.log('Calling Tavily API for query:', query);
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tavilyKey}`
          },
          body: JSON.stringify({
            query: query,
            topic: 'news',
            search_depth: 'advanced',
            max_results: 8,
            time_range: 'month',
            include_answer: false,
            include_raw_content: false,
            include_images: false,
            include_domains: [
              'bundestag.de', 
              'abgeordnetenwatch.de', 
              'spiegel.de', 
              'zeit.de', 
              'faz.net', 
              'tagesschau.de', 
              'sueddeutsche.de', 
              'welt.de',
              'dw.com',
              'taz.de',
              'deutschlandfunk.de',
              'fragdenstaat.org',
              'derfreitag.de',
              'jungewelt.de',
              'nd-online.de',
              'news.google.com',
              'jacobin.de',
              'jungle.world',
              'surplusmagazin.de',
              'nd-aktuell.de',
              'rnd.de',
              'uebermedien.de'
            ]
          })
        });
        
        console.log('Tavily response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Tavily search successful, results count:', data.results?.length || 0);
          return NextResponse.json({ 
            query: query,
            results: data.results || [],
            source: 'tavily'
          });
        } else {
          const errorText = await response.text();
          console.error('Tavily API error:', response.status, response.statusText, errorText);
        }
      } catch (tavilyError) {
        console.error('Tavily API fetch error:', tavilyError);
      }
    }

    // Fallback to placeholder results if Tavily fails or isn't configured
    console.log('Using fallback placeholder results');
    const searchResults = {
      query: query,
      results: [
        {
          title: `Recherche-Hinweis: ${query}`,
          snippet: `HINWEIS: Dies sind Platzhalter-Ergebnisse. Für eine vollständige Recherche zu "${query}" sollten aktuelle Nachrichten, Pressemitteilungen und politische Datenbanken durchsucht werden.`,
          url: 'https://www.bundestag.de',
          description: 'Offizielle Informationen des Deutschen Bundestags'
        },
        {
          title: `Empfohlene Quellen für ${query}`,
          snippet: 'Bundestag.de, Abgeordnetenwatch.de, aktuelle Medienberichte. Eine detaillierte Faktenprobung ist erforderlich.',
          url: 'https://www.abgeordnetenwatch.de',
          description: 'Politische Transparenz-Plattform'
        }
      ],
      source: 'fallback'
    };

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      query: '',
      results: [],
      source: 'error'
    }, { status: 500 });
  }
} 
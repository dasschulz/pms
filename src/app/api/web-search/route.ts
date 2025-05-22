import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Use Tavily API for real web search
    if (process.env.TAVILY_API_KEY) {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Api-Key': process.env.TAVILY_API_KEY
          },
          body: JSON.stringify({
            query: query,
            search_depth: 'basic',
            include_answer: false,
            include_raw_content: false,
            max_results: 5,
            include_domains: ['bundestag.de', 'abgeordnetenwatch.de', 'spiegel.de', 'zeit.de', 'faz.net', 'tagesschau.de', 'sueddeutsche.de', 'welt.de']
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({ 
            query: query,
            results: data.results || []
          });
        } else {
          console.error('Tavily API error:', response.status, response.statusText);
        }
      } catch (tavilyError) {
        console.error('Tavily API fetch error:', tavilyError);
      }
    }

    // Fallback to placeholder results if Tavily fails or isn't configured
    const searchResults = {
      query: query,
      results: [
        {
          title: `${query} - Aktuelle Nachrichten und Informationen`,
          snippet: `Recherche-Ergebnisse für: ${query}. Für aktuelle und vollständige Informationen konsultieren Sie bitte offizielle Quellen wie Bundestag.de, Abgeordnetenwatch.de und aktuelle Medienberichte.`,
          url: 'https://www.bundestag.de',
          description: 'Offizielle Informationen des Deutschen Bundestags'
        },
        {
          title: `${query} - Abgeordnetenwatch`,
          snippet: 'Transparenz und Bürgernähe in der Politik. Informationen zu Abstimmungsverhalten und politischen Positionen.',
          url: 'https://www.abgeordnetenwatch.de',
          description: 'Politische Transparenz-Plattform'
        }
      ]
    };

    return NextResponse.json(searchResults);

  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      query: '',
      results: []
    }, { status: 500 });
  }
} 
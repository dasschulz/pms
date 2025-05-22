import { NextResponse } from "next/server";
// import Parser from "rss-parser"; // No longer needed
// import { JSDOM } from 'jsdom'; // No longer needed

// const parser = new Parser(); // No longer needed

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  console.log("Received query for /api/news:", query);
  // clientPage is used to determine if we need the nextPageCursor, but NewsData.io's 'page' is a cursor itself.
  // const clientPage = parseInt(searchParams.get("page") || "1", 10); 
  const nextPageCursor = searchParams.get("nextPageCursor"); // Get cursor from client
  // clientLimit is not directly used for NewsData.io fetch, as it returns its own batch size (usually 10)
  // const clientLimit = parseInt(searchParams.get("limit") || "6", 10); 

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    console.error("NEWSDATA_API_KEY is not set in .env.local");
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  let newsDataUrl = `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(query)}&image=1`;
  if (nextPageCursor) {
    newsDataUrl += `&page=${nextPageCursor}`;
  }
  console.log("Fetching from NewsData.io URL:", newsDataUrl);

  try {
    const response = await fetch(newsDataUrl);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown error from NewsData.io" }));
      console.error(`NewsData.io API error: ${response.status}`, errorData);
      return NextResponse.json({ error: `Failed to fetch news from NewsData.io: ${errorData.message || response.statusText}` }, { status: response.status });
    }

    const newsData = await response.json();
    console.log("NewsData.io raw response:", newsData); 

    if (newsData.status !== "success") {
      console.error("NewsData.io API returned non-success status:", newsData);
      return NextResponse.json({ error: "Failed to retrieve news, API indicated an issue." }, { status: 500 });
    }

    const results = newsData.results || [];
    const totalResults = newsData.totalResults || 0;
    const nextPage = newsData.nextPage || null;

    const items = results.map((article: any) => {
      return {
        id: article.article_id || Math.random().toString(),
        title: article.title || "",
        link: article.link || "",
        source: article.source_id || (article.source_url ? new URL(article.source_url).hostname : ""),
        source_icon: article.source_icon || null,
        imageUrl: article.image_url || null, 
        snippet: article.description || "",
        fullContent: article.content || article.description || "",
        date: article.pubDate || "",
        politicalArea: "", 
        type: "person" as const, 
      };
    });

    return NextResponse.json({
      items: items, // Ensure items is always an array
      totalItems: totalResults, // Ensure totalItems is always a number
      nextPageCursor: nextPage // Ensure nextPageCursor is always string|null
    });

  } catch (error: any) {
    console.error("Error fetching or processing news from NewsData.io:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch news" }, { status: 500 });
  }
} 

import Parser from 'rss-parser';

// For the dev page, define a loose type to capture any possible fields
interface DevRssItem {
  [key: string]: any; // Allow any properties
  // We can still list common ones for easier access if needed, but they are all optional by default
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  enclosure?: { url?: string; type?: string; length?: string | number; [key: string]: any };
  itunes?: any;
  'media:group'?: any;
}

const parser = new Parser(); // Use a standard parser instance

async function getFirstRssItem(query: string): Promise<DevRssItem | null> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=de&gl=DE&ceid=DE:de`;
  try {
    const feed = await parser.parseURL(rssUrl);
    if (feed.items && feed.items.length > 0) {
      // Cast the first item to our loose DevRssItem type
      return feed.items[0] as unknown as DevRssItem;
    }
    return null;
  } catch (error) {
    console.error("Error fetching or parsing RSS feed:", error);
    return null;
  }
}

export default async function DevPage() {
  const query = "Heidi Reichinnek";
  const firstItem = await getFirstRssItem(query);

  if (!firstItem) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>RSS Item Inspector</h1>
        <p>No items found for query: &quot;{query}&quot; or an error occurred.</p>
      </div>
    );
  }

  // All properties of firstItem will be iterated and stringified if objects
  const displayItem: { [key: string]: string } = {};
  for (const key in firstItem) {
    if (Object.prototype.hasOwnProperty.call(firstItem, key)) {
      const value = firstItem[key];
      if (typeof value === 'object' && value !== null) {
        displayItem[key] = JSON.stringify(value, null, 2);
      } else {
        displayItem[key] = String(value); // Handles string, number, boolean, undefined, null
      }
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>RSS Item Inspector</h1>
      <p>Showing the first raw item from Google News RSS for query: <strong>&quot;{query}&quot;</strong></p>
      <hr style={{ margin: '20px 0' }} />
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2', width: '20%' }}>Key</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(displayItem).map(([key, value]) => (
            <tr key={key}>
              <td style={{ border: '1px solid #ddd', padding: '8px', verticalAlign: 'top' }}><strong>{key}</strong></td>
              <td style={{ border: '1px solid #ddd', padding: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 
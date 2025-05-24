export async function GET() {
  try {
    const response = await fetch('https://api.hutt.io/bt-to/json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching Bundestag data:', error);
    return Response.json(
      { error: 'Failed to fetch Bundestag data' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lastName = searchParams.get('lastName');
  
  if (!lastName) {
    return NextResponse.json({ error: 'lastName parameter is required' }, { status: 400 });
  }

  // Generate the iframe HTML with proper styling for responsive embedding
  const iframeHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BPA-Fahrt Anmeldung - ${decodeURIComponent(lastName)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: transparent;
    }
    .embed-container {
      width: 100%;
      min-height: 100vh;
      border: none;
      display: block;
    }
    .embed-info {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 14px;
    }
    .embed-button {
      display: inline-block;
      background: hsl(0 100% 50%);
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin-top: 10px;
      transition: all 0.2s ease;
    }
    .embed-button:hover {
      background: hsl(0 80% 45%);
      transform: translateY(-1px);
    }
  </style>
</head>
<body>
  <div class="embed-info">
    <h2>BPA-Fahrt Anmeldung</h2>
    <p>Für <strong>${decodeURIComponent(lastName)}</strong></p>
    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/bpa/${encodeURIComponent(lastName)}" 
       target="_blank" 
       rel="noopener noreferrer"
       class="embed-button">
      Zur Anmeldung →
    </a>
  </div>
  
  <script>
    // Auto-resize iframe when embedded
    function resizeIframe() {
      const height = document.documentElement.scrollHeight;
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'resize',
          height: height
        }, '*');
      }
    }
    
    // Initial resize
    resizeIframe();
    
    // Resize on content changes
    const observer = new ResizeObserver(resizeIframe);
    observer.observe(document.body);
    
    // Listen for window resize
    window.addEventListener('resize', resizeIframe);
  </script>
</body>
</html>`;

  return new NextResponse(iframeHtml, {
    headers: {
      'Content-Type': 'text/html',
      'X-Frame-Options': 'ALLOWALL', // Allow iframe embedding
      'Content-Security-Policy': "frame-ancestors *;" // Allow embedding from any domain
    }
  });
} 
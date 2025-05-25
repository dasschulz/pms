import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const externalUrl = searchParams.get('url');

  if (!externalUrl) {
    return new NextResponse('Missing audio URL', { status: 400 });
  }

  try {
    // Get range header from client request
    const range = request.headers.get('range');
    const headers: Record<string, string> = {};
    
    // Forward range header to external source if present
    if (range) {
      headers['Range'] = range;
    }

    const response = await fetch(externalUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return new NextResponse(`Failed to fetch audio from external source: ${response.status} ${response.statusText}`, {
        status: response.status,
      });
    }

    const audioStream = response.body;
    const responseHeaders = new Headers();
    
    // Copy important headers from the response
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    const acceptRanges = response.headers.get('accept-ranges');
    const contentRange = response.headers.get('content-range');

    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }
    if (acceptRanges) {
      responseHeaders.set('Accept-Ranges', acceptRanges);
    } else {
      // Enable range requests for audio files
      responseHeaders.set('Accept-Ranges', 'bytes');
    }
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    // Add CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range');

    if (!audioStream) {
        return new NextResponse('Audio stream not available from external source', { status: 500 });
    }
    
    // Use the same status code as the external response (206 for partial content, 200 for full)
    return new NextResponse(audioStream, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[AUDIO_FETCHER_ERROR]', error);
    let errorMessage = 'Internal Server Error while fetching audio';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return new NextResponse(errorMessage, { status: 500 });
  }
} 
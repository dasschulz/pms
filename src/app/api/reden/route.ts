import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name')?.trim();
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const dateFrom = searchParams.get('dateFrom')?.trim() || '2025-03-01';
  const parliament = searchParams.get('parliament')?.trim() || 'Bundestag';

  if (!name) {
    return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });
  }

  // Fetch person ID
  const peopleRes = await fetch(
    `https://de.openparliament.tv/api/v1/search/people?name=${encodeURIComponent(name)}`
  );
  if (!peopleRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch person info' }, { status: peopleRes.status });
  }
  const peopleJson = await peopleRes.json();
  const personEntry = Array.isArray(peopleJson.data) ? peopleJson.data[0] : peopleJson.data;
  if (!personEntry?.id) {
    return NextResponse.json({ error: 'Person not found' }, { status: 404 });
  }
  const personID = personEntry.id;

  // Fetch up to 60 speeches from external API
  const maxFetchSize = 60;
  const mediaUrl =
    `https://de.openparliament.tv/api/v1/search/media?` +
    `parliament=${encodeURIComponent(parliament)}` +
    `&personID=${encodeURIComponent(personID)}` +
    `&dateFrom=${encodeURIComponent(dateFrom)}` +
    `&page[number]=1&page[size]=${maxFetchSize}`;

  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch speeches' }, { status: mediaRes.status });
  }
  const mediaJson = await mediaRes.json();
  const allSpeeches = Array.isArray(mediaJson.data) ? mediaJson.data : [];

  // Simplify each speech: extract title, date, text, video URL and thumbnail
  const simplified = allSpeeches.map((entry: any) => {
    const { id, attributes, links } = entry;
    // Determine title
    const title = attributes.title || attributes.heading || `Rede ${id}`;
    // Date of speech
    const date = attributes.dateStart || '';
    // Fallback text (not used in UI by default)
    const text = attributes.text || '';
    // Try to find video URL (mp4 or HLS)
    let videoUrl = '';
    if (attributes.mediaUrls?.mp4) {
      videoUrl = attributes.mediaUrls.mp4;
    } else if (Array.isArray(attributes.media)) {
      const mp4 = attributes.media.find((m: any) => m.type === 'video/mp4' || m.url?.endsWith('.mp4'));
      if (mp4) videoUrl = mp4.url;
    }
    // Thumbnail image
    const thumbnail = attributes.mediaUrls?.thumbnail || attributes.imageUrl || attributes.thumbnail || '';
    // API link to full record
    const link = links?.self || '';
    return { id, title, date, text, videoUrl, thumbnail, link };
  });

  // Sort by newest first
  simplified.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Paginate server-side (6 per page, max 10 pages)
  const perPage = 6;
  const total = simplified.length;
  const maxPages = Math.min(10, Math.ceil(total / perPage));
  const page = Math.min(Math.max(pageParam, 1), maxPages);
  const start = (page - 1) * perPage;
  const paged = simplified.slice(start, start + perPage);

  // Enrich each paged entry with detailed media info
  const enriched = await Promise.all(paged.map(async (entry: any) => {
    try {
      const detailRes = await fetch(`https://de.openparliament.tv/api/v1/media/${entry.id}`);
      if (!detailRes.ok) return entry;
      const detailJson = await detailRes.json();
      const attr = detailJson.data?.attributes || {};
      
      // Extract and format transcript with timestamps from textContents
      let transcriptSentences: Array<{text: string, timeStart: number, timeEnd: number, speaker?: string}> = [];
      if (attr.textContents && Array.isArray(attr.textContents)) {
        // Extract sentences with timestamps from all textBody entries
        transcriptSentences = attr.textContents.flatMap((content: any) => {
          if (content.textBody && Array.isArray(content.textBody)) {
            return content.textBody.flatMap((body: any) => {
              if (body.sentences && Array.isArray(body.sentences) && body.type === 'speech') {
                // Extract speaker information if available
                const speaker = body.speaker?.label || content.speaker?.label || '';
                
                return body.sentences
                  .filter((sentence: any) => sentence.text && sentence.timeStart && sentence.timeEnd)
                  .map((sentence: any) => ({
                    text: sentence.text.trim(),
                    timeStart: parseFloat(sentence.timeStart),
                    timeEnd: parseFloat(sentence.timeEnd),
                    speaker: speaker
                  }));
              }
              return [];
            });
          }
          return [];
        });
      }
      
      // Create simple text version for backwards compatibility
      const transcriptText = transcriptSentences.map(s => s.text).join(' ');

      // Determine agenda item title (embedded)
      let agendaItemText = entry.title;
      const rel = detailJson.data?.relationships?.agendaItem?.data;
      if (rel?.attributes?.title) {
        agendaItemText = rel.attributes.title as string;
      }
      // Extract electoral period and session numbers
      const epNum = detailJson.data.relationships?.electoralPeriod?.data?.attributes?.number ?? null;
      const sessNum = detailJson.data.relationships?.session?.data?.attributes?.number ?? null;
      // Extract official title
      const officialTitle = rel?.attributes?.officialTitle ?? '';

      // Extract additional context information
      const electoralPeriod = detailJson.data.relationships?.electoralPeriod?.data?.attributes || {};
      const session = detailJson.data.relationships?.session?.data?.attributes || {};
      const agendaItem = detailJson.data.relationships?.agendaItem?.data?.attributes || {};
      
      // Extract documents information
      const documents = detailJson.data.relationships?.documents?.data || [];
      const documentsList = documents.map((doc: any) => ({
        id: doc.id,
        type: doc.type,
        title: doc.attributes?.title || doc.attributes?.label || `Document ${doc.id}`,
        abstract: doc.attributes?.abstract || '',
        link: doc.links?.self || ''
      }));

      // Extract context and topic information
      const context = attr.context || '';
      const topic = agendaItem.title || agendaItemText;

      return {
        ...entry,
        agendaItem: agendaItemText,
        creator: attr.creator || '',
        license: attr.license || '',
        videoFileURI: attr.videoFileURI || entry.videoUrl,
        audioFileURI: attr.audioFileURI || '',
        electoralPeriodNumber: epNum,
        sessionNumber: sessNum,
        officialTitle,
        // Extract transcript text from detailed API response
        text: transcriptText || attr.text || entry.text || '',
        // Include transcript sentences with timestamps
        transcriptSentences: transcriptSentences,
        // Include thumbnail URI from detailed response
        thumbnailURI: attr.thumbnailURI || entry.thumbnail || '',
        // Additional context information
        electoralPeriod: {
          number: electoralPeriod.number || epNum,
          label: electoralPeriod.label || `Wahlperiode ${epNum}`,
          dateStart: electoralPeriod.dateStart || '',
          dateEnd: electoralPeriod.dateEnd || ''
        },
        session: {
          number: session.number || sessNum,
          label: session.label || `${sessNum}. Sitzung`,
          date: session.date || entry.date,
          location: session.location || ''
        },
        topic: topic,
        context: context,
        documents: documentsList
      };
    } catch (err) {
      return entry;
    }
  }));

  return NextResponse.json({
    speeches: enriched,
    meta: { total, perPage, page, maxPages },
  });
} 
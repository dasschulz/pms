import { NextRequest, NextResponse } from 'next/server';
import { base } from '@/lib/airtable';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lastName = searchParams.get('lastName');

  if (!lastName) {
    return NextResponse.json({ error: 'Missing lastName parameter' }, { status: 400 });
  }

  try {
    // Airtable field names from airtable_schema.md for Users table:
    // Name: fldn4FHkZ4olSJPaB
    // UserID (autoNumber): fldkoW4SDfO07oggz
    // Wahlkreis: fldFJKZ7JTaH2vS10

    // We assume lastName is part of the 'Name' field. 
    // A more robust solution might involve a dedicated 'LastName' field or more complex searching.
    const records = await base('Users')
      .select({
        // Formula to find records where the 'Name' field contains the lastName.
        // Using FIND instead of CONTAINS (which doesn't exist in Airtable).
        // FIND returns the position if found, or an error if not found.
        // We use FIND(LOWER(lastName), LOWER(Name)) > 0 to check if the lastName exists in the Name field.
        filterByFormula: `FIND(LOWER("${lastName}"), LOWER({Name})) > 0`,
        fields: ['UserID', 'Name', 'Wahlkreis'], // Specify fields to retrieve
        maxRecords: 5, // Limit in case of multiple matches, frontend might need to handle this
      })
      .firstPage();

    if (records.length === 0) {
      return NextResponse.json({ error: 'MdB not found' }, { status: 404 });
    }

    // If multiple MdBs are found with a similar last name, this will return the first one.
    // The public form page might need a way to handle disambiguation if this is a common issue,
    // or the MdB could be instructed to use a more unique identifier if clashes occur.
    // For now, we return the first match.
    const mdb = records[0];

    return NextResponse.json({
      // Important: We need the Airtable Record ID for linking in other tables,
      // and the numeric UserID for other internal uses.
      airtableRecordId: mdb.id, // This is the Airtable record ID
      userIdNumeric: mdb.fields.UserID, // This is our numeric UserID
      name: mdb.fields.Name,
      wahlkreis: mdb.fields.Wahlkreis,
    });

  } catch (error) {
    console.error('[API bpa-public/mdb-details] Airtable Error:', error);
    return NextResponse.json({ error: 'Failed to fetch MdB details' }, { status: 500 });
  }
} 
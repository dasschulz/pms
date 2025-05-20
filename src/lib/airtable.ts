import Airtable from 'airtable';

// Configure Airtable using environment variables (set in .env.local)
Airtable.configure({ apiKey: process.env.AIRTABLE_PAT! });
export const base = Airtable.base(process.env.AIRTABLE_BASE_ID!);

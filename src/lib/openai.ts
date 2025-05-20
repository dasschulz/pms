import OpenAI from 'openai';

// Configure OpenAI client using environment variables (set in .env.local)
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({ apiKey }); 
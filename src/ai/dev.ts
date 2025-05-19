import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-minor-inquiry.ts';
import '@/ai/flows/generate-minor-inquiry.ts';
import '@/ai/flows/generate-press-release.ts';
import '@/ai/flows/generate-video-script.ts';
import '@/ai/flows/write-speech.ts';
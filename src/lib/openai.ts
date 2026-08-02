import OpenAI from 'openai';

// Retrieve environment variable safely
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

if (!apiKey || apiKey.includes('your-openai-api-key')) {
  console.warn(
    'StudyOS Warning: OpenAI API key is missing or unset. Please configure VITE_OPENAI_API_KEY in your .env.local file.'
  );
}

/**
 * OpenAI Client Configuration
 * Note: `dangerouslyAllowBrowser: true` is enabled for client-side prototyping.
 * For production, AI calls should pass through a backend server or Vercel Serverless Function to keep keys hidden.
 */
export const openai = new OpenAI({
  apiKey: apiKey || 'placeholder-key',
  dangerouslyAllowBrowser: true,
});

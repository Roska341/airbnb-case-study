/**
 * Anthropic Client Singleton
 *
 * Creates a single Anthropic client instance, cached in globalThis
 * to avoid creating multiple clients during Next.js hot-reloads in
 * development. In production, a single instance is created per
 * server process.
 */

import Anthropic from '@anthropic-ai/sdk';

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic };

export const anthropic =
  globalForAnthropic.anthropic ||
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForAnthropic.anthropic = anthropic;
}

/**
 * Sanitize user-provided text before interpolating into AI prompts.
 * Truncates to a safe length and strips patterns that could be used
 * for prompt injection (instruction overrides, role-play attempts).
 */
export function sanitizePromptInput(input: string, maxLength = 500): string {
  return input
    .slice(0, maxLength)
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|rules|prompts)/gi, '[removed]')
    .replace(/you\s+are\s+now/gi, '[removed]')
    .replace(/system\s*:/gi, '[removed]')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

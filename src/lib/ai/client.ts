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

#!/usr/bin/env node
/**
 * OpenRouter API test script — validates the configured OPENROUTER_API_KEY
 * by making a real chat completion call and verifying the response.
 *
 * Usage:
 *   node backend/scripts/test-openrouter.js
 *
 * Exit codes: 0 = pass, 1 = fail
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root (one level up from scripts/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL = process.env.LLM_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free';
const FALLBACK_MODEL = process.env.LLM_FALLBACK_MODEL || 'openai/gpt-oss-20b:free';
const ULTIMATE_FALLBACK = 'openrouter/free';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

if (!API_KEY) {
  console.error('FATAL: OPENROUTER_API_KEY is not set in .env or environment');
  process.exit(1);
}

function createClient() {
  return new OpenAI({
    baseURL: BASE_URL,
    apiKey: API_KEY,
    timeout: 30000,
    maxRetries: 0,
    defaultHeaders: {
      'HTTP-Referer': APP_URL,
      'X-OpenRouter-Title': 'Fitness_App',
    },
  });
}

async function testModel(client, model) {
  const startTime = Date.now();
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Reply with only the word OK if you are working.' },
    ],
    max_tokens: 50,
  });
  const elapsed = Date.now() - startTime;
  return { response, elapsed };
}

async function main() {
  console.log(`OpenRouter endpoint: ${BASE_URL}`);
  console.log(`Primary model: ${MODEL}`);
  if (FALLBACK_MODEL) console.log(`Fallback model: ${FALLBACK_MODEL}`);
  console.log('');

  const client = createClient();

  let usedModel = MODEL;
  let result;

  // Attempt primary model
  try {
    result = await testModel(client, usedModel);
  } catch (err) {
    console.error(`Primary model "${usedModel}" failed:`);
    console.error(`  ${err.message}`);
    console.error(`  Status: ${err.status || 'N/A'}`);

    // Try fallback model (always, per production `callLlmApi` behavior)
    if (FALLBACK_MODEL) {
      usedModel = FALLBACK_MODEL;
      console.log(`Retrying with fallback model "${usedModel}"...`);
      console.log('');
      try {
        result = await testModel(client, usedModel);
      } catch (fallbackErr) {
        console.error(`Fallback model "${usedModel}" also failed:`);
        console.error(`  ${fallbackErr.message}`);
        // Try ultimate fallback (openrouter/free router) to verify API key works
        usedModel = ULTIMATE_FALLBACK;
        console.log(`Retrying with ultimate fallback "${usedModel}"...`);
        console.log('');
        try {
          result = await testModel(client, usedModel);
        } catch (ultimateErr) {
          console.error(`Ultimate fallback "${usedModel}" also failed:`);
          console.error(`  ${ultimateErr.message}`);
          console.error('');
          console.error('OpenRouter test FAILED');
          process.exit(1);
        }
      }
    } else {
      // No fallback configured — try openrouter/free to verify API key
      usedModel = ULTIMATE_FALLBACK;
      console.log(`Retrying with "${usedModel}"...`);
      console.log('');
      try {
        result = await testModel(client, usedModel);
      } catch (ultimateErr) {
        console.error(`"${usedModel}" also failed:`);
        console.error(`  ${ultimateErr.message}`);
        console.error('');
        console.error('OpenRouter test FAILED');
        process.exit(1);
      }
    }
  }

  // Validate response structure
  const { response, elapsed } = result;
  const message = response.choices?.[0]?.message;
  let content = message?.content;

  // Handle reasoning models that put output in the `reasoning` field instead of `content`
  if (!content && message?.reasoning) {
    content = message.reasoning;
  }

  // Handle models that provide reasoning_details
  if (!content && message?.reasoning_details?.length) {
    content = message.reasoning_details.map(d => d.text).join('\n');
  }

  if (!content || content.trim().length === 0) {
    console.error('ERROR: Response content is empty');
    console.error(`  Model: ${response.model}`);
    console.error(`  Finish reason: ${response.choices?.[0]?.finish_reason}`);
    console.error(`  Message keys: ${Object.keys(message || {})}`);
    console.error('');
    console.error('OpenRouter test FAILED');
    process.exit(1);
  }

  // Success
  console.log(`OpenRouter responded with model "${usedModel}" in ${elapsed}ms`);
  console.log(`  Response: "${content.substring(0, 200).replace(/\n/g, '\\n')}"`);
  console.log('');
  console.log('OpenRouter test PASSED');
  process.exit(0);
}

main();

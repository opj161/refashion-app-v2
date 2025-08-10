// src/services/systemPrompt.service.ts

import * as settingsService from './settings.service';
import * as fs from 'fs/promises';
import path from 'path';

/**
 * Gets the system prompt, prioritizing database setting over file fallback
 * @returns The system prompt text
 */
export async function getSystemPrompt(): Promise<string> {
  // First try to get from database setting
  const dbPrompt = settingsService.getSetting('ai_prompt_engineer_system');
  
  if (dbPrompt && dbPrompt.trim()) {
    return dbPrompt;
  }
  
  // Fallback to file if database setting is empty
  try {
    const promptPath = path.join(process.cwd(), 'src/ai/prompts/prompt-engineer-system.txt');
    const filePrompt = await fs.readFile(promptPath, 'utf8');
    
    // If file has content but DB doesn't, optionally populate DB
    if (filePrompt.trim() && !dbPrompt.trim()) {
      console.log('Initializing database system prompt from file');
      settingsService.setSetting('ai_prompt_engineer_system', filePrompt);
    }
    
    return filePrompt;
  } catch (error) {
    console.error('Failed to load system prompt from file:', error);
    throw new Error('Could not load system prompt from database or file');
  }
}

/**
 * Updates the system prompt in the database
 * @param prompt The new system prompt text
 */
export function updateSystemPrompt(prompt: string): void {
  settingsService.setSetting('ai_prompt_engineer_system', prompt);
}

/**
 * Gets the current source of the system prompt for admin UI display
 * @returns 'database' | 'file' | 'none'
 */
export async function getSystemPromptSource(): Promise<'database' | 'file' | 'none'> {
  const dbPrompt = settingsService.getSetting('ai_prompt_engineer_system');
  
  if (dbPrompt && dbPrompt.trim()) {
    return 'database';
  }
  
  try {
    const promptPath = path.join(process.cwd(), 'src/ai/prompts/prompt-engineer-system.txt');
    const filePrompt = await fs.readFile(promptPath, 'utf8');
    return filePrompt.trim() ? 'file' : 'none';
  } catch {
    return 'none';
  }
}

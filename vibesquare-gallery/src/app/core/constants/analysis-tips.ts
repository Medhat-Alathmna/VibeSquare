/**
 * Analysis Tips - displayed during PRD generation
 * Tips rotate every 7 seconds to keep users engaged during waiting
 */

export const ANALYSIS_TIPS = [
  'You can download the PRD as Markdown to share with your team',
  'Use detail level "Comprehensive" for large-scale projects',
  'Cached results appear instantly to save you time',
  'Check confidence scores to gauge the quality of the analysis',
  'The "Both" type provides the most complete frontend and backend analysis',
  'You can access all your previous analyses from the History page',
  'Visual pipeline is ideal for design and interface projects',
  'Technical pipeline focuses on architecture and technical structure',
  'The built-in QA system automatically reviews specification quality',
  'You can copy specific sections of the PRD directly',
  'Comprehensive analysis saves your team time in the planning phase',
  'All your analyses are securely stored in your account'
];

/**
 * Get a random tip from the tips array
 */
export function getRandomTip(): string {
  return ANALYSIS_TIPS[Math.floor(Math.random() * ANALYSIS_TIPS.length)];
}

/**
 * Tip rotation interval in milliseconds (7 seconds)
 */
export const TIP_ROTATION_INTERVAL = 7000;

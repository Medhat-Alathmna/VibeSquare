export type LlmType = 'gpt-5' | 'opus-4.5' | 'gemini-3';

export interface LlmOption {
  value: LlmType;
  label: string;
  icon: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google';
  color: string;
}

export const LLM_OPTIONS: LlmOption[] = [
  {
    value: 'gpt-5',
    label: 'GPT 5',
    icon: 'openai',
    provider: 'OpenAI',
    color: '#10a37f'
  },
  {
    value: 'opus-4.5',
    label: 'Opus 4.5',
    icon: 'anthropic',
    provider: 'Anthropic',
    color: '#d4a574'
  },
  {
    value: 'gemini-3',
    label: 'Gemini 3',
    icon: 'google',
    provider: 'Google',
    color: '#4285f4'
  }
];

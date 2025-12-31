import { Component, input, output, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LlmDropdownComponent } from '../../../../shared/components/llm-dropdown/llm-dropdown.component';
import { LlmType } from '../../../../core/models/llm.model';

export interface SearchEvent {
  url: string;
  llmType: LlmType;
}

export interface RotatingWord {
  text: string;
  color: string;
}

@Component({
  selector: 'app-hero-search',
  standalone: true,
  imports: [CommonModule, FormsModule, LlmDropdownComponent],
  templateUrl: './hero-search.component.html',
  styleUrls: ['./hero-search.component.css']
})
export class HeroSearchComponent implements OnInit, OnDestroy {
  // Inputs
  placeholder = input<string>('Paste your website URL...');
  showSubtitle = input<boolean>(true);
  externalLoading = input<boolean>(false);

  // Outputs
  search = output<SearchEvent>();
  urlChange = output<string>();

  // Rotating words
  rotatingWords: RotatingWord[] = [
    { text: 'Prompt', color: '#17ffdc' },
    { text: 'Code', color: '#f472b6' },
    { text: 'Design', color: '#a78bfa' },
    { text: 'Visual Identity', color: '#fbbf24' }
  ];
  currentWordIndex = signal<number>(0);
  isAnimating = signal<boolean>(false);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  // Internal state
  urlInput = signal<string>('');
  selectedLlm = signal<LlmType>('opus-4.5');
  isLoading = signal<boolean>(false);

  // Computed
  isValidUrl = computed(() => this.validateUrl(this.urlInput()));
  currentWord = computed(() => this.rotatingWords[this.currentWordIndex()]);
  isDisabled = computed(() => this.isLoading() || this.externalLoading() || !this.isValidUrl());

  ngOnInit() {
    this.startWordRotation();
  }

  ngOnDestroy() {
    this.stopWordRotation();
  }

  private startWordRotation() {
    this.intervalId = setInterval(() => {
      this.isAnimating.set(true);
      setTimeout(() => {
        this.currentWordIndex.update(i => (i + 1) % this.rotatingWords.length);
        this.isAnimating.set(false);
      }, 200);
    }, 2000);
  }

  private stopWordRotation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  onUrlInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.urlInput.set(value);
    this.urlChange.emit(value);
  }

  onLlmChange(llmType: LlmType) {
    this.selectedLlm.set(llmType);
  }

  onAnalyze() {
    if (this.isValidUrl()) {
      this.search.emit({
        url: this.urlInput(),
        llmType: this.selectedLlm()
      });
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.isValidUrl()) {
      this.onAnalyze();
    }
  }

  private validateUrl(url: string): boolean {
    if (!url || url.trim().length === 0) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

import { Component, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LlmType, LlmOption, LLM_OPTIONS } from '../../../core/models/llm.model';

@Component({
  selector: 'app-llm-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './llm-dropdown.component.html',
  styleUrls: ['./llm-dropdown.component.css']
})
export class LlmDropdownComponent {
  // Input signal for selected value
  selectedValue = input<LlmType>('gpt-5');

  // Output signal for selection change
  selectionChange = output<LlmType>();

  // Local state
  isOpen = signal(false);

  // LLM options
  llmOptions: LlmOption[] = LLM_OPTIONS;

  get currentLlm(): LlmOption {
    return this.llmOptions.find(l => l.value === this.selectedValue()) || this.llmOptions[0];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.llm-dropdown')) {
      this.closeDropdown();
    }
  }

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  selectLlm(llmType: LlmType) {
    this.selectionChange.emit(llmType);
    this.isOpen.set(false);
  }

  closeDropdown() {
    this.isOpen.set(false);
  }
}

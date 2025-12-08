import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Prompt } from '../../../../core/models/project.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ClipboardService } from '../../../../core/services/clipboard.service';

@Component({
  selector: 'app-prompt-viewer',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './prompt-viewer.component.html',
  styleUrls: ['./prompt-viewer.component.css']
})
export class PromptViewerComponent {
  @Input() prompt!: Prompt;

  constructor(private clipboardService: ClipboardService) {}

  async copyPrompt() {
    await this.clipboardService.copyToClipboard(this.prompt.text);
  }
}

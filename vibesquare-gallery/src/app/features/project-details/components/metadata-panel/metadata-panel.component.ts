import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectWithBuilder } from '../../../../core/models/api-response.model';
import { TagChipComponent } from '../../../../shared/components/tag-chip/tag-chip.component';

@Component({
  selector: 'app-metadata-panel',
  standalone: true,
  imports: [CommonModule, TagChipComponent],
  templateUrl: './metadata-panel.component.html',
  styleUrls: ['./metadata-panel.component.css']
})
export class MetadataPanelComponent {
  @Input() project!: ProjectWithBuilder;

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  openSocialLink(url?: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }
}

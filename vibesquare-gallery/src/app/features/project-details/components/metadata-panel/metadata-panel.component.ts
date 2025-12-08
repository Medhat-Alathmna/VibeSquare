import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../core/models/project.model';
import { TagChipComponent } from '../../../../shared/components/tag-chip/tag-chip.component';

@Component({
  selector: 'app-metadata-panel',
  standalone: true,
  imports: [CommonModule, TagChipComponent],
  templateUrl: './metadata-panel.component.html',
  styleUrls: ['./metadata-panel.component.css']
})
export class MetadataPanelComponent {
  @Input() project!: Project;

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

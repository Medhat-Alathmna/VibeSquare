import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeFile } from '../../../../core/models/project.model';
import { CodeViewerComponent } from '../../../../shared/components/code-viewer/code-viewer.component';

@Component({
  selector: 'app-code-tabs',
  standalone: true,
  imports: [CommonModule, CodeViewerComponent],
  templateUrl: './code-tabs.component.html',
  styleUrls: ['./code-tabs.component.css']
})
export class CodeTabsComponent {
  @Input() codeFiles: CodeFile[] = [];

  selectedFileIndex = signal(0);

  selectFile(index: number) {
    this.selectedFileIndex.set(index);
  }

  get selectedFile(): CodeFile | undefined {
    return this.codeFiles[this.selectedFileIndex()];
  }
}

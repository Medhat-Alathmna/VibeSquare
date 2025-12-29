import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private apiService = inject(ApiService);

  checkEligibility(projectId: string): Observable<any> {
    return this.apiService.get(`gallery/downloads/check/${projectId}`);
  }

  recordDownload(projectId: string): Observable<any> {
    return this.apiService.post(`gallery/downloads/${projectId}`, {});
  }

  downloadProject(downloadUrl: string, filename: string) {
    // For MVP, this simulates a download
    // In production, this would trigger actual file download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.click();
  }

  async downloadCode(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../constants/api.constants';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private http = inject(HttpClient);
  private apiUrl = `${API_CONFIG.baseUrl}/downloads`;

  checkEligibility(projectId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/check/${projectId}`);
  }

  recordDownload(projectId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${projectId}`, {});
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

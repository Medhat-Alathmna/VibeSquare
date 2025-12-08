import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private copiedSignal = signal<boolean>(false);
  public copied = this.copiedSignal.asReadonly();

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      this.copiedSignal.set(true);

      // Reset after 2 seconds
      setTimeout(() => this.copiedSignal.set(false), 2000);

      return true;
    } catch (error) {
      console.error('Failed to copy:', error);
      return false;
    }
  }
}

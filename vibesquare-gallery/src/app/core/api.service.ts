import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  context?: any;
  observe?: any;
  params?: HttpParams | { [param: string]: string | string[] };
  reportProgress?: boolean;
  responseType?: any;
  withCredentials?: boolean;
  body?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl: string;
  private readonly tokenKey = 'gallery_access_token';

  constructor(private httpClient: HttpClient) {
    let url = environment.apiUrl;
    // Ensure no trailing slash
    if (url.charAt(url.length - 1) === '/') {
      url = url.slice(0, url.length - 1);
    }
    this.apiUrl = url;
  }

  private getHeaders(customHeaders?: HttpHeaders | { [header: string]: string | string[] }): HttpHeaders {
    let headers = new HttpHeaders();

    // Set Content-Type for JSON requests
    headers = headers.set('Content-Type', 'application/json');

    // Add Authorization header if token exists
    const token = localStorage.getItem(this.tokenKey);
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // Merge custom headers
    if (customHeaders) {
      if (customHeaders instanceof HttpHeaders) {
        customHeaders.keys().forEach(key => {
          headers = headers.set(key, customHeaders.get(key)!);
        });
      } else {
        Object.keys(customHeaders).forEach(key => {
          headers = headers.set(key, (customHeaders as any)[key]);
        });
      }
    }

    return headers;
  }

  // Helper to construct options for HttpClient
  private createHttpOptions(options: ApiOptions = {}): any {
    const httpOptions: any = { ...options };
    httpOptions.headers = this.getHeaders(options.headers);
    return httpOptions;
  }

  // Helper to ensure URL starts with /
  private formatUrl(url: string): string {
    return url.charAt(0) === '/' ? url : `/${url}`;
  }

  post<T>(url: string, body: any | null, options?: ApiOptions): Observable<T> {
    return this.httpClient.post<T>(`${this.apiUrl}${this.formatUrl(url)}`, body, this.createHttpOptions(options)) as Observable<T>;
  }

  postBlob(url: string, body: any | null, options?: ApiOptions): Observable<Blob> {
    const httpOptions = this.createHttpOptions(options);
    httpOptions.responseType = 'blob';
    return this.httpClient.post(`${this.apiUrl}${this.formatUrl(url)}`, body, httpOptions) as unknown as Observable<Blob>;
  }

  patch<T>(url: string, body: any | null, options?: ApiOptions): Observable<T> {
    return this.httpClient.patch<T>(`${this.apiUrl}${this.formatUrl(url)}`, body, this.createHttpOptions(options)) as Observable<T>;
  }

  put<T>(url: string, body: any | null, options?: ApiOptions): Observable<T> {
    return this.httpClient.put<T>(`${this.apiUrl}${this.formatUrl(url)}`, body, this.createHttpOptions(options)) as Observable<T>;
  }

  get<T>(url: string, options?: ApiOptions): Observable<T> {
    return this.httpClient.get<T>(`${this.apiUrl}${this.formatUrl(url)}`, this.createHttpOptions(options)) as Observable<T>;
  }

  getFile<T>(url: string, options?: ApiOptions): Observable<T> {
    const httpOptions = this.createHttpOptions(options);
    httpOptions.responseType = 'blob'; // 'blob' as 'json' was weird in original code. 'blob' is correct.
    return this.httpClient.get<T>(`${this.apiUrl}${this.formatUrl(url)}`, httpOptions) as Observable<T>;
  }

  delete<T>(url: string, options?: ApiOptions): Observable<T> {
    return this.httpClient.delete<T>(`${this.apiUrl}${this.formatUrl(url)}`, this.createHttpOptions(options)) as Observable<T>;
  }

  postGuest<T>(url: string, body: any | null, options?: ApiOptions): Observable<T> {
    const httpOptions: any = { ...options };
    let headers = new HttpHeaders();

    // Merge custom headers if any
    if (options?.headers) {
      const customHeaders = options.headers;
      if (customHeaders instanceof HttpHeaders) {
        customHeaders.keys().forEach(key => headers = headers.set(key, customHeaders.get(key)!));
      } else {
        Object.keys(customHeaders).forEach(key => headers = headers.set(key, (customHeaders as any)[key]));
      }
    }
    httpOptions.headers = headers;

    return this.httpClient.post<T>(`${this.apiUrl}${this.formatUrl(url)}`, body, httpOptions) as Observable<T>;
  }
}



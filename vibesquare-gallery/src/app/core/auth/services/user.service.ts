import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../constants/api.constants';
import { SafeGalleryUser } from '../models/auth.models';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = `${API_CONFIG.baseUrl}/users`;

    constructor(private http: HttpClient) { }

    updateProfile(data: Partial<SafeGalleryUser>): Observable<any> {
        return this.http.patch(`${this.apiUrl}/me`, data);
    }

    getPublicProfile(username: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${username}`);
    }

    deleteAccount(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/me`);
    }
}

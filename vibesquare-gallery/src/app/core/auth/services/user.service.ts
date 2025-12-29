import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SafeGalleryUser } from '../models/auth.models';
import { ApiService } from '../../api.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    constructor(private apiService: ApiService) { }

    updateProfile(data: Partial<SafeGalleryUser>): Observable<any> {
        return this.apiService.patch('gallery/users/me', data);
    }

    getPublicProfile(username: string): Observable<any> {
        return this.apiService.get(`gallery/users/${username}`);
    }

    deleteAccount(): Observable<any> {
        return this.apiService.delete('gallery/users/me');
    }
}

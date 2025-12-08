import { Injectable, signal } from '@angular/core';
import { Collection } from '../models/collection.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private collectionsSignal = signal<Collection[]>([]);

  public collections = this.collectionsSignal.asReadonly();

  constructor() {
    this.loadCollectionsInternal();
  }

  public loadCollections() {
    this.loadCollectionsInternal();
  }

  private async loadCollectionsInternal() {
    try {
      const response = await fetch('/assets/data/collections.json');
      const collections = await response.json();
      this.collectionsSignal.set(collections);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }

  getCollectionById(id: string): Collection | undefined {
    return this.collectionsSignal().find(c => c.id === id);
  }

  getFeaturedCollections(): Collection[] {
    return this.collectionsSignal().filter(c => c.featured);
  }

  getAllCollections(): Collection[] {
    return this.collectionsSignal();
  }
}

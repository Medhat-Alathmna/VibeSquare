import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CollectionService } from '../../core/services/collection.service';
import { Collection } from '../../core/models/collection.model';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.css']
})
export class CollectionsComponent implements OnInit {
  private collectionService = inject(CollectionService);

  collections = this.collectionService.collections;

  ngOnInit() {
    this.collectionService.loadCollections();
  }
}

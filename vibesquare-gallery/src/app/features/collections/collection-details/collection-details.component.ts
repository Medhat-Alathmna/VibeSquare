import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CollectionService } from '../../../core/services/collection.service';
import { ProjectService } from '../../../core/services/project.service';
import { Collection } from '../../../core/models/collection.model';
import { Project } from '../../../core/models/project.model';
import { MasonryGridComponent } from '../../explore/components/masonry-grid/masonry-grid.component';

@Component({
  selector: 'app-collection-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MasonryGridComponent],
  templateUrl: './collection-details.component.html',
  styleUrls: ['./collection-details.component.css']
})
export class CollectionDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private collectionService = inject(CollectionService);
  private projectService = inject(ProjectService);

  collection = signal<Collection | null>(null);
  loading = signal(true);
  notFound = signal(false);

  collectionProjects = computed(() => {
    const coll = this.collection();
    if (!coll) return [];

    const allProjects = this.projectService.filteredProjects();
    return allProjects.filter(p => coll.projectIds.includes(p.id));
  });

  ngOnInit() {
    const collectionId = this.route.snapshot.paramMap.get('id');
    if (collectionId) {
      this.loadCollection(collectionId);
    } else {
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  private loadCollection(id: string) {
    const foundCollection = this.collectionService.getCollectionById(id);
    if (foundCollection) {
      this.collection.set(foundCollection);
      this.loading.set(false);
    } else {
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/collections']);
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TeamStore } from '../state/team.store';
import { TeamBuilderComponent } from './team-builder.component';
import { TeamListComponent } from './team-list.component';

/** Teams page: team builder form + persisted team list. */
@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [TeamBuilderComponent, TeamListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teams-page.component.html',
  styleUrl: './teams-page.component.scss',
})
export class TeamsPageComponent implements OnInit {
  private readonly store = inject(TeamStore);

  ngOnInit(): void {
    if (this.store.snapshot.status === 'idle') {
      this.store.load();
    }
  }
}

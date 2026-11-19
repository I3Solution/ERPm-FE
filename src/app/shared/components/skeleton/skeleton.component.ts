import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Grey animated placeholder shown while data loads. `lines` rows are drawn; the last one is shorter. */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonComponent {
  public readonly lines = input(5);
  /** Convert the count to an array for @for. */
  public rows(): number[] { return Array.from({ length: Math.max(1, this.lines()) }, (_, i) => i); }
}

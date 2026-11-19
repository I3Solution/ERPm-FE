import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforms an ISO date string into human-readable relative time.
 */
@Pipe({
  name: 'relativeTime',
  standalone: true
})
export class RelativeTimePipe implements PipeTransform {
  transform(value?: string | Date | null): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 30) return 'vừa xong';
    if (diffSec < 60) return `${diffSec}s trước`;
    if (diffMin < 60) return `${diffMin}m trước`;
    if (diffHours < 24) return `${diffHours}h trước`;
    if (diffDays === 1) return 'hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
}

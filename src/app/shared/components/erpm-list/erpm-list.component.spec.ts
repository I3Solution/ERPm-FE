import { of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableColumnComponent } from '../data-table/table-column.component';
import { ErpmListComponent } from './erpm-list.component';

@Component({
  standalone: true,
  imports: [ErpmListComponent, TableColumnComponent],
  template: `<erpm-list [data]="rows" [sort]="sort" (sortChange)="last = $event">
    <app-column key="name" label="Name" [sortable]="true"></app-column>
    <app-column key="rank" label="Rank" [sortable]="true"></app-column>
  </erpm-list>`
})
class HostComponent {
  rows = [{ name: 'b', rank: 10 }, { name: 'a', rank: 2 }, { name: 'c', rank: null }];
  sort: string | null = null;
  last: unknown = null;
}

describe('ErpmListComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const names = () => Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row td:first-child')).map((e: any) => e.textContent.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false, breakpoints: {} }) } },provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('keeps the given order without a sort', () => {
    expect(names()).toEqual(['b', 'a', 'c']);
  });

  it('sorts text ascending and descending from the sort input', () => {
    fixture.componentInstance.sort = 'name';
    fixture.detectChanges();
    expect(names()).toEqual(['a', 'b', 'c']);
    fixture.componentInstance.sort = '-name';
    fixture.detectChanges();
    expect(names()).toEqual(['c', 'b', 'a']);
  });

  it('sorts numbers as numbers and puts empty values last', () => {
    fixture.componentInstance.sort = 'rank';
    fixture.detectChanges();
    expect(names()).toEqual(['a', 'b', 'c']);
  });

  it('emits sortChange when a sortable header is clicked', () => {
    fixture.nativeElement.querySelector('th.mat-mdc-header-cell').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ column: 'name', direction: 'asc' });
    expect(names()).toEqual(['a', 'b', 'c']);
  });
});

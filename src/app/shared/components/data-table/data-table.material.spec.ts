import { of } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TableColumnComponent } from './components/table-column.component';
import { DataTableComponent } from './data-table.component';

@Component({
  standalone: true,
  imports: [DataTableComponent, TableColumnComponent],
  template: `<app-data-table [showIndex]="false" [canEdit]="canEdit" [data]="rows" [sort]="sort">
    <app-column key="name" label="Name" [sortable]="true"></app-column>
    <app-column key="rank" label="Rank" [sortable]="true"></app-column>
    <app-column key="tag" label="Tag" [sortable]="true" [sortValue]="byName"></app-column>
  </app-data-table>`
})
class HostComponent {
  canEdit = false;
  rows = [{ name: 'b', rank: 10 }, { name: 'a', rank: 2 }, { name: 'c', rank: null }];
  sort: string | null = null;
  byName = (row: { name: string }) => row.name.toUpperCase();
  last: unknown = null;
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const names = () => Array.from(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row td:first-child')).map((e: any) => e.textContent.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false, breakpoints: {} }) } },provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('still draws the data rows when canEdit is on and there is no formArray', () => {
    fixture.componentInstance.canEdit = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(3);
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

  it('sorts by the column sortValue when one is given', () => {
    fixture.componentInstance.sort = '-tag';
    fixture.detectChanges();
    expect(names()).toEqual(['c', 'b', 'a']);
  });

  it('keeps empty values last when sorting descending', () => {
    fixture.componentInstance.sort = '-rank';
    fixture.detectChanges();
    expect(names()).toEqual(['b', 'a', 'c']);
  });

  it('emits sortChange on a header click and leaves ordering to the host once it listens', () => {
    const table = fixture.debugElement.query(By.directive(DataTableComponent)).componentInstance as DataTableComponent;
    table.sortChange.subscribe(v => fixture.componentInstance.last = v);
    fixture.nativeElement.querySelector('th.mat-mdc-header-cell:not(.table-col-index)').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.last).toEqual({ column: 'name', direction: 'asc' });
    expect(names()).toEqual(['b', 'a', 'c']);
  });
});

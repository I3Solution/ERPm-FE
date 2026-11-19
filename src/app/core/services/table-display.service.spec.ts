import { TableDisplayService } from './table-display.service';

describe('TableDisplayService', () => {
  beforeEach(() => localStorage.removeItem('erpm_cell_overflow'));

  it('defaults to truncate and toggles to wrap, applying the html attribute', () => {
    const svc = new TableDisplayService();
    expect(svc.cellOverflow()).toBe('truncate');
    expect(document.documentElement.getAttribute('data-cell-overflow')).toBe('truncate');
    svc.toggle();
    expect(svc.cellOverflow()).toBe('wrap');
    expect(document.documentElement.getAttribute('data-cell-overflow')).toBe('wrap');
    expect(new TableDisplayService().cellOverflow()).toBe('wrap');
  });

  afterAll(() => { localStorage.removeItem('erpm_cell_overflow'); document.documentElement.removeAttribute('data-cell-overflow'); });
});

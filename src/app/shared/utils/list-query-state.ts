import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

/** Values a list keeps in the URL. Extra filters (status, branch...) are plain string keys. */
export interface ListQuery {
  page: number;
  pageSize: number;
  q: string;
  sort: string;
  filters: Record<string, string>;
}

export interface ListQueryState {
  /** Current state read from the URL; changes when the user navigates Back/Forward. */
  readonly query: Signal<ListQuery>;
  /** Query params to pass to the detail page's back button so the list returns to the same place. */
  readonly backParams: Signal<Record<string, string>>;
  /** Merge changes into the URL. Changing q, sort, pageSize or any filter resets page to 1 unless page is given. */
  patch(change: Partial<Omit<ListQuery, 'filters'>> & { filters?: Record<string, string | null> }): void;
}

export interface ListQueryDefaults {
  pageSize?: number;
  sort?: string;
  /** Names of extra filter params to track (e.g. ['status']). */
  filterKeys?: string[];
}

/**
 * Keeps a list's page, search text, sort and filters in the URL query params (not in memory), so a browser Back
 * from the detail page, a reload, or a shared link shows the same list. Call it in a component's injection context.
 * Defaults are omitted from the URL to keep it short.
 */
export function createListQueryState(defaults: ListQueryDefaults = {}): ListQueryState {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const pageSizeDefault = defaults.pageSize ?? 20;
  const sortDefault = defaults.sort ?? '';
  const filterKeys = defaults.filterKeys ?? [];

  const query = toSignal(route.queryParamMap.pipe(map((p): ListQuery => ({
    page: Math.max(1, Number(p.get('page')) || 1),
    pageSize: Math.max(1, Number(p.get('pageSize')) || pageSizeDefault),
    q: p.get('q') ?? '',
    sort: p.get('sort') ?? sortDefault,
    filters: Object.fromEntries(filterKeys.map(k => [k, p.get(k) ?? '']))
  }))), {
    initialValue: { page: 1, pageSize: pageSizeDefault, q: '', sort: sortDefault, filters: Object.fromEntries(filterKeys.map(k => [k, ''])) }
  });

  const backParams = computed(() => {
    const s = query();
    const out: Record<string, string> = {};
    if (s.page > 1) out['page'] = String(s.page);
    if (s.pageSize !== pageSizeDefault) out['pageSize'] = String(s.pageSize);
    if (s.q) out['q'] = s.q;
    if (s.sort !== sortDefault) out['sort'] = s.sort;
    for (const [k, v] of Object.entries(s.filters)) if (v) out[k] = v;
    return out;
  });

  const patch: ListQueryState['patch'] = change => {
    const cur = query();
    const next: ListQuery = {
      page: change.page ?? 1,
      pageSize: change.pageSize ?? cur.pageSize,
      q: change.q ?? cur.q,
      sort: change.sort ?? cur.sort,
      filters: { ...cur.filters }
    };
    for (const [k, v] of Object.entries(change.filters ?? {})) next.filters[k] = v ?? '';
    // Paging only (page given alone) keeps the current page; any other change starts again from page 1.
    const onlyPage = change.page !== undefined && change.q === undefined && change.sort === undefined
      && change.pageSize === undefined && !change.filters;
    const params: Record<string, string | null> = {
      page: next.page > 1 ? String(next.page) : null,
      pageSize: next.pageSize !== pageSizeDefault ? String(next.pageSize) : null,
      q: next.q || null,
      sort: next.sort !== sortDefault ? next.sort : null
    };
    for (const k of filterKeys) params[k] = next.filters[k] || null;
    // replaceUrl while typing/filtering keeps history short; page changes get their own history entry.
    void router.navigate([], { relativeTo: route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: !onlyPage });
  };

  return { query, backParams, patch };
}

import { Signal, linkedSignal } from '@angular/core';

/** Selection belongs to the loaded dataset and is cleared when its query or rows change. */
export function createListSelection<T>(query: Signal<unknown>, rows: Signal<readonly T[]>) {
  return linkedSignal({
    source: () => [query(), rows()],
    computation: (): T[] => []
  });
}

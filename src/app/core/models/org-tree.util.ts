import { OrgBranch, OrgUnitType } from './org.models';

/** Every node of a nested branch tree as a flat list (parents before children). Linear, no recursion per lookup. */
export function flattenBranches(tree: readonly OrgBranch[]): OrgBranch[] {
  const flat: OrgBranch[] = [];
  const stack = [...tree].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    flat.push(node);
    const children = node.children ?? [];
    for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
  }
  return flat;
}

/** Companies of a tree, in tree order. */
export function companiesOf(tree: readonly OrgBranch[]): OrgBranch[] {
  return flattenBranches(tree).filter(b => b.orgUnitType === OrgUnitType.Company);
}

/** Parent and node lookup of a tree: O(1) per id after one linear pass. */
export interface BranchIndex { byId: ReadonlyMap<number, OrgBranch>; parentOf: ReadonlyMap<number, number | null>; }

const indexCache = new WeakMap<readonly OrgBranch[], BranchIndex>();

/**
 * Index of a nested tree, cached per array reference: a table that renders one breadcrumb per row passes the same
 * array to every row and pays for the pass once, not once per row.
 */
export function branchIndex(tree: readonly OrgBranch[]): BranchIndex {
  const cached = indexCache.get(tree);
  if (cached) return cached;
  const byId = new Map<number, OrgBranch>();
  const parentOf = new Map<number, number | null>();
  const stack: { node: OrgBranch; parent: number | null }[] = tree.map(node => ({ node, parent: null }));
  while (stack.length > 0) {
    const { node, parent } = stack.pop()!;
    byId.set(node.id, node);
    parentOf.set(node.id, parent);
    for (const child of node.children ?? []) stack.push({ node: child, parent: node.id });
  }
  const index = { byId, parentOf };
  indexCache.set(tree, index);
  return index;
}

/** Nodes from the top of the tree down to `id` (inclusive); empty when the id is unknown. Cost is the depth, not the tree size. */
export function branchPath(index: BranchIndex, id: number | null | undefined): OrgBranch[] {
  const path: OrgBranch[] = [];
  const seen = new Set<number>();
  for (let cursor = id ?? null; cursor !== null && index.byId.has(cursor) && !seen.has(cursor); cursor = index.parentOf.get(cursor) ?? null) {
    seen.add(cursor);
    path.push(index.byId.get(cursor)!);
  }
  return path.reverse();
}

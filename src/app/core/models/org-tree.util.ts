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

/**
 * MIXED-MEDIA GROUPING — prototype, Composer-local. SYSTEMBOOM SUGGESTS the structure (one group per kind, from each photo's own
 * category read); the HUMAN controls it (move · split · merge · remove). Pure functions over stable media asset ids — never array
 * position. Nothing here is persisted as a record: it is the draft's own organisation of its media.
 */
/** every canonical kind may be a per-asset group kind (SOCIAL-4 widened the union; the functions below never depended on it) */
export type GroupCategory = "meal" | "activity" | "moment" | "health" | "problem" | "project" | "meeting" | "review";
export const ASSET_KINDS: readonly Exclude<GroupCategory, "review">[] = ["moment", "meal", "activity", "health", "problem", "project", "meeting"];
export interface GroupDef {
  id: string;
  category: GroupCategory;
}
export interface GroupingState {
  /** groups the person created or retargeted (suggested groups are ephemeral until touched) */
  groups: GroupDef[];
  /** media the person placed by hand → the group id it belongs to (suggestion never moves these) */
  placed: Record<string, string>;
  organised: boolean;
}
export interface GroupView extends GroupDef {
  mediaIds: string[];
}
export const EMPTY_GROUPING: GroupingState = { groups: [], placed: {}, organised: false };

/** the suggested group id for a kind (one suggested group per kind, created on demand) */
const suggestedId = (c: GroupCategory) => `g-${c}`;

/**
 * Build the visible groups: every attached asset sits in exactly one group — where the person put it, else the first group of the
 * kind its own reading says (created if absent); a photo whose reading is not settled yet is listed as `pending`. Empty groups
 * vanish; the person's groups keep their order, suggested groups follow in kind order.
 */
export function buildGroups(state: GroupingState, mediaIds: readonly string[], categoryOf: (id: string) => GroupCategory | undefined): { groups: GroupView[]; pending: string[] } {
  const live = new Set(mediaIds);
  const views: GroupView[] = state.groups.map((g) => ({ ...g, mediaIds: [] }));
  const byId = new Map(views.map((g) => [g.id, g]));
  const pending: string[] = [];
  for (const id of mediaIds) {
    const placedIn = state.placed[id];
    if (placedIn && byId.has(placedIn)) {
      byId.get(placedIn)!.mediaIds.push(id);
      continue;
    }
    const c = categoryOf(id);
    if (!c) {
      pending.push(id);
      continue;
    }
    let g = views.find((v) => v.category === c);
    if (!g) {
      g = { id: suggestedId(c), category: c, mediaIds: [] };
      views.push(g);
      byId.set(g.id, g);
    }
    g.mediaIds.push(id);
  }
  void live;
  return { groups: views.filter((g) => g.mediaIds.length > 0), pending };
}

/** place one asset in a group (by hand) — the group is made stable if it was only suggested */
export function moveTo(state: GroupingState, view: GroupView[], mediaId: string, groupId: string): GroupingState {
  const target = view.find((g) => g.id === groupId);
  if (!target) return state;
  const groups = state.groups.some((g) => g.id === groupId) ? state.groups : [...state.groups, { id: target.id, category: target.category }];
  return { ...state, groups, placed: { ...state.placed, [mediaId]: groupId } };
}

/** move one asset into a group of the given kind — the first existing one, else a new one of that kind */
export function moveToKind(state: GroupingState, view: GroupView[], mediaId: string, category: GroupCategory, newId: () => string): GroupingState {
  const existing = view.find((g) => g.category === category);
  if (existing) return moveTo(state, view, mediaId, existing.id);
  const id = newId();
  return { ...state, groups: [...state.groups, { id, category }], placed: { ...state.placed, [mediaId]: id } };
}

/** split: start a new group of the same kind holding just this asset */
export function startNewGroup(state: GroupingState, view: GroupView[], mediaId: string, newId: () => string): GroupingState {
  const from = view.find((g) => g.mediaIds.includes(mediaId));
  const id = newId();
  // the source group becomes stable and keeps its other members by hand — otherwise a merely-suggested source would dissolve and
  // its remaining photos re-suggest into the very group that was just split off
  const groups = from && !state.groups.some((g) => g.id === from.id) ? [...state.groups, { id: from.id, category: from.category }] : [...state.groups];
  const placed = { ...state.placed };
  if (from) for (const other of from.mediaIds) if (other !== mediaId) placed[other] = from.id;
  placed[mediaId] = id;
  return { ...state, groups: [...groups, { id, category: from?.category ?? "moment" }], placed };
}

/** merge: every asset of `fromId` is placed by hand into `intoId` (the target's kind wins); the empty source vanishes */
export function mergeGroups(state: GroupingState, view: GroupView[], fromId: string, intoId: string): GroupingState {
  const from = view.find((g) => g.id === fromId);
  const into = view.find((g) => g.id === intoId);
  if (!from || !into || fromId === intoId) return state;
  let next = state;
  for (const id of from.mediaIds) next = moveTo(next, view, id, intoId);
  return { ...next, groups: next.groups.filter((g) => g.id !== fromId) };
}

/** forget a removed asset's placement */
export function forgetAsset(state: GroupingState, mediaId: string): GroupingState {
  if (!(mediaId in state.placed)) return state;
  const placed = { ...state.placed };
  delete placed[mediaId];
  return { ...state, placed };
}

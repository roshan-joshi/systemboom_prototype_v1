/**
 * SYSTEMBOOM — the destination model. One product, one source of truth.
 *
 * The user-facing model is deliberately small (final owner decision):
 *
 *   COSMOS      /        the universal Home — everyone starts here
 *   MY WORLD    /world   the personal Home after identity; its stream is MOMENTS
 *   LIFE        /life    the Circle of Life, inside the person's World
 *
 * Earth is part of Cosmos exploration, not a navigation item: it remains a
 * STATE inside the root experience, addressable as `/?to=earth` for deep links,
 * and is never given a route. Ancestors exist only in the architecture
 * (personal life begins at birth; earlier is ancestral time) and appear nowhere
 * until a real implementation exists.
 *
 * "Social" is engineering vocabulary, not product vocabulary: the code keeps
 * its names, the UI says MY WORLD and MOMENTS, and `/social` survives only as a
 * compatibility redirect to `/world`.
 *
 * There is no global destination menu. The SYSTEMBOOM mark goes Home, the way
 * every product's mark does; Life is entered contextually from My World; the
 * current context is stated beside the mark. That is the whole navigation.
 */

export interface Destination {
  id: string;
  /** What the person reads. */
  label: string;
  /** The canonical product URL. */
  route: string;
  /** Development alias kept for the prototype suites; never product navigation. */
  devRoute?: string;
  /** Personal destinations need an identity; a request without one survives the gate. */
  personal?: boolean;
}

export const DESTINATIONS: Destination[] = [
  { id: "cosmos", label: "Cosmos", route: "/" },
  { id: "world", label: "My World", route: "/world", devRoute: "/style-lab/social", personal: true },
  { id: "life", label: "Life", route: "/life", devRoute: "/style-lab/circle", personal: true },
  // Chat is a utility surface of My World, never a navigation item; it owns a
  // route so a person (and a person's Message action) can land in a
  // conversation directly.
  { id: "chat", label: "Chat", route: "/chat", personal: true },
];

export const byId = (id: string): Destination => {
  const d = DESTINATIONS.find((x) => x.id === id);
  if (!d) throw new Error(`unknown destination: ${id}`);
  return d;
};

/** The root of the product. The SYSTEMBOOM mark always returns here. */
export const ROOT = byId("cosmos");

/** Earth deep link — a state inside Cosmos, not a route. */
export const EARTH_INTENT = "/?to=earth";

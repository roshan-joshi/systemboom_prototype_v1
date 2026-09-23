import type { DemoUser } from "./types";

/**
 * Fictional demo identity for the SYSTEMBOOM prototype.
 * DOB feeds the Life Counter and the Circle of Life bands.
 */
export const demoUser: DemoUser = {
  id: "u-demo-001",
  name: "Giulia Bianchi",
  username: "giulia.bianchi",
  dateOfBirth: "1991-11-04",
  birthTime: "06:42",
  birthTimeKnown: true,
  location: "Bologna, Italy",
  /** A real photo, not an illustration — the Person + Life Identity pass supersedes the earlier curated-avatar convention.
   *  Phase 4.4-A owner fixture add-on: a face-framed crop of a CC0 portrait (docs/fixtures/photo-sources.md);
   *  the person photographed is not Giulia — the name and every life fact here are fictional. */
  avatar: "/mock/social/cast/giulia-bianchi.jpg",
  cover: "/mock/cover-kathmandu.svg",
  bio: "Photographer from Bologna, chasing light from the Apennines to the Himalayas. Collecting moments, not things.",
};

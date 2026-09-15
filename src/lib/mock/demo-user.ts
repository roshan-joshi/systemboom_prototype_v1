import type { DemoUser } from "./types";

/**
 * Fictional demo identity for the SYSTEMBOOM prototype.
 * DOB feeds the Life Counter and the Circle of Life bands.
 */
export const demoUser: DemoUser = {
  id: "u-demo-001",
  name: "Maya Rai",
  username: "maya.rai",
  dateOfBirth: "1991-11-04",
  birthTime: "06:42",
  birthTimeKnown: true,
  location: "Kathmandu, Nepal",
  /** A real photo, not an illustration — the Person + Life Identity pass supersedes the earlier curated-avatar convention. */
  avatar: "/mock/social/face-portrait.jpg",
  cover: "/mock/cover-kathmandu.svg",
  bio: "Photographer chasing light across the Himalayas. Collecting moments, not things.",
};

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
  location: "Kathmandu, Nepal",
  avatar: "/mock/avatar-maya.svg",
  cover: "/mock/cover-kathmandu.svg",
  bio: "Photographer chasing light across the Himalayas. Collecting moments, not things.",
};

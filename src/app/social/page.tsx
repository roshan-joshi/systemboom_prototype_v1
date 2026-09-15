import { redirect } from "next/navigation";

/**
 * "Social" is capability vocabulary, not a product destination. The signed-in
 * personal Home is MY WORLD at /world; this route keeps earlier review links
 * working. (Owner decision, final My World pass.)
 */
export default function SocialCompatibility() {
  redirect("/world");
}

/**
 * SYSTEMBOOM prototype data model — deliberately compact.
 * One conceptual record per Life Moment; views (Social, Circle,
 * Photo Journey, Memories) reference it, never duplicate it.
 */

export type Privacy = "private" | "friends" | "public";

export type LifeMomentKind =
  | "photo"
  | "video"
  | "meal"
  | "travel"
  | "health"
  | "meeting"
  | "activity"
  | "project"
  | "problem"
  | "memory";

export interface DemoUser {
  id: string;
  name: string;
  username: string;
  /** ISO date — feeds Life Counter and Circle of Life bands. */
  dateOfBirth: string;
  /** Optional HH:mm birth time for a precise Life Counter. */
  birthTime?: string;
  location: string;
  avatar: string;
  cover: string;
  bio: string;
}

export interface LifeMoment {
  id: string;
  kind: LifeMomentKind;
  /** ISO date-time — anchors the moment on the Circle of Life. */
  occurredAt: string;
  title: string;
  location?: string;
  media?: string[];
  privacy: Privacy;
}

export interface Post {
  id: string;
  authorId: string;
  createdAt: string;
  text?: string;
  /** When set, this post is a shared Life Moment — same record, new view. */
  momentId?: string;
  privacy: Privacy;
  reactions: Partial<Record<ReactionKind, number>>;
  commentCount: number;
}

export type ReactionKind = "love" | "laugh" | "wow" | "fire" | "clap" | "sad";

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  presence: "online" | "away" | "offline";
  /** 0–1 connection meter shown in Mini Chat later. */
  connection: number;
  unread?: number;
}

export type NotificationGroup = "social" | "life" | "friends" | "chat";

export interface AppNotification {
  id: string;
  group: NotificationGroup;
  text: string;
  createdAt: string;
  read: boolean;
}

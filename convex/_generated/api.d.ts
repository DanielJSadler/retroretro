/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as boards from "../boards.js";
import type * as confetti from "../confetti.js";
import type * as folders from "../folders.js";
import type * as http from "../http.js";
import type * as migrations from "../migrations.js";
import type * as music from "../music.js";
import type * as notes from "../notes.js";
import type * as participants from "../participants.js";
import type * as timer from "../timer.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  boards: typeof boards;
  confetti: typeof confetti;
  folders: typeof folders;
  http: typeof http;
  migrations: typeof migrations;
  music: typeof music;
  notes: typeof notes;
  participants: typeof participants;
  timer: typeof timer;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

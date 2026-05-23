/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RED_FLAGS } from "../types";

/**
 * Checks if the user's symptom description contains any high-risk keywords.
 * This is a deterministic safety layer that runs before any AI inference.
 */
export function containsRedFlags(text: string): boolean {
  const normalized = text.toLowerCase();
  return RED_FLAGS.some(flag => normalized.includes(flag.toLowerCase()));
}

import { app } from "@microsoft/teams-js";

/** Initializes Teams SDK if running inside Teams. Returns true if in Teams. */
export async function initTeams(): Promise<boolean> {
  try {
    await app.initialize();
    const context = await app.getContext();
    // If we got context, we’re in Teams.
    return Boolean(context);
  } catch {
    return false; // Not in Teams, or initialization failed
  }
}

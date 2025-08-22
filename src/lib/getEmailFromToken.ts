import { jwtDecode } from "jwt-decode";

type IdToken = {
  upn?: string; // Often the work email
  preferred_username?: string; // Sometimes the email/UPN
  emails?: string[]; // Sometimes provided
};

export function getEmailFromToken(idToken: string): string | null {
  try {
    const decoded = jwtDecode<IdToken>(idToken);
    return (
      decoded.emails?.[0] || decoded.upn || decoded.preferred_username || null
    );
  } catch (e) {
    console.log("Error: ", e);
    return null;
  }
}

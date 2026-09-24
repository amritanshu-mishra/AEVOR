import { adminAuth } from "./admin";

export async function verifyIdToken(token: string) {
  return adminAuth.verifyIdToken(token);
}
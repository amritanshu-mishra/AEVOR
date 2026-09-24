import { auth } from "@/lib/firebase/client";

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const token = await user.getIdToken();

  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
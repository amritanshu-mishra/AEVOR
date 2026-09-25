import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

function getCurrentUser() {
  return new Promise<NonNullable<typeof auth.currentUser> | null>((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const user = auth.currentUser ?? (await getCurrentUser());

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
"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api/client";

type ProofType = "note" | "url";

export type Proof = {
  id: string;
  userId: string;
  missionId: string;
  focusSessionId: string | null;
  type: ProofType;
  title: string;
  content: string;
  createdAt: string;
};

type ProofSectionProps = {
  missionId: string;
  proofs: Proof[];
  onProofCreated: (proof: Proof) => void;
  onProofDeleted: (id: string) => void;
};

export default function ProofSection({
  missionId,
  proofs,
  onProofCreated,
  onProofDeleted,
}: ProofSectionProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ProofType>("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) return;

    try {
      setSaving(true);
      setError("");

      const response = await apiFetch("/api/v1/proofs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          missionId,
          type,
          title: title.trim(),
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create proof");
      }

      const proof: Proof = await response.json();

      onProofCreated(proof);

      setTitle("");
      setContent("");
      setType("note");
      setOpen(false);
    } catch {
      setError("Unable to save the proof.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProof(id: string) {
    try {
      setDeleting(id);
      setError("");

      const response = await apiFetch(`/api/v1/proofs/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete proof");
      }

      onProofDeleted(id);
    } catch {
      setError("Unable to delete the proof.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="mt-4 border-t border-[#EEF1EE] pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#B99A5B]">
            PROOF
          </p>

          <p className="mt-1 text-xs text-[#89918C]">
            {proofs.length} {proofs.length === 1 ? "item" : "items"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-lg border border-[#C8D0CA] px-3 py-2 text-xs font-semibold text-[#12352B] hover:bg-[#F0F2EF]"
        >
          {open ? "Close" : "Add proof"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={createProof}
          className="mt-4 rounded-xl bg-[#F7F8F6] p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as ProofType)
              }
              className="rounded-lg border border-[#DDE2DE] bg-white px-3 py-2 text-sm outline-none focus:border-[#12352B]"
            >
              <option value="note">Note</option>
              <option value="url">URL</option>
            </select>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Proof title"
              className="rounded-lg border border-[#DDE2DE] bg-white px-3 py-2 text-sm outline-none focus:border-[#12352B]"
            />
          </div>

          {type === "note" ? (
            <textarea
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="What did you complete or learn?"
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-[#DDE2DE] bg-white px-3 py-2 text-sm outline-none focus:border-[#12352B]"
            />
          ) : (
            <input
              type="url"
              value={content}
              onChange={(event) =>
                setContent(event.target.value)
              }
              placeholder="https://..."
              className="mt-3 w-full rounded-lg border border-[#DDE2DE] bg-white px-3 py-2 text-sm outline-none focus:border-[#12352B]"
            />
          )}

          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={
              saving || !title.trim() || !content.trim()
            }
            className="mt-3 rounded-lg bg-[#12352B] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save proof"}
          </button>
        </form>
      )}

      {proofs.length > 0 && (
        <div className="mt-3 space-y-2">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="rounded-lg border border-[#EEF1EE] bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#12352B]">
                    {proof.title}
                  </p>

                  {proof.type === "url" ? (
                    <a
                      href={proof.content}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate text-xs text-[#477A9B] hover:underline"
                    >
                      {proof.content}
                    </a>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#5E6963]">
                      {proof.content}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void deleteProof(proof.id)}
                  disabled={deleting === proof.id}
                  className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  {deleting === proof.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
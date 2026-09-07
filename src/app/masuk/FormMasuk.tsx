"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { masuk, type StatusMasuk } from "./aksi";

function TombolKirim() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Memeriksa..." : "Masuk"}
    </button>
  );
}

export default function FormMasuk({ next }: { next?: string }) {
  const [status, aksi] = useActionState<StatusMasuk, FormData>(masuk, {});

  return (
    <form action={aksi} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {status.galat && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {status.galat}
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
          Surel
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={status.email}
          placeholder="nama@sanggrahan.id"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <div>
        <label htmlFor="kataSandi" className="mb-1.5 block text-sm font-medium text-slate-700">
          Kata sandi
        </label>
        <input
          id="kataSandi"
          name="kataSandi"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <TombolKirim />
    </form>
  );
}

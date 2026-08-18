"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { defaultPackingLists, PACKING_DEFAULTS_KEY, readPackingDefaults } from "@/lib/packing-defaults";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const ko = language === "ko";
  const [packingDefaults, setPackingDefaults] = useState(defaultPackingLists);
  const [packingType, setPackingType] = useState<"domestic" | "international">("domestic");
  const [newPackingItem, setNewPackingItem] = useState("");
  useEffect(() => setPackingDefaults(readPackingDefaults()), []);
  const savePackingDefaults = (next: typeof packingDefaults) => { setPackingDefaults(next); window.localStorage.setItem(PACKING_DEFAULTS_KEY, JSON.stringify(next)); };
  const currentPacking = packingDefaults[packingType];
  return (
    <main className="min-h-screen px-5 py-8 pb-24 sm:px-10 lg:px-20 lg:py-12">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow mb-3">{ko ? "설정" : "Settings"}</p>
        <h1 className="text-4xl font-bold">
          {ko ? "Voyage를 나에게 맞게" : "Make Voyage yours."}
        </h1>
        <p className="mt-2 muted">
          {ko
            ? "언어와 계정 환경을 관리하세요."
            : "Manage your language and account preferences."}
        </p>
        <section className="card mt-9 p-6 sm:p-7">
          <p className="eyebrow mb-2">{ko ? "언어" : "Language"}</p>
          <h2 className="text-xl font-bold">
            {ko ? "표시 언어" : "Display language"}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setLanguage("ko")}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${ko ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]" : "border-[var(--color-border)]"}`}
            >
              한국어
              <span className="mt-1 block text-xs font-normal muted">
                Korean
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-bold ${!ko ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]" : "border-[var(--color-border)]"}`}
            >
              English
              <span className="mt-1 block text-xs font-normal muted">
                English
              </span>
            </button>
          </div>
        </section>
        <section id="packing-defaults" className="card mt-5 p-6 sm:p-7">
          <p className="eyebrow mb-2">{ko ? "계정" : "Account"}</p>
          <h2 className="text-xl font-bold">
            {ko ? "로그인 및 계정 보안" : "Login and account security"}
          </h2>
          <p className="mt-2 text-sm muted">
            {user
              ? user.email
              : ko
                ? "아직 로그인하지 않았습니다."
                : "You are not signed in yet."}
          </p>
          <Link
            href={user ? "/account" : "/auth"}
            className="mt-5 inline-block rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white"
          >
            {user
              ? ko
                ? "계정 설정 열기 →"
                : "Open account settings →"
              : ko
                ? "로그인하기 →"
                : "Sign in →"}
          </Link>
        </section>
        <section className="card mt-5 p-6 sm:p-7">
          <p className="eyebrow mb-2">{ko ? "기본 준비물" : "Default packing"}</p>
          <h2 className="text-xl font-bold">{ko ? "여행 생성 시 자동으로 넣을 준비물" : "Items added when creating a trip"}</h2>
          <p className="mt-2 text-sm muted">{ko ? "국내·국외 여행별 목록을 미리 저장해 두세요." : "Keep separate defaults for domestic and international trips."}</p>
          <div className="mt-5 flex gap-2">
            {(["domestic", "international"] as const).map((type) => <button key={type} type="button" onClick={() => setPackingType(type)} className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold ${packingType === type ? "border-[var(--color-primary)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]" : "border-[var(--color-border)]"}`}>{type === "domestic" ? (ko ? "국내 여행" : "Domestic") : (ko ? "국외 여행" : "International")}</button>)}
          </div>
          <div className="mt-4 space-y-2">{currentPacking.map((item, index) => <div key={`${item}-${index}`} className="flex items-center gap-3 rounded-xl bg-[var(--color-background)] px-3 py-2.5 text-sm"><span className="flex-1">{item}</span><button type="button" onClick={() => savePackingDefaults({ ...packingDefaults, [packingType]: currentPacking.filter((_, itemIndex) => itemIndex !== index) })} className="font-bold text-[var(--color-danger)]" aria-label={`${item} 삭제`}>×</button></div>)}</div>
          <form onSubmit={(event) => { event.preventDefault(); const item = newPackingItem.trim(); if (!item || currentPacking.includes(item)) return; savePackingDefaults({ ...packingDefaults, [packingType]: [...currentPacking, item] }); setNewPackingItem(""); }} className="mt-4 flex gap-2"><input value={newPackingItem} onChange={(event) => setNewPackingItem(event.target.value)} placeholder={ko ? "준비물 추가" : "Add an item"} className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm"/><button className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{ko ? "추가" : "Add"}</button></form>
        </section>
      </div>
    </main>
  );
}

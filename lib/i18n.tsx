"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "ko" | "en";
type Dictionary = Record<string, string>;

const ko: Dictionary = {
  overview: "개요",
  trips: "여행",
  worldMap: "세계지도",
  language: "언어",
  korean: "한국어",
  english: "English",
  settings: "설정",
  account: "계정",
  appDescription: "여행 전·중·후를 한 곳에서 관리하는 여행 기록 앱",
  myTrips: "내 여행",
  newTrip: "새 여행",
  createTrip: "여행 만들기",
  whereGoing: "어디로 떠나나요?",
  tripName: "여행 이름",
  country: "국가",
  city: "도시",
  startDate: "시작일",
  endDate: "종료일",
  create: "여행 생성 →",
  creating: "생성 중…",
  myJourneys: "나의 여행",
  everyPlace: "모든 장소에는 간직할 이야기가 있습니다.",
  travelArchive: "여행 기록 보관함",
  openTrip: "여행 열기 →",
  before: "여행 전",
  during: "여행 중",
  after: "여행 후",
  getReady: "준비하기",
  makeMemories: "추억 만들기",
  keepStory: "기록 남기기",
  openSection: "열기 →",
  tripOverview: "여행 개요",
  world: "나의 세계",
  newChapter: "새로운 장",
  nextAdventure: "다음 여행",
  readyMemories: "새로운 추억을 만들 준비가 되었나요?",
  travelBeautifully: "여행을 아름답게 기록하세요",
  planning: "준비 중",
  completed: "완료",
  today: "오늘",
  schedule: "일정",
  map: "지도",
  souvenirs: "기념품",
  weather: "날씨",
  addExpense: "지출 추가",
  addPlace: "장소 추가",
  save: "저장",
  delete: "삭제",
  close: "닫기",
  noData: "아직 데이터가 없습니다.",
  rlsError:
    "Supabase 권한 설정이 필요합니다. Supabase SQL Editor에서 supabase/rls.sql을 실행하세요.",
  error: "오류가 발생했습니다.",
};

const en: Dictionary = {
  overview: "Overview",
  trips: "Trips",
  worldMap: "World map",
  language: "Language",
  korean: "한국어",
  english: "English",
  settings: "Settings",
  account: "Account",
};

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}>({ language: "ko", setLanguage: () => undefined, t: (key) => key });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ko");
  useEffect(() => {
    const saved = window.localStorage.getItem("voyage:language");
    if (saved === "ko" || saved === "en") setLanguageState(saved);
  }, []);
  useEffect(() => {
    window.localStorage.setItem("voyage:language", language);
    document.documentElement.lang = language;
  }, [language]);
  const setLanguage = (next: Language) => setLanguageState(next);
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => (language === "ko" ? ko[key] : en[key]) || key,
    }),
    [language],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

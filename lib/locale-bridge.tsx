"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n";

const ko: Record<string, string> = {
  Overview: "개요", Today: "오늘", Schedule: "일정", Map: "지도", Souvenirs: "기념품", Weather: "날씨", Preparation: "준비", "Budget & exchange": "예산·환전", Reservations: "예약",
  "Trip overview": "여행 개요", "During the trip": "여행 중", "Before the trip": "여행 전", "After the trip": "여행 후", "Trip map": "여행 지도", "Map marker": "지도 표시",
  "Get ready": "준비하기", "Make memories": "추억 만들기", "Keep the story": "기록 남기기", "Open section →": "열기 →", "Open trip →": "여행 열기 →", "Your next adventure": "다음 여행", "Travel archive": "여행 기록", "Mark trip completed": "여행 완료 처리", "Saving…": "저장 중…", "Trip snapshot": "여행 한눈에 보기", "A little more ready every day.": "매일 조금씩 더 준비돼요.",
  "Every place, in one view.": "모든 장소를 한눈에.", "Markers use saved coordinates when available.": "저장된 좌표가 있으면 지도에 표시됩니다.", "Saved places map": "저장한 장소 지도", "No memo yet.": "아직 메모가 없습니다.", "Not set": "설정되지 않음", "No address": "주소 없음",
  "Your world, in stories.": "이야기로 채워지는 나의 세계", "completed trips": "완료한 여행", "journeys in your archive": "개의 여행이 기록되어 있어요", "Every pin holds a memory.": "모든 핀에는 추억이 담겨 있어요.", "Click a pin to revisit the trip.": "핀을 눌러 여행을 다시 돌아보세요.", "Your journeys": "나의 여행", "Travel Archive": "여행 기록 보관함", "View trips →": "여행 보기 →", "Dates to be planned": "날짜를 정해 주세요", "No rating": "평점 없음", places: "곳", food: "식사", "New trip": "새 여행",
  "Take care of the details.": "세부 사항을 챙겨보세요.", "The small tasks that make the journey smoother.": "여행을 더 편하게 만드는 작은 준비들입니다.", "Preparation checklist": "여행 준비 체크리스트", "Add task": "할 일 추가", Delete: "삭제", Save: "저장", "Cancel editing": "편집 취소",
  "Plan your exchange": "환전 계획", "Currency plan": "환전 계획", "Manual rate for MVP": "MVP용 수동 환율", From: "출발 통화", To: "도착 통화", Rate: "환율", "Expected cash": "예상 현금", "Card estimate": "카드 예상액", "Actual exchanged": "실제 환전액", "Save currency plan": "환전 계획 저장",
  "Reservation tracker": "예약 관리", "Add reservation": "예약 추가", "Confirmation number": "예약 번호", "Save reservation": "예약 저장", Flight: "항공편", Hotel: "호텔", Activity: "활동",
  "Shape every day.": "매일의 일정을 만들어 보세요.", "Add a date, then click any card to edit it.": "날짜를 추가하고 카드를 눌러 수정하세요.", "What are you doing?": "무엇을 하나요?", "Any time": "시간 미정", "No place linked": "연결된 장소 없음", "Click to edit": "눌러서 수정", Add: "추가", "Edit itinerary →": "일정 수정 →", "No days planned yet. Add your first schedule item above.": "아직 계획된 날짜가 없습니다. 위에서 첫 일정을 추가하세요.",
  "Pack for the days ahead.": "앞으로의 날들을 준비하세요.", "Each forecast is paired with that day’s itinerary.": "날씨와 해당 날짜의 일정을 함께 확인하세요.", "Day plan": "오늘 일정", "No schedule for this day.": "이 날짜의 일정이 없습니다.", "No weather data yet. Add a weather provider when you are ready.": "아직 날씨 데이터가 없습니다.",
  "Little things to bring home.": "여행에서 가져올 작은 기억들.", "Track the idea, the purchase and the memory.": "아이디어부터 구매와 추억까지 기록하세요.", "Souvenir name": "기념품 이름", "Estimated price": "예상 가격", "Actual price (optional)": "실제 가격 (선택)", Memo: "메모", "Add item": "항목 추가", Purchased: "구매 완료", "Mark purchased": "구매 완료로 표시", "not purchased": "미구매", Places: "장소", Spent: "지출", "Must go": "필수 방문", "Must Go": "필수 방문", Visited: "방문 완료", "Mark visited": "방문 완료로 표시", "No spend yet": "아직 지출 없음", "No data yet.": "아직 데이터가 없습니다.",
  "Trip weather": "여행 날씨", "Today’s plan": "오늘의 일정", Expense: "지출", expenses: "건의 지출", "No plans for today yet.": "오늘 일정이 아직 없습니다.", "Map & places": "지도와 장소", "Your places": "나의 장소", "Open map →": "지도 열기 →", "View trip stats →": "여행 통계 보기 →", "Add expense": "지출 추가", "Save expense": "지출 저장", "Place name": "장소 이름", Address: "주소", "Expected cost": "예상 비용", Latitude: "위도", Longitude: "경도", "Save place": "장소 저장", Sightseeing: "관광", Restaurant: "식당", Cafe: "카페", Shopping: "쇼핑", Transport: "교통", Stay: "숙박", Other: "기타", "No place": "장소 없음", "Unlinked expense": "연결되지 않은 지출",
};
const originalText = new WeakMap<Node, string>();
const originalPlaceholder = new WeakMap<Element, string>();

export function LocaleBridge() {
  const { language } = useLanguage();
  useEffect(() => {
    const translate = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (!originalText.has(node)) originalText.set(node, node.nodeValue || "");
        const source = originalText.get(node) || "";
        let translated = source;
        if (language === "ko") Object.keys(ko).sort((a, b) => b.length - a.length).forEach((key) => { translated = translated.replaceAll(key, ko[key]); });
        node.nodeValue = translated;
      }
      document.querySelectorAll<HTMLElement>("input[placeholder], textarea[placeholder]").forEach((element) => { if (!originalPlaceholder.has(element)) originalPlaceholder.set(element, element.getAttribute("placeholder") || ""); let value = originalPlaceholder.get(element) || ""; if (language === "ko") Object.keys(ko).sort((a, b) => b.length - a.length).forEach((key) => { value = value.replaceAll(key, ko[key]); }); element.setAttribute("placeholder", value); });
      document.querySelectorAll<HTMLInputElement>('input[type="date"]').forEach((element) => { element.lang = language === "ko" ? "ko-KR" : "en-US"; });
    };
    translate();
    const observer = new MutationObserver(translate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  return null;
}

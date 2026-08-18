export type PackingDefaultSet = { domestic: string[]; international: string[] };

export const defaultPackingLists: PackingDefaultSet = {
  domestic: ["여벌옷", "속옷", "양말", "세면도구", "충전기", "지갑", "신분증"],
  international: ["여벌옷", "속옷", "양말", "세면도구", "충전기", "여권", "여행자보험 증서", "해외 결제 카드", "상비약"],
};

export const PACKING_DEFAULTS_KEY = "voyage:packing-defaults";

export function readPackingDefaults(): PackingDefaultSet {
  if (typeof window === "undefined") return defaultPackingLists;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PACKING_DEFAULTS_KEY) || "null");
    return parsed?.domestic && parsed?.international ? parsed : defaultPackingLists;
  } catch {
    return defaultPackingLists;
  }
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTripData } from "@/lib/trip-context";
import { AirportSelect } from "@/app/components/airport-select";
import { ReservationDocuments } from "@/app/components/reservation-documents";
import { useLanguage } from "@/lib/i18n";
import { formatDate } from "@/lib/date";

const control = "rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm";
const reservationColors = ["#BAE6FD", "#DDD6FE", "#BBF7D0", "#FED7AA", "#FBCFE8", "#FEF3C7", "#C7D2FE", "#A7F3D0"];
type Form = { title: string; type: string; date: string; endDate: string; time: string; location: string; departureLocation: string; arrivalLocation: string; departureTime: string; arrivalTime: string; airline: string; terminal: string; reservationNumber: string; memo: string; link: string };
const blank: Form = { title: "", type: "Tour", date: "", endDate: "", time: "", location: "", departureLocation: "", arrivalLocation: "", departureTime: "", arrivalTime: "", airline: "", terminal: "", reservationNumber: "", memo: "", link: "" };
const isStayType = (type: string) => ["stay", "숙박", "hotel", "호텔", "accommodation"].includes(type.trim().toLowerCase());
const dateValue = (value: string | undefined) => value ? value.slice(0, 10) : "";
const timeValue = (value: string | undefined) => value ? value.slice(0, 5) : "";
const dateText = (value: string | undefined, ko: boolean) => {
  const normalized = dateValue(value);
  return normalized ? formatDate(normalized) : (ko ? "미정" : "Pending");
};
function DateField({ value, onChange, label, required = false }: { value: string; onChange: (value: string) => void; label: string; required?: boolean }) {
  return <label className="text-xs font-bold">{label}<input required={required} type="date" value={value} onChange={(event) => onChange(event.target.value)} className={`mt-2 w-full ${control}`} /></label>;
}

export default function ReservationsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { language } = useLanguage();
  const ko = language === "ko";
  const { state, addReservation, updateReservation, removeReservation, addReservationCategory, renameReservationCategory, removeReservationCategory, updateReservationCategoryColor } = useTripData();
  const [form, setForm] = useState<Form>(blank);
  const [files, setFiles] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  useEffect(() => {
    if (state.reservationCategories.length && !state.reservationCategories.includes(form.type)) {
      setForm((current) => ({ ...current, type: state.reservationCategories[0] }));
    }
  }, [form.type, state.reservationCategories]);
  const flightTitle = form.departureLocation && form.arrivalLocation ? `${form.departureLocation.split(" · ")[0]} → ${form.arrivalLocation.split(" · ")[0]}` : "";
  const close = () => { setOpen(false); setEditingId(null); setForm(blank); setFiles([]); setFormError(""); };
  const openNew = () => { setEditingId(null); setForm(blank); setFiles([]); setFormError(""); setOpen(true); };
  const uploadFiles = async (reservationId: string) => {
    for (const file of files) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/trips/${tripId}/reservations/${reservationId}/documents`, { method: "POST", body });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "첨부파일 업로드에 실패했어요.");
      }
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    const stay = isStayType(form.type);
    if (!form.date || (stay && (!form.endDate || !form.time || !form.arrivalTime)) || (form.type === "Flight" && (!form.endDate || !form.departureLocation || !form.arrivalLocation))) {
      setFormError(ko ? "숙박은 체크인·체크아웃 날짜와 시간을 모두 입력해 주세요." : "Enter both check-in and check-out dates and times.");
      return;
    }
    const reservation = { ...form, title: form.type === "Flight" ? flightTitle : form.title.trim(), cost: 0 };
    if (!reservation.title) {
      setFormError(ko ? "예약 이름을 입력해 주세요." : "Enter a reservation name.");
      return;
    }
    const reservationId = editingId || addReservation(reservation);
    if (editingId) updateReservation(editingId, reservation);
    try {
      await uploadFiles(reservationId);
      close();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "첨부파일 업로드에 실패했어요.");
    }
  };
  const editReservation = (item: (typeof state.reservations)[number]) => { setEditingId(item.id); setForm({ ...blank, ...item, date: dateValue(item.date), endDate: dateValue(item.endDate), time: timeValue(item.time), departureTime: timeValue(item.departureTime), arrivalTime: timeValue(item.arrivalTime) }); setFiles([]); setFormError(""); setOpen(true); };
  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    addReservationCategory(name);
    setForm((current) => ({ ...current, type: name }));
    setNewCategory("");
  };
  const openCategoryManager = () => {
    setCategoryDrafts(Object.fromEntries(state.reservationCategories.map((name) => [name, name])));
    setCategoryManagerOpen(true);
  };
  const saveCategories = () => {
    state.reservationCategories.forEach((name) => {
      const next = categoryDrafts[name]?.trim();
      if (next && next !== name && !state.reservationCategories.includes(next)) renameReservationCategory(name, next);
    });
    setCategoryManagerOpen(false);
  };

  return <main className="min-h-screen px-5 py-8 pb-16 sm:px-10 lg:px-20 lg:py-12"><div className="mx-auto max-w-4xl">
    <Link href={`/trips/${tripId}/before`} className="text-sm font-bold text-[var(--color-primary)]">← {ko ? "여행 전 개요" : "Before overview"}</Link>
    <div className="mt-10 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-3">{ko ? "예약 관리" : "Reservations"}</p><h1 className="text-4xl font-bold">{ko ? "예약을 한곳에 모아둬요." : "Keep every reservation close."}</h1><p className="mt-2 muted">{ko ? "항공권, 호텔, 투어 예약과 파일을 함께 보관하세요." : "Store flights, stays, tours and their files together."}</p></div><button type="button" onClick={openNew} className="rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white">+ {ko ? "예약 추가" : "Add reservation"}</button></div>
    <section className="mt-8"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold">{ko ? "저장된 예약" : "Saved reservations"}</h2><span className="text-sm muted">{state.reservations.length}{ko ? "건" : " items"}</span></div>{state.reservations.length ? <div className="space-y-3">{state.reservations.map((item) => { const kind = item.type.toLowerCase(); const stay = isStayType(item.type); const categoryColor = state.reservationCategoryColors[item.type] || "transparent"; return <article className="card border-l-4 p-6" style={{ borderLeftColor: categoryColor }} key={item.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow mb-2"><span className="rounded-full px-2 py-1" style={{ backgroundColor: categoryColor === "transparent" ? "var(--color-surface-muted)" : categoryColor }}>{item.type}</span></p><h3 className="text-xl font-bold">{item.title}</h3></div><button type="button" onClick={() => removeReservation(item.id)} className="text-xs font-bold text-[var(--color-danger)]">{ko ? "삭제" : "Delete"}</button></div><div className="mt-4 grid gap-2 text-sm muted sm:grid-cols-2">{kind === "flight" ? <span className="flex min-w-0 items-center gap-2 sm:col-span-2"><span aria-hidden="true">✈</span><span className="min-w-0 flex-1 truncate">{item.departureLocation || "—"} · {dateText(item.date, ko)} {timeValue(item.departureTime) || "—"}</span><span aria-hidden="true">→</span><span className="min-w-0 flex-1 truncate text-right">{item.arrivalLocation || "—"} · {dateText(item.endDate || item.date, ko)} {timeValue(item.arrivalTime) || "—"}</span></span> : <span>▣ {stay ? (ko ? "체크인" : "Check-in") : (ko ? "예약일" : "Date")}: {dateText(item.date, ko)}{timeValue(item.time) ? ` · ${timeValue(item.time)}` : ""}</span>}{stay && <span>⌂ {ko ? "체크아웃" : "Check-out"}: {dateText(item.endDate, ko)}{timeValue(item.arrivalTime) ? ` · ${timeValue(item.arrivalTime)}` : ""}</span>}<span>⌖ {item.location || (ko ? "장소 미정" : "Location pending")}{item.terminal ? ` · ${item.terminal}` : ""}</span>{item.airline && <span>✈ {item.airline}</span>}<span>№ {item.reservationNumber || (ko ? "예약번호 없음" : "No confirmation number")}</span>{item.link && <a href={item.link} target="_blank" rel="noreferrer" className="font-bold text-[var(--color-primary)]">{ko ? "예약 링크 열기 →" : "Open booking link →"}</a>}</div>{item.memo && <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm leading-6 muted">{item.memo}</p>}<ReservationDocuments tripId={tripId} reservationId={item.id} /><div className="mt-5 flex justify-end border-t border-[var(--color-border)] pt-4"><button type="button" onClick={() => editReservation(item)} className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-bold text-[var(--color-primary)]">✎ {ko ? "수정" : "Edit"}</button></div></article>; })}</div> : <div className="card p-10 text-center"><p className="text-lg font-bold">{ko ? "아직 저장된 예약이 없어요." : "No reservations yet."}</p><p className="mt-2 text-sm muted">{ko ? "예약 추가 버튼으로 항공권, 호텔 또는 투어를 등록해 보세요." : "Add a flight, hotel or tour reservation to get started."}</p><button type="button" onClick={openNew} className="mt-5 rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold text-[var(--color-primary)]">+ {ko ? "첫 예약 추가" : "Add your first reservation"}</button></div>}</section>
    <section className="card mt-5 p-6"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow mb-1">{ko ? "예약 카테고리" : "Reservation categories"}</p><p className="text-xs muted">{ko ? "예약 종류를 원하는 이름으로 관리할 수 있어요." : "Customize the reservation types used in this trip."}</p></div><button type="button" onClick={openCategoryManager} className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-bold">{ko ? "관리" : "Manage"}</button></div><form onSubmit={addCategory} className="mt-4 flex gap-2"><input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder={ko ? "새 예약 카테고리" : "New reservation category"} className={`min-w-0 flex-1 ${control}`} /><button className="rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-white">{ko ? "추가" : "Add"}</button></form><div className="mt-3 flex flex-wrap gap-2">{state.reservationCategories.map((name) => <span key={name} className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ backgroundColor: state.reservationCategoryColors[name] || "var(--color-surface-muted)" }}>{name}</span>)}</div></section>
    {categoryManagerOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5 py-6"><div className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6" role="dialog" aria-modal="true" aria-labelledby="reservation-category-dialog-title"><div className="flex items-start justify-between"><div><h2 id="reservation-category-dialog-title" className="text-xl font-bold">{ko ? "예약 카테고리 관리" : "Manage reservation categories"}</h2><p className="mt-1 text-xs muted">{ko ? "이름과 색상을 바꾸거나 삭제할 수 있어요." : "Rename, recolor, or remove categories."}</p></div><button type="button" onClick={() => setCategoryManagerOpen(false)} className="text-2xl">×</button></div><div className="mt-5 space-y-3">{state.reservationCategories.map((name) => <div key={name} className="rounded-xl border border-[var(--color-border)] p-3"><div className="flex items-center gap-2"><input value={categoryDrafts[name] ?? name} onChange={(event) => setCategoryDrafts((current) => ({ ...current, [name]: event.target.value }))} className={`min-w-0 flex-1 ${control}`} /><button type="button" disabled={state.reservationCategories.length === 1} onClick={() => removeReservationCategory(name)} className="rounded-lg border border-[var(--color-danger)] px-2.5 py-2 text-xs font-bold text-[var(--color-danger)] disabled:opacity-30">×</button></div><div className="mt-3 flex flex-wrap gap-2">{reservationColors.map((color) => <button key={color} type="button" onClick={() => updateReservationCategoryColor(name, color)} className={`size-7 rounded-full border-2 ${state.reservationCategoryColors[name] === color ? "border-black" : "border-white"}`} style={{ backgroundColor: color }} aria-label={`${name} ${color}`} />)}</div></div>)}</div><div className="mt-5 flex justify-end gap-2 border-t border-[var(--color-border)] pt-4"><button type="button" onClick={() => setCategoryManagerOpen(false)} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-bold">{ko ? "닫기" : "Close"}</button><button type="button" onClick={saveCategories} className="rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white">{ko ? "이름 저장" : "Save names"}</button></div></div></div>}
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5 py-6"><div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="reservation-dialog-title"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow mb-2">{ko ? (editingId ? "예약 수정" : "예약 추가") : (editingId ? "Edit reservation" : "Add reservation")}</p><h2 id="reservation-dialog-title" className="text-2xl font-bold">{ko ? "예약 정보를 입력해요." : "Add a reservation."}</h2></div><button type="button" onClick={close} className="text-2xl" aria-label={ko ? "닫기" : "Close"}>×</button></div><form onSubmit={save} className="mt-6 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold sm:col-span-2">{ko ? "예약 이름" : "Reservation name"}{form.type === "Flight" ? <input readOnly value={flightTitle} placeholder={ko ? "출발지와 도착지를 선택하면 자동 입력돼요" : "Select departure and arrival airports"} className={`mt-2 w-full ${control}`} /> : <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={ko ? "예: 다낭 호텔" : "e.g. Da Nang hotel"} className={`mt-2 w-full ${control}`} />}</label><label className="text-xs font-bold">{ko ? "종류" : "Type"}<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value, endDate: "" })} className={`mt-2 w-full ${control}`}>{state.reservationCategories.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>{!isStayType(form.type) && form.type !== "Flight" && <label className="text-xs font-bold">{ko ? "예약 시간" : "Reservation time"}<input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className={`mt-2 w-full ${control}`} /></label>}{isStayType(form.type) ? <><DateField label={ko ? "체크인 날짜" : "Check-in date"} required value={form.date} onChange={(value) => setForm({ ...form, date: value })} /><label className="text-xs font-bold">{ko ? "체크인 시간" : "Check-in time"}<input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className={`mt-2 w-full ${control}`} /></label><DateField label={ko ? "체크아웃 날짜" : "Check-out date"} required value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })} /><label className="text-xs font-bold">{ko ? "체크아웃 시간" : "Check-out time"}<input required type="time" value={form.arrivalTime} onChange={(event) => setForm({ ...form, arrivalTime: event.target.value })} className={`mt-2 w-full ${control}`} /></label></> : form.type === "Flight" ? <><DateField label={ko ? "출발일" : "Departure date"} required value={form.date} onChange={(value) => setForm({ ...form, date: value })} /><DateField label={ko ? "도착일" : "Arrival date"} required value={form.endDate} onChange={(value) => setForm({ ...form, endDate: value })} /></> : <DateField label={ko ? "예약일" : "Reservation date"} required value={form.date} onChange={(value) => setForm({ ...form, date: value })} />}{form.type === "Flight" && <><AirportSelect label={ko ? "출발지" : "Departure airport"} required value={form.departureLocation} onChange={(value) => setForm({ ...form, departureLocation: value })} /><label className="text-xs font-bold">{ko ? "출발시간" : "Departure time"}<input required type="time" value={form.departureTime} onChange={(event) => setForm({ ...form, departureTime: event.target.value })} className={`mt-2 w-full ${control}`} /></label><AirportSelect label={ko ? "도착지" : "Arrival airport"} required value={form.arrivalLocation} onChange={(value) => setForm({ ...form, arrivalLocation: value })} /><label className="text-xs font-bold">{ko ? "도착시간" : "Arrival time"}<input required type="time" value={form.arrivalTime} onChange={(event) => setForm({ ...form, arrivalTime: event.target.value })} className={`mt-2 w-full ${control}`} /></label><label className="text-xs font-bold">{ko ? "항공사" : "Airline"}<input value={form.airline} onChange={(event) => setForm({ ...form, airline: event.target.value })} placeholder="Vietnam Airlines" className={`mt-2 w-full ${control}`} /></label><label className="text-xs font-bold">{ko ? "터미널" : "Terminal"}<input value={form.terminal} onChange={(event) => setForm({ ...form, terminal: event.target.value })} placeholder="T2" className={`mt-2 w-full ${control}`} /></label></>}{form.type !== "Flight" && <label className="text-xs font-bold">{ko ? "장소" : "Location"}<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder={ko ? "주소 또는 장소" : "Address or place"} className={`mt-2 w-full ${control}`} /></label>}<label className="text-xs font-bold">{ko ? "예약번호" : "Confirmation number"}<input value={form.reservationNumber} onChange={(event) => setForm({ ...form, reservationNumber: event.target.value })} placeholder={ko ? "선택 입력" : "Optional"} className={`mt-2 w-full ${control}`} /></label><label className="text-xs font-bold sm:col-span-2">{ko ? "예약 링크" : "Booking link"}<input type="url" value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} placeholder="https://..." className={`mt-2 w-full ${control}`} /></label><label className="text-xs font-bold sm:col-span-2">{ko ? "첨부파일" : "Attachments"}<input type="file" multiple accept="image/*,application/pdf,.pdf" onChange={(event) => setFiles(Array.from(event.target.files || []))} className={`mt-2 block w-full ${control}`} /><span className="mt-1 block text-xs muted">{files.length ? `${files.length}개 파일 선택됨` : "사진 또는 PDF, 파일당 10MB 이하"}</span></label><label className="text-xs font-bold sm:col-span-2">{ko ? "메모" : "Memo"}<textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} placeholder={ko ? "선택 입력" : "Optional"} className={`mt-2 min-h-20 w-full resize-none ${control}`} /></label>{formError && <p className="text-sm font-semibold text-[var(--color-danger)] sm:col-span-2">{formError}</p>}<div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4 sm:col-span-2"><button type="button" onClick={close} className="rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-bold">{ko ? "취소" : "Cancel"}</button><button className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white">{ko ? (editingId ? "수정 저장" : "예약 저장") : (editingId ? "Save changes" : "Save reservation")}</button></div></form></div></div>}
  </div></main>;
}

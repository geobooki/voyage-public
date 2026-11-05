"use client";

import Link from "next/link";
import { ScheduleTypeSelect } from "@/app/components/schedule-type-select";
import { scheduleTimes, fiveMinuteTime, timingFromDuration, timingFromEnd, usesScheduleDuration, endTimeOptions, scheduleDurationPreset } from "@/lib/schedule-time";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useTripData } from "@/lib/trip-context";
import { useLanguage } from "@/lib/i18n";
import { TripScheduleCalendar } from "@/app/components/trip-schedule-calendar";
import { ReservationDocuments } from "@/app/components/reservation-documents";
import { useTripMeta } from "@/lib/use-trip-meta";
import type { Reservation, ScheduleItem } from "@/types/trip";

type ScheduleForm = {
  date: string;
  title: string;
  time: string;
  endTime: string;
  durationMinutes: string;
  type: string;
  placeId?: string;
  note: string;
};
const control =
  "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm box-border";

export default function SchedulePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const [recordExpense, setRecordExpense] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { language } = useLanguage();
  const ko = language === "ko";
  const trip = useTripMeta(tripId);
  const isDomestic = trip.destinationCurrency === "KRW";
  const {
    state,
    addSchedule,
    saveScheduleActivity,
    updateSchedule,
    updateReservation,
    removeSchedule,
  } = useTripData();
  const tripDates = useMemo(() => {
    if (!trip.startDate || !trip.endDate) return [];
    const dates: string[] = [];
    const cursor = new Date(`${trip.startDate}T00:00:00`);
    const end = new Date(`${trip.endDate}T00:00:00`);
    while (cursor <= end && dates.length < 31) {
      dates.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }, [trip.startDate, trip.endDate]);
  const defaultDate = tripDates[0] || state.weather[0]?.date || new Date().toISOString().slice(0, 10);
  const empty = (): ScheduleForm => ({
    date: defaultDate,
    title: "",
    time: "09:00",
    endTime: "10:00",
    durationMinutes: "60",
    type: "관광",
    placeId: "",
    note: "",
  });
  const [item, setItem] = useState<ScheduleForm>(() => empty());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schedulePage, setSchedulePage] = useState(0);
  const dates = tripDates.length ? tripDates : Array.from(
    new Set([
      ...state.schedule.map((entry) => entry.date),
      ...state.weather.map((day) => day.date),
      ...state.reservations.flatMap((reservation) => [reservation.date, reservation.endDate]),
    ]),
  ).filter((date): date is string => Boolean(date)).sort();
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!item.title.trim() || !item.date || !item.time) return;
    const current = state.schedule.find((entry) => entry.id === editingId);
    const value = {
      ...item,
      time: fiveMinuteTime(item.time),
      title: item.title.trim(),
      note: item.note.trim(),
      endTime: (usesScheduleDuration(item.type) || Boolean(scheduleDurationPreset(item.type)) || Boolean(editingId && state.schedule.find((entry) => entry.id === editingId)?.durationMinutes)) ? timingFromDuration(item.time, item.durationMinutes || "60").endTime : undefined,
      durationMinutes: (usesScheduleDuration(item.type) || Boolean(scheduleDurationPreset(item.type)) || Boolean(editingId && state.schedule.find((entry) => entry.id === editingId)?.durationMinutes)) ? Math.max(5, Math.round(Number(item.durationMinutes || 60) / 5) * 5) : undefined,
      completed: current?.completed ?? false,
    };
    if (recordExpense) {
      setSaving(true); setSaveError("");
      try {
        const id = await saveScheduleActivity(value, editingId || undefined);
        router.push(`/trips/${tripId}/before/budget?schedule=${encodeURIComponent(id)}`);
      } catch (caught) { setSaveError(caught instanceof Error ? caught.message : "일정을 저장하지 못했어요."); setSaving(false); }
      return;
    }
    if (editingId) updateSchedule(editingId, value);
    else addSchedule(value);
    setItem(empty());
    setEditingId(null);
  };
  const edit = (entry: ScheduleItem) => {
    setEditingId(entry.id);
    setItem({
      date: entry.date,
      title: entry.title,
      time: fiveMinuteTime(entry.time),
      ...timingFromDuration(fiveMinuteTime(entry.time), String(entry.durationMinutes || scheduleDurationPreset(entry.type) || 60)),
      ...(entry.endTime ? timingFromEnd(fiveMinuteTime(entry.time), entry.endTime) : {}),
      type: entry.type,
      placeId: entry.placeId ?? "",
      note: entry.note,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const schedulePageCount = Math.max(1, Math.ceil(dates.length / 3));
  const visibleDesktopDates = dates.slice(schedulePage * 3, schedulePage * 3 + 3);
  const openAt = (date: string, time: string) => {
    setEditingId(null);
    setItem({ ...empty(), date, time, ...timingFromDuration(time, "60") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <main
      data-section="schedule-board"
      className="min-h-screen px-5 py-8 pb-28 sm:px-10 sm:pb-16 lg:px-20 lg:py-12"
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/trips/${tripId}/during`}
          className="text-sm font-bold text-[var(--color-primary)]"
        >
          ← 여행 중
        </Link>
        <p className="eyebrow mt-10 mb-3">여행 일정</p>
        <h1 className="text-4xl font-bold">여행 일정 추가</h1>
        <p className="mt-2 muted">
          일정을 추가하면 메인 여행 일정 타임테이블에도 똑같이 표시됩니다.
        </p>
        <form onSubmit={save} className="card mt-9 space-y-4 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold">날짜<input required type="date" value={item.date} onChange={(event) => setItem({ ...item, date: event.target.value })} className={`mt-2 ${control}`} /></label>
            <label className="text-sm font-bold">시간<select required aria-label="시간 (5분 단위)" value={item.time} onChange={(event) => setItem({ ...item, time: event.target.value, ...timingFromDuration(event.target.value, item.durationMinutes) })} className={`mt-2 ${control}`}>{scheduleTimes.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
          </div>
          {(usesScheduleDuration(item.type) || Boolean(scheduleDurationPreset(item.type)) || Boolean(editingId && state.schedule.find((entry) => entry.id === editingId)?.durationMinutes)) && <>
          <label className="block text-sm font-bold">소요시간 <span className="font-normal muted">(선택)</span><div className="mt-2 flex items-center gap-2"><input type="number" min="5" max="1440" step="5" value={item.durationMinutes} onChange={(event) => setItem({ ...item, ...timingFromDuration(item.time, event.target.value), durationMinutes: event.target.value })} placeholder="예: 90" className={`max-w-xs ${control}`} /><span className="text-sm muted">분</span></div></label>
          <label className="block text-sm font-bold">종료시간 <span className="font-normal muted">(선택 · 소요시간과 자동 계산)</span><select value={item.endTime} onChange={(event) => setItem({ ...item, ...timingFromEnd(item.time, event.target.value) })} className={`mt-2 ${control}`}><option value="">선택 안 함</option>{item.endTime && !endTimeOptions.includes(item.endTime) && <option hidden value={item.endTime}>{item.endTime}</option>}{endTimeOptions.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
          {item.endTime && item.endTime <= item.time && <p className="text-xs muted">종료시간은 다음 날 기준이에요.</p>}
          </>}
          <div className="grid gap-3 sm:grid-cols-2">
            <ScheduleTypeSelect tripId={tripId} value={item.type} knownTypes={state.schedule.map((entry) => entry.type)} onChange={(type) => setItem({ ...item, type, ...(scheduleDurationPreset(type) ? timingFromDuration(item.time, String(scheduleDurationPreset(type))) : {}) })} />
            <label className="text-sm font-bold">장소<select value={item.placeId} onChange={(event) => setItem({ ...item, placeId: event.target.value })} className={`mt-2 ${control}`}><option value="">장소 없음</option>{state.places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
          </div>
          <label className="block text-sm font-bold">무엇을 하는지<input required value={item.title} onChange={(event) => setItem({ ...item, title: event.target.value })} placeholder="예: 바나힐 케이블카 타기" className={`mt-2 ${control}`} /></label>
          <label className="block text-sm font-bold">메모 <span className="font-normal muted">(선택)</span><textarea value={item.note} onChange={(event) => setItem({ ...item, note: event.target.value })} placeholder="준비물이나 예약 정보를 적어두세요" rows={3} className={`mt-2 ${control}`} /></label>
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={recordExpense} onChange={(event) => setRecordExpense(event.target.checked)}/>{ko ? "저장 후 이 일정의 지출 기록" : "Record spending after saving"}</label>
          {saveError && <p role="alert" className="text-xs text-[var(--color-danger)]">{saveError}</p>}
          <div className="flex flex-wrap gap-2">
            <button disabled={saving} className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-sm font-bold text-white sm:w-auto">{saving ? "저장 중…" : recordExpense ? "저장하고 지출 기록" : editingId ? "저장" : "일정 추가"}</button>
            {editingId && <button type="button" onClick={() => { if (window.confirm("이 일정을 삭제할까요?")) { removeSchedule(editingId); setEditingId(null); setItem(empty()); } }} className="rounded-xl border border-[var(--color-danger)] px-4 py-3 text-sm font-bold text-[var(--color-danger)]">삭제</button>}
          </div>
        </form>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setItem(empty());
            }}
            className="mt-3 text-sm font-bold text-[var(--color-primary)]"
          >
            편집 취소
          </button>
        )}
        {dates.length > 0 && <section data-section="trip-schedule-board" className="card mt-7 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow mb-2">{ko ? "여행 일정" : "Trip schedule"}</p><h2 className="text-2xl font-bold">{ko ? "날짜별로 여행을 채워요." : "Build the trip day by day."}</h2><p className="mt-2 text-sm muted">{ko ? "시간을 누르면 그 시간에 일정을 추가할 수 있어요." : "Click a time to add a plan."}</p></div>
            <div className="hidden items-center gap-2 md:flex"><button type="button" onClick={() => setSchedulePage((current) => Math.max(0, current - 1))} disabled={schedulePage === 0} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold disabled:opacity-30" aria-label={ko ? "이전 3일" : "Previous three days"}>‹</button><span className="text-xs font-bold muted">{schedulePage * 3 + 1}–{Math.min((schedulePage + 1) * 3, dates.length)} / {dates.length}{ko ? "일" : " days"}</span><button type="button" onClick={() => setSchedulePage((current) => Math.min(schedulePageCount - 1, current + 1))} disabled={schedulePage >= schedulePageCount - 1} className="grid size-9 place-items-center rounded-full border border-[var(--color-border)] text-lg font-bold disabled:opacity-30" aria-label={ko ? "다음 3일" : "Next three days"}>›</button></div>
          </div>
          <div className="hidden md:block"><TripScheduleCalendar dates={visibleDesktopDates} schedule={state.schedule} reservations={state.reservations} ko={ko} onAdd={openAt} onReservationClick={(_reservation: Reservation) => undefined} onScheduleClick={edit} onScheduleChange={(entry, changes) => updateSchedule(entry.id, { ...entry, ...changes })} onReservationChange={(entry, changes) => updateReservation(entry.id, { ...entry, ...changes })} /></div>
          <div className="md:hidden"><TripScheduleCalendar dates={[dates[0]]} schedule={state.schedule} reservations={state.reservations} ko={ko} onAdd={openAt} onReservationClick={(_reservation: Reservation) => undefined} onScheduleClick={edit} onScheduleChange={(entry, changes) => updateSchedule(entry.id, { ...entry, ...changes })} onReservationChange={(entry, changes) => updateReservation(entry.id, { ...entry, ...changes })} /></div>
          {isDomestic && state.schedule.length > 0 && <section className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"><p className="text-sm font-bold">일정별 첨부파일</p><p className="mt-1 text-xs muted">국내 여행은 예약 탭 대신 각 일정에 사진이나 PDF를 선택적으로 추가할 수 있어요.</p><div className="mt-3 space-y-3">{state.schedule.map((entry) => <div key={entry.id} className="rounded-xl bg-[var(--color-surface)] px-3"><p className="pt-3 text-sm font-bold">{entry.date} · {entry.title}</p><ReservationDocuments tripId={tripId} itemId={entry.id} resource="schedule" /></div>)}</div></section>}
        </section>}
        {!dates.length && (
          <div className="card mt-6 p-6 text-sm muted">
            아직 일정이 없습니다. 위에서 첫 일정을 추가하세요.
          </div>
        )}
      </div>
    </main>
  );
}

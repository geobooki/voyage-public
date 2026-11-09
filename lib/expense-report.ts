import type { Expense, Traveler } from "@/types/trip";
import type { SettlementRecords } from "./settlement-records";
import { calculateSettlements, currencyDigits } from "./settlement";
import { expenseSettlements } from "./expense-settlements";
export function buildExpenseReport(expenses: Expense[], travelers: Traveler[], records: SettlementRecords, recordsConfirmed = true) {
  const customInitial = calculateSettlements(expenses, travelers, { ...records, payments: [] });
  const settlement = calculateSettlements(expenses, travelers, records);
  const invalid = new Set(settlement.invalidPayments), names = new Map(travelers.map((person) => [person.id, person.name]));
  const payments = records.payments.map((payment) => ({ ...payment, from: names.get(payment.fromId) || "미지정 여행자", to: names.get(payment.toId) || "미지정 여행자", expense: expenses.find((expense) => expense.id === payment.expenseId)?.name || (payment.expenseId ? "삭제된 지출" : "지출 미연결"), valid: !invalid.has(payment.id) }));
  const perExpense = expenseSettlements(expenses, travelers, records);
  const currencies = [...new Set([...expenses.map((expense) => expense.currency.trim().toUpperCase() || "KRW"), ...settlement.groups.map((group) => group.currency)])].sort().map((currency) => {
    const factor = 10 ** currencyDigits(currency), sum = (amounts: number[]) => amounts.filter(Number.isFinite).reduce((total, amount) => total + Math.round(amount * factor), 0) / factor;
    const entries = expenses.filter((expense) => (expense.currency.trim().toUpperCase() || "KRW") === currency);
    const recorded = payments.filter((payment) => payment.currency.toUpperCase() === currency && payment.valid);
    const group = settlement.groups.find((entry) => entry.currency === currency), baseline = customInitial.groups.find((entry) => entry.currency === currency);
    return { currency, spent: sum(entries.filter((entry) => Number.isFinite(entry.amount)).map((entry) => entry.amount)), count: entries.length, unassigned: sum(entries.filter((entry) => !entry.payerId || !names.has(entry.payerId)).map((entry) => entry.amount)), paidSettlements: sum(recorded.map((payment) => payment.amount)), unassignedSettlements: sum(recorded.filter((payment) => !payment.expenseId).map((payment) => payment.amount)), remaining: sum((group?.transfers || []).map((transfer) => transfer.amount)), transfers: group?.transfers || [], people: travelers.map((person) => ({ ...person, paid: sum(entries.filter((entry) => entry.payerId === person.id).map((entry) => entry.amount)), share: baseline?.balances.find((entry) => entry.id === person.id)?.owed || 0, sent: sum(recorded.filter((payment) => payment.fromId === person.id).map((payment) => payment.amount)), received: sum(recorded.filter((payment) => payment.toId === person.id).map((payment) => payment.amount)), balance: group?.balances.find((entry) => entry.id === person.id)?.balance || 0 })) };
  });
  return { recordsConfirmed, currencies, payments, excluded: settlement.excluded.map(({ expense, reason }) => ({ id: expense.id, name: expense.name || expense.category, reason })), invalidPayments: settlement.invalidPayments, expenses: perExpense.map((item) => ({ ...item.expense, payer: names.get(item.expense.payerId || "") || "미지정", participants: (item.expense.participantIds || []).map((id) => names.get(id) || "미지정 여행자"), settlementPaid: item.payments.filter((payment) => !invalid.has(payment.id) && payment.currency.toUpperCase() === item.expense.currency.toUpperCase()).reduce((sum, payment) => sum + payment.amount, 0), remaining: item.transfers.reduce((sum, transfer) => sum + transfer.amount, 0), status: !recordsConfirmed ? "정산기록 미확인" : !item.valid ? "정보 확인 필요" : item.complete ? "정산완료" : item.partial ? "부분정산" : "미정산" })) };
}
export type ExpenseReport = ReturnType<typeof buildExpenseReport>;
export type ReportSnapshot = { trip: { title: string; start_date?: string; end_date?: string }; generatedAt: string; recordError?: string; report: ExpenseReport };
export function reportCsv(snapshot: ReportSnapshot) {
  const { report } = snapshot;
  const rows: (string | number)[][] = [["여행 지출·정산 보고서", snapshot.trip.title], ["생성시각", snapshot.generatedAt], ["정산기록 확인", report.recordsConfirmed ? "확인됨" : "미확인: 정산액은 확정할 수 없습니다"], [], ["통화", "지출합계", "결제자 미지정", "기록된 중간정산", "지출 미연결 정산", "남은 총정산"]];
  report.currencies.forEach((group) => rows.push([group.currency, group.spent, group.unassigned, report.recordsConfirmed ? group.paidSettlements : "미확인", report.recordsConfirmed ? group.unassignedSettlements : "미확인", report.recordsConfirmed ? group.remaining : "미확인"]));
  rows.push([], ["통화", "여행자", "실제결제액", "분담액", "중간정산 보냄", "중간정산 받음", "남은 받을금액(+)/보낼금액(-)"]);
  report.currencies.forEach((group) => group.people.forEach((person) => rows.push([group.currency, person.name, person.paid, report.recordsConfirmed ? person.share : "미확인", report.recordsConfirmed ? person.sent : "미확인", report.recordsConfirmed ? person.received : "미확인", report.recordsConfirmed ? person.balance : "미확인"])));
  rows.push([], ["날짜", "시간", "지출명", "카테고리", "결제자", "참여자", "통화", "지출금액", "해당 지출 중간정산", "해당 지출 남은정산", "정산상태", "메모"]);
  report.expenses.forEach((expense) => rows.push([expense.date, expense.time.slice(0, 5), expense.name || expense.category, expense.category, expense.payer, expense.participants.join(" / "), expense.currency, expense.amount, report.recordsConfirmed ? expense.settlementPaid : "미확인", report.recordsConfirmed ? expense.remaining : "미확인", expense.status, expense.memo]));
  rows.push([], ["정산일시", "보낸사람", "받은사람", "연결지출", "통화", "정산금액", "계산포함"]);
  report.payments.forEach((payment) => rows.push([payment.date, payment.from, payment.to, payment.expense, payment.currency, payment.amount, payment.valid ? "포함" : "확인 필요"]));
  rows.push([], ["정산 계산 제외", "사유"]);report.excluded.forEach((entry) => rows.push([entry.name, entry.reason]));
  return "\ufeff" + rows.map((row) => row.map((value) => { const raw = typeof value === "string" && /^[\s]*[=+\-@]/.test(value) ? "'" + value : String(value); return '"' + raw.replace(/"/g, '""') + '"'; }).join(",")).join("\r\n");
}

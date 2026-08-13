export type MoneyItem = { amount: number; currency?: string };

export function totalsByCurrency(items: MoneyItem[]) {
  return items.reduce<Record<string, number>>((totals, item) => {
    const currency = item.currency || "KRW";
    totals[currency] = (totals[currency] || 0) + Number(item.amount || 0);
    return totals;
  }, {});
}

export function formatTotals(items: MoneyItem[]) {
  return Object.entries(totalsByCurrency(items)).map(([currency, amount]) => `${currency} ${amount.toLocaleString()}`).join(" · ");
}

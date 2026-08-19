"use client";

type MoneyFieldProps = {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
};

const format = (value: string | number) => {
  const raw = String(value ?? "").replace(/,/g, "");
  if (!raw || raw === "0") return "";
  const [whole, decimal] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal === undefined ? grouped : `${grouped}.${decimal}`;
};

export function MoneyField({
  value,
  onChange,
  className = "",
  placeholder,
  required,
  min,
}: MoneyFieldProps) {
  return (
    <input
      type="text"
      inputMode="decimal"
      required={required}
      min={min}
      value={format(value)}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) =>
        onChange(event.target.value.replace(/,/g, "").replace(/[^0-9.]/g, ""))
      }
      placeholder={placeholder}
      className={className}
    />
  );
}

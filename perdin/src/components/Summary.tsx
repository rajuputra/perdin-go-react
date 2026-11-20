import type { LucideIcon } from "lucide-react";

export function Summary({ items }: { items: { label: string; count: number; icon: LucideIcon }[] }) {
  return (
    <dl className="df-metrics" aria-label="Ringkasan">
      {items.map(({ label, count, icon: Icon }) => (
        <div className="df-metric" key={label}>
          <Icon size={20} className="df-metric-icon" aria-hidden="true" />
          <div><dt>{label}</dt><dd>{count.toLocaleString("id-ID")}</dd></div>
        </div>
      ))}
    </dl>
  );
}

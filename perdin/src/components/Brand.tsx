import { Compass } from "lucide-react";

export function Brand() {
  return (
    <span className="df-brand">
      <span className="df-brand-mark"><Compass size={23} aria-hidden="true" /></span>
      <span>Dinas<span>Flow</span></span>
    </span>
  );
}

import { Heart } from "lucide-react";

// Stripe Payment Link for the LeetCards billing account, created with
// "Customers choose what to pay" — the preset buttons prefill an amount via
// ?__prefilled_amount (cents), and the bare link lets donors type their own.
// VITE_STRIPE_DONATE_URL overrides the live link so local dev and previews
// can point at a test-mode link instead of real checkout.
const DONATE_URL =
  (import.meta.env.VITE_STRIPE_DONATE_URL as string | undefined) ??
  "https://buy.stripe.com/aFa6oA6oq65e5ME4CNgUM00";

const PRESETS = [3, 5, 10];

function donateHref(dollars?: number): string {
  if (!dollars) return DONATE_URL;
  const url = new URL(DONATE_URL);
  url.searchParams.set("__prefilled_amount", String(dollars * 100));
  return url.toString();
}

// Compact single-button variant for tight spots like section headers.
export function DonateButton() {
  return (
    <a
      href={donateHref()}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-auto flex items-center gap-1.5 border border-slate-900/10 bg-white/50 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600"
    >
      <Heart size={14} className="text-rose-500" />
      Donate
    </a>
  );
}

export function Donate() {
  return (
    <div className="mt-12 flex items-center justify-center gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-slate-600">
        <Heart size={14} className="text-rose-500" />
        Support LeetCards
      </span>
      {PRESETS.map((dollars) => (
        <a
          key={dollars}
          href={donateHref(dollars)}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-slate-900/10 bg-white/50 px-3 py-1 font-medium text-slate-700 transition-colors hover:bg-cyan-100 hover:text-cyan-700"
        >
          ${dollars}
        </a>
      ))}
      <a
        href={donateHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="border border-slate-900/10 bg-white/50 px-3 py-1 text-slate-500 transition-colors hover:bg-white/80"
      >
        Custom
      </a>
    </div>
  );
}

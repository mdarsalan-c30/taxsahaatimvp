import { cn } from "@/lib/utils";

interface HeroCharacterIllustrationProps {
  className?: string;
}

/** Minimal flat characters — salaried filer + filing guide — blue/orange palette. */
export function HeroCharacterIllustration({ className }: HeroCharacterIllustrationProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-blue-50/80 via-white to-orange-50/60 p-4 shadow-sm",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 400 140"
        className="h-auto w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="8" y="20" width="170" height="108" rx="16" fill="#EFF6FF" stroke="#BFDBFE" />
        <rect x="222" y="20" width="170" height="108" rx="16" fill="#FFF7ED" stroke="#FED7AA" />

        {/* Salaried professional */}
        <circle cx="93" cy="58" r="22" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
        <path
          d="M78 54c2-6 8-9 15-9s13 3 15 9"
          stroke="#1E3A5F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="86" cy="56" r="2" fill="#1E3A5F" />
        <circle cx="100" cy="56" r="2" fill="#1E3A5F" />
        <path d="M84 64c4 4 12 4 16 0" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M68 88c4-14 18-22 25-22s21 8 25 22"
          fill="#0e5f63"
        />
        <path
          d="M78 88h30v18c0 4-6 8-15 8s-15-4-15-8V88z"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="1"
        />
        <path
          d="M118 72l8 6-4 10"
          stroke="#FB923C"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="52" y="104" width="82" height="10" rx="5" fill="#0e5f63" opacity="0.15" />
        <text x="93" y="112" textAnchor="middle" fill="#0e5f63" fontSize="8" fontWeight="600">
          Ready to file!
        </text>

        {/* Filing guide */}
        <circle cx="307" cy="56" r="22" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
        <rect x="295" y="48" width="24" height="8" rx="4" fill="#4338CA" opacity="0.85" />
        <circle cx="300" cy="56" r="2" fill="#1E3A5F" />
        <circle cx="314" cy="56" r="2" fill="#1E3A5F" />
        <path d="M298 64c4 3 10 3 14 0" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M282 88c4-14 18-22 25-22s21 8 25 22"
          fill="#EA580C"
        />
        <rect x="292" y="88" width="30" height="20" rx="4" fill="#FFFFFF" stroke="#FDBA74" />
        <path d="M297 94h20M297 100h14" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <circle cx="338" cy="78" r="10" fill="#0e5f63" />
        <path
          d="M334 78l3 3 6-7"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="307" y="112" textAnchor="middle" fill="#EA580C" fontSize="8" fontWeight="600">
          Filing guide
        </text>

        <path
          d="M178 74h44"
          stroke="#93C5FD"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <polygon points="222,74 216,71 216,77" fill="#93C5FD" />
      </svg>
    </div>
  );
}

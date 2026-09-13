import Link from 'next/link'

/** Shared vector identity for the public site and clinical workspace. */
export default function BrandLogo({ compact = false, workspace = false }: { compact?: boolean; workspace?: boolean }) {
  return (
    <Link href={workspace ? '/emr/dashboard' : '/'} aria-label={workspace ? '메디플라톤 EMR 홈' : '메디플라톤 홈'} className="inline-flex items-center gap-2.5 shrink-0">
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill="#2563eb" />
        <path d="M10 28V13l10 10 10-10v15" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 9v6m-3-3h6" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {!compact && <span className="leading-none"><span className="block text-[16px] font-extrabold tracking-[-0.6px]">MEDI<span className="text-blue-600">PLATON</span></span><span className="mt-1 block text-[9px] font-semibold tracking-[0.2em] text-muted-foreground">{workspace ? 'CLINICAL WORKSPACE' : 'CONNECTED CARE'}</span></span>}
    </Link>
  )
}

import Link from "next/link";
import Image from "next/image";

/** PVS Operations wordmark used at the top of the sidebar and drawer. */
export function AdminBrand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-sm border border-white/10 bg-white/[0.04]">
        <Image
          src="/images/logo.png"
          alt=""
          width={32}
          height={32}
          className="h-7 w-7 object-contain"
        />
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-semibold tracking-tight text-white">
          PVS Operations
        </span>
        <span className="block text-[11px] text-slate-500">
          Prestige View Services
        </span>
      </span>
    </Link>
  );
}

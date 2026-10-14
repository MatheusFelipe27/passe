import brandMark from '@/assets/marca.svg';

export function Logo() {
  return (
    <div className="flex items-center gap-5">
      <img src={brandMark} alt="" width={56} height={56} className="size-14" />
      <span className="text-[32px] leading-10 font-semibold tracking-[-0.03em]">
        Passe
      </span>
    </div>
  );
}

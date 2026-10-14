import brandMark from '@/assets/marca.svg';

interface LogoProps {
  size?: 'lg' | 'sm' | 'icon';
}

export function Logo({ size = 'lg' }: LogoProps) {
  if (size === 'icon') {
    return (
      <img src={brandMark} alt="" width={32} height={32} className="size-8" />
    );
  }
  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2.5">
        <img src={brandMark} alt="" width={32} height={32} className="size-8" />
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-sm leading-5 font-semibold">Passe</span>
          <span className="text-xs leading-4 text-muted-foreground">
            Gestão da liga
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-5">
      <img src={brandMark} alt="" width={56} height={56} className="size-14" />
      <span className="text-[32px] leading-10 font-semibold tracking-[-0.03em]">
        Passe
      </span>
    </div>
  );
}

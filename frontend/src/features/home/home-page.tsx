import { useEffect } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import fieldLines from '@/assets/campo.svg';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { FlowSteps } from './flow-steps';
import { LeagueBadge } from './league-badge';
import { LeagueNumbers } from './league-numbers';

const START_PATH = '/jogadores';

export function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    function startOnEnter(event: KeyboardEvent) {
      if (event.key === 'Enter' && event.target === document.body) {
        void navigate(START_PATH);
      }
    }
    window.addEventListener('keydown', startOnEnter);
    return () => window.removeEventListener('keydown', startOnEnter);
  }, [navigate]);

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden py-10">
      <img
        src={fieldLines}
        alt=""
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-1/2"
      />
      <section className="relative flex w-[720px] flex-col items-center gap-[22px] rounded-3xl bg-background px-12 py-8">
        <Logo />
        <LeagueBadge />
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-[40px] leading-12 font-semibold tracking-[-0.025em] whitespace-nowrap">
            Gestão da liga, do mercado à classificação
          </h1>
          <p className="max-w-[624px] text-base text-muted-foreground">
            Cadastre jogadores, monte os clubes e negocie com contrato de
            fidelidade. Depois, escale os titulares e jogue partidas com placar
            calculado pelos atributos.
          </p>
        </div>
        <div className="flex items-center gap-3.5">
          <Button asChild size="lg" className="w-[200px]">
            <Link to={START_PATH}>
              Iniciar
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            ou tecle <Kbd>Enter</Kbd>
          </span>
        </div>
        <LeagueNumbers />
      </section>
      <div className="relative">
        <FlowSteps />
      </div>
      <footer className="relative flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock aria-hidden className="size-4" />
        Liga Fictícia 2026 · Horário de Brasília (UTC−3)
      </footer>
    </main>
  );
}

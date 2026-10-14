import { Fragment } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronRight,
  HandCoins,
  History,
  Shield,
  ShoppingCart,
  Trophy,
  Users,
} from 'lucide-react';

interface FlowStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FLOW_STEPS: FlowStep[] = [
  {
    icon: Users,
    title: 'Jogadores',
    description:
      'Nascem livres e Apto; o valor de mercado vem da condição, agilidade e idade.',
  },
  {
    icon: Shield,
    title: 'Clubes',
    description: 'Começam com 300,00 em caixa e sem jogadores.',
  },
  {
    icon: ShoppingCart,
    title: 'Compra',
    description: 'Valor + taxa, até 50% do caixa, com contrato de fidelidade.',
  },
  {
    icon: HandCoins,
    title: 'Venda',
    description: 'Multa antes do fim da fidelidade e comissão sobre o lucro.',
  },
  {
    icon: History,
    title: 'Histórico',
    description: 'Toda compra e venda fica registrada, com totais e CSV.',
  },
  {
    icon: Trophy,
    title: 'Liga',
    description:
      'Escale 5 titulares e jogue partidas que entram na classificação.',
  },
];

export function FlowSteps() {
  return (
    <ol
      aria-label="Como o sistema funciona"
      className="flex items-center gap-2"
    >
      {FLOW_STEPS.map(({ icon: Icon, title, description }, index) => (
        <Fragment key={title}>
          {index > 0 && (
            <ChevronRight
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
          )}
          <li className="flex h-[158px] w-[172px] flex-col gap-2.5 rounded-xl border bg-background p-3.5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft">
                <Icon aria-hidden className="size-4 text-primary" />
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{title}</span>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

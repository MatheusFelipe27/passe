import { CircleCheckIcon, OctagonXIcon } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// Avisos de sucesso e de erro no canto inferior direito, só com o tema claro do sistema de design.
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'rounded-xl border bg-popover text-popover-foreground shadow-lg',
          title: 'text-sm font-medium',
          description: '!text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };

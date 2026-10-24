import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// Tema fixo escuro: a landing tem uma única direção de arte (sem next-themes).
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4 text-ember-300" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={
      {
        '--normal-bg': 'rgb(11 22 56 / 0.92)',
        '--normal-text': 'var(--color-cream)',
        '--normal-border': 'rgb(244 239 230 / 0.14)',
        '--border-radius': '14px',
      } as React.CSSProperties
    }
    toastOptions={{ classNames: { toast: 'cn-toast backdrop-blur-md font-sans' } }}
    {...props}
  />
);

export { Toaster };

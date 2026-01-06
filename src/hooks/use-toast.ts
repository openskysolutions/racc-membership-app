import { toast as sonnerToast } from 'sonner';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = (props: ToastProps) => {
    const message = props.description || '';
    
    if (props.variant === 'destructive') {
      sonnerToast.error(props.title || message, {
        description: props.title ? props.description : undefined,
      });
    } else {
      sonnerToast.success(props.title || message, {
        description: props.title ? props.description : undefined,
      });
    }
  };

  return { toast };
}

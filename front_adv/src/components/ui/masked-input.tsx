import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  maskCPF,
  maskCNPJ,
  maskCpfCnpj,
  maskCEP,
  maskPhoneBR,
  maskCNJ,
  maskOAB,
  maskDate,
  maskMoneyBRInput,
} from '@/lib/masks';

export type MaskType = 'cpf' | 'cnpj' | 'cpf-cnpj' | 'phone' | 'cep' | 'cnj' | 'oab' | 'date' | 'money';

function applyMask(type: MaskType, value: string): string {
  switch (type) {
    case 'cpf': return maskCPF(value);
    case 'cnpj': return maskCNPJ(value);
    case 'cpf-cnpj': return maskCpfCnpj(value);
    case 'phone': return maskPhoneBR(value);
    case 'cep': return maskCEP(value);
    case 'cnj': return maskCNJ(value);
    case 'oab': return maskOAB(value);
    case 'date': return maskDate(value);
    case 'money': return maskMoneyBRInput(value);
    default: return value;
  }
}

export interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  mask: MaskType;
  value?: string;
  onChange?: (masked: string, raw: string) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value = '', onChange, className, ...props }, ref) => {
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const masked = applyMask(mask, e.target.value);
      const raw = e.target.value.replace(/\D/g, '');
      onChange?.(masked, raw);
    }

    return (
      <input
        ref={ref}
        value={applyMask(mask, value)}
        onChange={handleChange}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base text-foreground ring-offset-background placeholder:text-muted-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        {...props}
      />
    );
  },
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };

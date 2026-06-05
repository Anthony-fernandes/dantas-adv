import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function formatDigitsAsCurrency(digits: string) {
  if (!digits) return '';
  const amount = Number(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

type CurrencyInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  onBlur?: () => void;
  'aria-invalid'?: boolean;
};

export function CurrencyInput({
  value,
  onValueChange,
  placeholder,
  disabled,
  id,
  className,
  onBlur,
  'aria-invalid': ariaInvalid,
}: CurrencyInputProps) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(className)}
      aria-invalid={ariaInvalid}
      onBlur={onBlur}
      onChange={(event) => onValueChange(formatDigitsAsCurrency(onlyDigits(event.target.value)))}
    />
  );
}

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number | string;
  onChange: (value: number) => void;
  currency?: string;
  className?: string;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currency = "ریال", className, ...props }, ref) => {
    const formatNumber = (num: string) => {
      return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value.replace(/,/g, "");
      if (/^\d*$/.test(input)) {
        onChange(input ? parseInt(input) : 0);
      }
    };

    const displayValue = value ? formatNumber(value.toString()) : "";

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          className={cn("pr-16", className)}
          dir="ltr"
          {...props}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {currency}
        </span>
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

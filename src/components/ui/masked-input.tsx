import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";

type MaskType = "cpf" | "cnpj" | "cpf_cnpj" | "phone" | "cep";

function applyMask(value: string, mask: MaskType): string {
  const digits = value.replace(/\D/g, "");

  switch (mask) {
    case "cpf":
      return digits
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    case "cnpj":
      return digits
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");

    case "cpf_cnpj":
      if (digits.length <= 11) {
        return applyMask(digits, "cpf");
      }
      return applyMask(digits, "cnpj");

    case "phone":
      if (digits.length <= 10) {
        return digits
          .slice(0, 10)
          .replace(/(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
      }
      return digits
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2");

    case "cep":
      return digits
        .slice(0, 8)
        .replace(/(\d{5})(\d{1,3})$/, "$1-$2");

    default:
      return value;
  }
}

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: MaskType;
  value: string;
  onValueChange: (value: string) => void;
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value, onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(e.target.value, mask);
      onValueChange(masked);
    };

    return (
      <Input
        ref={ref}
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput, applyMask };
export type { MaskType };

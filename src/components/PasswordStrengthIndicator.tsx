import { Progress } from "@/components/ui/progress";
import type { PasswordStrength } from "@/lib/passwordStrength";

interface Props {
  strength: PasswordStrength;
  showChecklist?: boolean;
}

export function PasswordStrengthIndicator({ strength, showChecklist = true }: Props) {
  if (strength.score === 0) return null;

  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Força da senha</span>
        <span className="text-[11px] font-medium">{strength.label}</span>
      </div>
      <Progress value={strength.score} className="h-1.5" />
      {showChecklist && (
        <ul className="text-[10px] text-muted-foreground space-y-0.5">
          <li className={strength.checks.goodLength ? "text-primary" : ""}>• Mínimo 8 caracteres</li>
          <li className={strength.checks.mixedCase ? "text-primary" : ""}>• Letras maiúsculas e minúsculas</li>
          <li className={strength.checks.hasNumber ? "text-primary" : ""}>• Pelo menos um número</li>
          <li className={strength.checks.hasSpecial ? "text-primary" : ""}>• Caractere especial (!@#$)</li>
        </ul>
      )}
    </div>
  );
}

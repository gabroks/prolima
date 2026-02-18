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
        <span className={`text-[11px] font-medium ${
          strength.color === "destructive" ? "text-destructive" : 
          strength.color === "warning" ? "text-yellow-600 dark:text-yellow-400" : 
          "text-primary"
        }`}>{strength.label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            strength.color === "destructive" ? "bg-destructive" : 
            strength.color === "warning" ? "bg-yellow-500" : 
            "bg-primary"
          }`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
      {showChecklist && (
        <ul className="text-[10px] text-muted-foreground space-y-0.5">
          <li className={strength.checks.goodLength ? "text-primary" : ""}>
            {strength.checks.goodLength ? "✓" : "○"} Mínimo 8 caracteres
          </li>
          <li className={strength.checks.mixedCase ? "text-primary" : ""}>
            {strength.checks.mixedCase ? "✓" : "○"} Letras maiúsculas e minúsculas
          </li>
          <li className={strength.checks.hasNumber ? "text-primary" : ""}>
            {strength.checks.hasNumber ? "✓" : "○"} Pelo menos um número
          </li>
          <li className={strength.checks.hasSpecial ? "text-primary" : ""}>
            {strength.checks.hasSpecial ? "✓" : "○"} Caractere especial (!@#$)
          </li>
        </ul>
      )}
    </div>
  );
}

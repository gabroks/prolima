export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    goodLength: boolean;
    mixedCase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 6,
    goodLength: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length * 20;

  let label: string;
  let color: string;
  if (score <= 20) { label = "Muito fraca"; color = "destructive"; }
  else if (score <= 40) { label = "Fraca"; color = "destructive"; }
  else if (score <= 60) { label = "Razoável"; color = "warning"; }
  else if (score <= 80) { label = "Boa"; color = "primary"; }
  else { label = "Forte"; color = "primary"; }

  return { score, label, color, checks };
}

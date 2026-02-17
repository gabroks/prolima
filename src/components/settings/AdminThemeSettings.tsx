import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check, Palette, RotateCcw } from "lucide-react";

const PRESET_THEMES = [
  { name: "Verde Padrão", primary: "152 58% 36%", sidebar: "160 20% 10%", accent: "148 18% 91%" },
  { name: "Azul Oceano", primary: "215 76% 52%", sidebar: "220 25% 10%", accent: "210 20% 92%" },
  { name: "Roxo Elegante", primary: "280 55% 50%", sidebar: "280 20% 10%", accent: "275 18% 92%" },
  { name: "Laranja Quente", primary: "25 90% 48%", sidebar: "20 25% 10%", accent: "25 20% 93%" },
  { name: "Rosa Moderno", primary: "330 70% 50%", sidebar: "335 20% 10%", accent: "325 18% 92%" },
  { name: "Teal Fresco", primary: "174 60% 40%", sidebar: "178 22% 10%", accent: "172 18% 92%" },
  { name: "Índigo", primary: "240 60% 55%", sidebar: "245 22% 10%", accent: "235 18% 92%" },
  { name: "Vermelho Bold", primary: "0 72% 45%", sidebar: "0 20% 10%", accent: "355 18% 93%" },
];

const DEFAULT_THEME = PRESET_THEMES[0];

interface AdminThemeSettingsProps {
  onThemeApplied?: () => void;
}

export function AdminThemeSettings({ onThemeApplied }: AdminThemeSettingsProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return localStorage.getItem("app-theme-name") || DEFAULT_THEME.name;
  });
  const [customPrimary, setCustomPrimary] = useState(() => {
    return localStorage.getItem("app-theme-primary") || DEFAULT_THEME.primary;
  });

  // Apply theme to CSS variables
  const applyTheme = (primary: string, sidebar: string, accent: string, name: string) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--sidebar-background", sidebar);
    root.style.setProperty("--sidebar-border", sidebar.replace(/\d+%$/, (m) => `${parseInt(m) + 8}%`));
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--chart-1", primary);

    // Dark mode adjustments — increase lightness for primary
    const parts = primary.split(" ");
    if (parts.length === 3) {
      const lightness = parseInt(parts[2]);
      const darkPrimary = `${parts[0]} ${parts[1]} ${Math.min(lightness + 10, 60)}%`;
      root.style.setProperty("--sidebar-primary", darkPrimary);
    }

    localStorage.setItem("app-theme-name", name);
    localStorage.setItem("app-theme-primary", primary);
    localStorage.setItem("app-theme-sidebar", sidebar);
    localStorage.setItem("app-theme-accent", accent);
    setSelectedTheme(name);
    setCustomPrimary(primary);
    onThemeApplied?.();
  };

  const resetTheme = () => {
    applyTheme(DEFAULT_THEME.primary, DEFAULT_THEME.sidebar, DEFAULT_THEME.accent, DEFAULT_THEME.name);
  };

  // Apply saved theme on mount
  useEffect(() => {
    const savedPrimary = localStorage.getItem("app-theme-primary");
    const savedSidebar = localStorage.getItem("app-theme-sidebar");
    const savedAccent = localStorage.getItem("app-theme-accent");
    const savedName = localStorage.getItem("app-theme-name");
    if (savedPrimary && savedSidebar && savedAccent && savedName) {
      applyTheme(savedPrimary, savedSidebar, savedAccent, savedName);
    }
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Cores do Sistema
          </CardTitle>
          <CardDescription>
            Altere as cores do sistema inteiro. Essas mudanças são aplicadas em tempo real e persistem entre sessões.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset themes */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Temas Predefinidos</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRESET_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => applyTheme(theme.primary, theme.sidebar, theme.accent, theme.name)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                    selectedTheme === theme.name
                      ? "border-foreground shadow-lg"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <div className="flex gap-1.5">
                    <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: `hsl(${theme.primary})` }} />
                    <div className="w-5 h-8 rounded-md shadow-sm" style={{ backgroundColor: `hsl(${theme.sidebar})` }} />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">{theme.name}</span>
                  {selectedTheme === theme.name && (
                    <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-foreground flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-background" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom color */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Cor Personalizada (HSL)</Label>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Input
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  placeholder="152 58% 36%"
                  className="font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Formato: H S% L% — ex: 215 76% 52%</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const sidebar = `${customPrimary.split(" ")[0]} 20% 10%`;
                  const accent = `${customPrimary.split(" ")[0]} 18% 92%`;
                  applyTheme(customPrimary, sidebar, accent, "Personalizado");
                }}
              >
                Aplicar
              </Button>
            </div>
          </div>

          <Separator />

          {/* Preview */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Prévia</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
                <div className="px-4 py-2 rounded-md text-white text-xs font-semibold bg-primary">Botão</div>
                <span className="text-[10px] text-muted-foreground">Primário</span>
              </div>
              <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
                <Badge>Aprovado</Badge>
                <span className="text-[10px] text-muted-foreground">Badge</span>
              </div>
              <div className="rounded-lg border p-4 flex flex-col items-center gap-2">
                <div className="w-full h-3 rounded-full bg-primary/20 overflow-hidden">
                  <div className="h-full rounded-full bg-primary w-2/3" />
                </div>
                <span className="text-[10px] text-muted-foreground">Progress</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={resetTheme}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Restaurar Padrão
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

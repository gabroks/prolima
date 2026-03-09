import { useEffect, useState } from "react";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const colorOptions = [
  { name: "Verde", value: "green", hsl: "152 58% 36%", sidebar: "160 20% 10%", accent: "148 18% 91%" },
  { name: "Azul", value: "blue", hsl: "215 76% 52%", sidebar: "220 25% 10%", accent: "210 20% 92%" },
  { name: "Laranja", value: "orange", hsl: "38 92% 50%", sidebar: "20 25% 10%", accent: "25 20% 93%" },
  { name: "Roxo", value: "purple", hsl: "280 55% 50%", sidebar: "280 20% 10%", accent: "275 18% 92%" },
  { name: "Vermelho", value: "red", hsl: "0 72% 51%", sidebar: "0 20% 10%", accent: "355 18% 93%" },
  { name: "Teal", value: "teal", hsl: "174 60% 40%", sidebar: "178 22% 10%", accent: "172 18% 92%" },
  { name: "Rosa", value: "pink", hsl: "330 70% 55%", sidebar: "335 20% 10%", accent: "325 18% 92%" },
  { name: "Índigo", value: "indigo", hsl: "240 60% 55%", sidebar: "245 22% 10%", accent: "235 18% 92%" },
];

export { colorOptions };

export function applyThemeToDOM(colorValue: string) {
  const color = colorOptions.find(c => c.value === colorValue);
  if (!color) return;
  const root = document.documentElement;
  root.style.setProperty("--primary", color.hsl);
  root.style.setProperty("--ring", color.hsl);
  root.style.setProperty("--sidebar-background", color.sidebar);
  root.style.setProperty("--accent", color.accent);
  root.style.setProperty("--chart-1", color.hsl);
  const parts = color.hsl.split(" ");
  if (parts.length === 3) {
    const lightness = parseInt(parts[2]);
    const sidebarPrimary = `${parts[0]} ${parts[1]} ${Math.min(lightness + 10, 60)}%`;
    root.style.setProperty("--sidebar-primary", sidebarPrimary);
  }
  localStorage.setItem("app-theme-primary", color.hsl);
  localStorage.setItem("app-theme-sidebar", color.sidebar);
  localStorage.setItem("app-theme-accent", color.accent);
  localStorage.setItem("app-theme-name", color.name);
}

/** Broadcast brand name/subtitle changes for real-time sidebar updates */
export function updateBrandingPreview(brandName: string, brandSubtitle: string) {
  window.dispatchEvent(new CustomEvent("branding-preview", { detail: { brandName, brandSubtitle } }));
}

export function useBranding() {
  const { data: settings } = useCompanySettings();

  const dbBrandName = (settings as any)?.brand_name || "Pro Orçamento";
  const dbBrandSubtitle = (settings as any)?.brand_subtitle || "Gestão inteligente";

  const [preview, setPreview] = useState<{ brandName: string; brandSubtitle: string } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setPreview({ brandName: detail.brandName, brandSubtitle: detail.brandSubtitle });
    };
    window.addEventListener("branding-preview", handler);
    return () => window.removeEventListener("branding-preview", handler);
  }, []);

  // Reset preview when DB settings change (after save)
  useEffect(() => {
    setPreview(null);
  }, [dbBrandName, dbBrandSubtitle]);

  return {
    brandName: preview?.brandName ?? dbBrandName,
    brandSubtitle: preview?.brandSubtitle ?? dbBrandSubtitle,
    logo: settings?.logo || null,
    themeColor: settings?.theme_color || "green",
  };
}

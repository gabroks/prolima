// Initialize saved theme from localStorage on app start
export function initSavedTheme() {
  const primary = localStorage.getItem("app-theme-primary");
  const sidebar = localStorage.getItem("app-theme-sidebar");
  const accent = localStorage.getItem("app-theme-accent");
  
  if (primary && sidebar && accent) {
    const root = document.documentElement;
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--sidebar-background", sidebar);
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--chart-1", primary);
    
    const parts = primary.split(" ");
    if (parts.length === 3) {
      const lightness = parseInt(parts[2]);
      const darkPrimary = `${parts[0]} ${parts[1]} ${Math.min(lightness + 10, 60)}%`;
      root.style.setProperty("--sidebar-primary", darkPrimary);
    }
  }
}

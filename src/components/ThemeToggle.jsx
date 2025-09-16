import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Initialize from <html> or system preference (in case you didn't add the head script)
  useEffect(() => {
    const html = document.documentElement;
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    const dark = saved ? saved === "dark" : (html.classList.contains("dark") || prefersDark);
    html.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    const next = !isDark;
    html.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  };

  const label = isDark ? "Switch to light theme" : "Switch to dark theme";
  const icon  = isDark ? "🌙" : "☀️";

  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      className="btn-theme"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="text-sm">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}

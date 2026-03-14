export default function SiteFooter({ className = "" }) {
  const classes = [
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer
      className={classes}
      style={{
        padding: "0.75rem 1.25rem 1.25rem",
        textAlign: "center",
        fontSize: "0.75rem",
        color: "var(--color-text-muted)",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      game by renjie you · © 2026 grace tang ·{" "}
      <a
        href="/about.html"
        className="text-[var(--color-text-muted)] underline underline-offset-2 hover:text-[var(--color-accent)] transition-colors"
        style={{
          color: "var(--color-text-muted)",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
        }}
      >
        about
      </a>
    </footer>
  );
}

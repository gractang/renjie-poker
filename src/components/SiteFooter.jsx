export default function SiteFooter({ className = "" }) {
  const classes = [
    "px-5 pt-3 pb-5 text-center text-xs text-[var(--color-text-muted)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer
      className={classes}
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      game by renjie you · site by grace tang
    </footer>
  );
}

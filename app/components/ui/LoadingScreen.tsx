export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-9 h-9 border-4 border-[var(--brand-primary-soft)] border-t-[var(--brand-primary)] rounded-full animate-spin" />
    </div>
  );
}

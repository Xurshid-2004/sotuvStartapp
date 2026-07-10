export default function Toast({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-[14px] bg-[var(--text-primary)] text-[var(--surface)] text-sm font-bold shadow-lg max-w-[90vw] text-center">
      {message}
    </div>
  );
}

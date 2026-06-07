export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/10 border-t-kuro-primary shadow-red-glow" />
        <p className="micro-label">Opening the next scene</p>
      </div>
    </div>
  );
}

export function AtmosphericBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#08090a]"
    >
      {/* Linear top ambient light cone: subtle, neutral falloff */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_45%,transparent_75%)] pointer-events-none" />

      {/* Subtle fine neutral grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* Clean bottom vignette fade into pure near-black canvas */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#08090a] to-transparent pointer-events-none" />
    </div>
  );
}

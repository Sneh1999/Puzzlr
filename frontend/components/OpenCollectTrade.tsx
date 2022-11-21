const Span = ({ color, children }: { color: string; children: string }) => (
  <span className="uppercase font-semibold text-3xl" style={{ color }}>
    {children}
  </span>
);

export const OpenCollectTrade = () => (
  <div>
    <Span color="#3772FF">open.</Span> <Span color="#9757D7">collect.</Span>{" "}
    <Span color="#EF466F">trade.</Span>
  </div>
);

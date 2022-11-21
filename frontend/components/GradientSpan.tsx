export const GradientSpan = ({ children }: { children: string }) => (
  <span className="text-7xl uppercase font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-blue-500">
    {children}
  </span>
);

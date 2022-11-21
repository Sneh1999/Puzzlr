import { Header } from "components/Header";
import { Footer } from "components/Footer";
import useGameConfig from "hooks/useGameConfig";

interface Props {
  children: React.ReactNode;
}

export const Layout = ({ children }: Props) => {
  const config = useGameConfig();

  return (
    <div className="flex flex-col min-h-screen justify-between select-none">
      <Header />
      <main
        className={`flex-grow ${
          config?.path === "animetas"
            ? `${config.ui.background} bg-repeat-round ${config.ui.font}`
            : "bg-npt-dark"
        }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
};

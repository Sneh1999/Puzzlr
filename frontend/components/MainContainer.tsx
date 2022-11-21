import { IGameConfig } from "models/interfaces/IGameConfig";

type Props = {
  children: React.ReactNode;
  game?: IGameConfig;
};

export const MainContainer: React.FC<Props> = ({ game, children }) => (
  <div
    className={`px-12 pt-12 ${!(game && game.ui) && "npt-lighter-dark"}
    `}
  >
    {children}
  </div>
);

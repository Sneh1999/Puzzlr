import { BuyPacks } from "components/BuyPacks";
import { MainContainer } from "components/MainContainer";
import { YourPacks } from "components/YourPacks";
import useGameConfig from "hooks/useGameConfig";

export default function Packs() {
  const config = useGameConfig();

  if (!config || !config.dropConfig.packPurchasesEnabled) {
    return null;
  }

  return (
    <div>
      <MainContainer game={config}>
        <BuyPacks config={config} />
        <YourPacks config={config} />
      </MainContainer>
    </div>
  );
}

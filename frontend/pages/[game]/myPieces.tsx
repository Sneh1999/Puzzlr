import { MainContainer } from "components/MainContainer";
import { MyExpiredPieces } from "components/MyExpiredPieces";
import { MyLivePieces } from "components/MyLivePieces";
import useGameConfig from "hooks/useGameConfig";
import React from "react";

export default function MyPieces() {
  const config = useGameConfig();

  if (!config) {
    return null;
  }

  return (
    <MainContainer game={config}>
      <MyLivePieces config={config} />
      <MyExpiredPieces config={config} />
    </MainContainer>
  );
}

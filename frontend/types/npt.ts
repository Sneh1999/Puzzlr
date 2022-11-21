type DroppedPieceEventBody = {
  drop_target: "board";
  puzzle_id: number;
};

export type UserEventType = "dropped_piece";
export type UserEventBody = DroppedPieceEventBody;

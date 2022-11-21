import gql from "graphql-tag";

export const UPSERT_TOKENS = gql`
  mutation UpsertTokens($objects: [tokens_insert_input!]! = {}) {
    insert_tokens(
      objects: $objects
      on_conflict: { constraint: tokens_pkey, update_columns: owner }
    ) {
      affected_rows
    }
  }
`;

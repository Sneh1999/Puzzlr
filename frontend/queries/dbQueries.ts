import { gql } from "graphql-tag";

export const FETCH_PUZZLES = gql`
  query FetchPuzzles {
    puzzles {
      id
      group_id
      name
      artwork
      description
      grid_size
      pieces
      prizes
      max_winners
      started
      completed
      created_at
      updated_at
    }
  }
`;

export const CREATE_PUZZLE = gql`
  mutation CreatePuzzle(
    $name: String!
    $description: String
    $artwork: String!
    $grid_size: Int!
    $pieces: _varchar!
    $prizes: _varchar!
    $group_id: Int!
    $max_winners: Int!
  ) {
    insert_puzzles(
      objects: {
        name: $name
        description: $description
        artwork: $artwork
        grid_size: $grid_size
        pieces: $pieces
        prizes: $prizes
        group_id: $group_id
        max_winners: $max_winners
        remaining_winners: $max_winners
      }
    ) {
      returning {
        id
        group_id
        name
        description
        artwork
        grid_size
        pieces
        max_winners
        remaining_winners
        prizes
        started
        completed
        created_at
        updated_at
      }
    }
  }
`;

export const CREATE_PUZZLE_GROUP = gql`
  mutation CreatePuzzleGroup($name: String!, $description: String) {
    insert_puzzle_groups(objects: { name: $name, description: $description }) {
      returning {
        id
        name
        description
      }
    }
  }
`;

export const FETCH_LIVE_PUZZLES = gql`
  query FetchLivePuzzles {
    puzzles(
      where: { _and: { started: { _eq: true }, completed: { _eq: false } } }
    ) {
      completed
      created_at
      description
      grid_size
      id
      artwork
      group_id
      name
      pieces
      max_winners
      prizes
      started
      updated_at
    }
  }
`;

export const FETCH_COMPLETED_PUZZLES_FOR_GROUP = gql`
  query FetchCompletedPuzzlesForGroup($groupId: Int!) {
    puzzles(where: { group_id: { _eq: $groupId }, completed: { _eq: true } }) {
      id
      name
      artwork
    }
  }
`;

export const SUBSCRIBE_TO_COMPLETED_PUZZLES_FOR_GROUP = gql`
  subscription SubscribeToCompletedPuzzlesForGroup($groupId: Int!) {
    puzzles(where: { group_id: { _eq: $groupId }, completed: { _eq: true } }) {
      id
      name
      artwork
    }
  }
`;

export const SUBSCRIBE_TO_LIVE_PUZZLES_REMAINING_WINNERS = gql`
  subscription SubscribeToLivePuzzlesRemainingWinners {
    puzzles(where: { started: { _eq: true }, completed: { _eq: false } }) {
      id
      remaining_winners
    }
  }
`;

export const FETCH_EXPIRED_PUZZLES = gql`
  query FetchLivePuzzles {
    puzzles(
      where: { _and: { started: { _eq: true }, completed: { _eq: true } } }
    ) {
      completed
      created_at
      description
      grid_size
      id
      artwork
      group_id
      name
      pieces
      max_winners
      prizes
      started
      updated_at
    }
  }
`;

export const FETCH_LIVE_PUZZLE_BY_ID = gql`
  query FetchLivePuzzles($id: Int!) {
    puzzles(
      where: {
        _and: {
          started: { _eq: true }
          completed: { _eq: false }
          id: { _eq: $id }
        }
      }
    ) {
      completed
      created_at
      description
      grid_size
      id
      artwork
      group_id
      name
      pieces
      prizes
      max_winners
      remaining_winners
      started
      updated_at
    }
  }
`;

export const FETCH_PUZZLE_TO_BE_REPLACED = gql`
  query FetchPuzzleToBeReplaced($group_id: Int!, $grid_size: Int!) {
    puzzles(
      where: {
        _and: {
          started: { _eq: false }
          completed: { _eq: false }
          group_id: { _eq: $group_id }
          grid_size: { _eq: $grid_size }
        }
      }
    ) {
      completed
      created_at
      description
      grid_size
      id
      artwork
      group_id
      name
      pieces
      prizes
      max_winners
      started
      updated_at
    }
  }
`;

export const FETCH_PUZZLE_BY_ID = gql`
  query FetchPuzzleByID($id: Int!) {
    puzzles(where: { id: { _eq: $id } }) {
      id
      artwork
      group_id
      name
      description
      grid_size
      pieces
      prizes
      max_winners
      started
      completed
      created_at
      updated_at
    }
  }
`;

export const DELETE_TOKENS = gql`
  mutation DeleteTokens($pieceIds: [String!]) {
    delete_tokens(where: { token_id: { _in: $pieceIds } }) {
      affected_rows
    }
  }
`;

export const UPDATE_STARTED_IN_PUZZLES = gql`
  mutation UpdateStartedInPuzzles($idArray: [Int!]!) {
    update_puzzles(where: { id: { _in: $idArray } }, _set: { started: true }) {
      returning {
        id
      }
    }
  }
`;

export const UPDATE_COMPLETED_IN_PUZZLE = gql`
  mutation UpdateCompletedInPuzzles($id: Int!) {
    update_puzzles(where: { id: { _eq: $id } }, _set: { completed: true }) {
      affected_rows
    }
  }
`;

export const DECREMENT_WINNERS_FOR_PUZZLE = gql`
  mutation DecrementWinnersForPuzzle($id: Int!) {
    update_puzzles(
      where: { id: { _eq: $id } }
      _inc: { remaining_winners: -1 }
    ) {
      affected_rows
    }
  }
`;

export const FETCH_PUZZLE_BY_GROUP_ID = gql`
  query FetchPuzzleByGroupID($id: Int!, $limit: Int!) {
    puzzles(
      where: {
        _and: {
          group_id: { _eq: $id }
          completed: { _eq: false }
          started: { _eq: false }
        }
      }
      limit: $limit
    ) {
      id
      artwork
      group_id
      name
      description
      grid_size
      pieces
      prizes
      max_winners
      started
      completed
      created_at
      updated_at
    }
  }
`;

export const FETCH_PUZZLE_PIECES_BY_PUZZLE_ID = gql`
  query FetchPuzzlePiecesByPuzzleID($id: Int!) {
    puzzles(where: { id: { _eq: $id } }) {
      pieces
    }
  }
`;

export const FETCH_CID_BY_TOKEN_IDS = gql`
  query FetchCIDByTokenIds($sellerTokenIds: [String!]!) {
    tokens(where: { token_id: { _in: $sellerTokenIds } }) {
      cid
      token_id
    }
  }
`;

export const FETCH_TOKENS_BY_OWNER = gql`
  query FetchTokensByOwner($owner: String!) {
    tokens(where: { owner: { _eq: $owner } }) {
      cid
      token_id
      owner
      timestamp
      type
      token_metadata {
        name
        description
        image_url
        attributes
      }
    }
  }
`;

export const FETCH_TOKEN_BY_TOKEN_ID = gql`
  query FetchTokensByTokenID($tokenId: String!) {
    tokens(where: { token_id: { _eq: $tokenId } }) {
      cid
      token_id
      owner
      timestamp
      type
      token_metadata {
        name
        description
        image_url
        attributes
      }
    }
  }
`;

export const FETCH_TOKENS_BY_TOKEN_IDS = gql`
  query FetchTokensByTokenIDs($tokenIds: [String!]!) {
    tokens(where: { token_id: { _in: $tokenIds } }) {
      cid
      token_id
      owner
      timestamp
      type
      token_metadata {
        name
        description
        image_url
        attributes
      }
    }
  }
`;

export const FETCH_PAYMENT = gql`
  query FetchPayment($payment_id: String!) {
    payments(where: { payment_id: { _eq: $payment_id } }) {
      payment_id
    }
  }
`;

export const INSERT_PAYMENT = gql`
  mutation InsertPayment(
    $amount: Int!
    $currency: String!
    $packTier: Int!
    $eth_address: String!
    $payment_id: String!
  ) {
    insert_payments(
      objects: {
        amount: $amount
        currency: $currency
        packTier: $packTier
        eth_address: $eth_address
        payment_id: $payment_id
      }
    ) {
      affected_rows
    }
  }
`;

export const FETCH_ACTIVE_BOUNCER = gql`
  query FetchBouncers {
    bouncers(where: { active: { _eq: true } }) {
      id
      address
      privateKey
      active
    }
    bouncers_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export const INSERT_BOUNCER = gql`
  mutation InsertBouncer(
    $id: Int!
    $address: String!
    $privateKey: String!
    $active: Boolean!
  ) {
    insert_bouncers(
      objects: {
        id: $id
        address: $address
        privateKey: $privateKey
        active: $active
      }
    ) {
      affected_rows
    }
  }
`;

export const UPDATE_ACTIVE_BOUNCER = gql`
  mutation UpdateActiveInBouncers($nextId: Int!, $activeId: Int!) {
    setActiveFalse: update_bouncers(
      where: { id: { _eq: $activeId } }
      _set: { active: false }
    ) {
      affected_rows
    }
    setActiveTrue: update_bouncers(
      where: { id: { _eq: $nextId } }
      _set: { active: true }
    ) {
      affected_rows
    }
  }
`;

export const FETCH_METADATA_BY_CID = gql`
  query FetchMetadataByCID($cid: String!) {
    metadata(where: { cid: { _eq: $cid } }) {
      attributes
      cid
      description
      image_url
      name
    }
  }
`;

export const FETCH_METADATAS_BY_CIDS = gql`
  query FetchMetadatasByCIDS($cids: [String!]!) {
    metadata(where: { cid: { _in: $cids } }) {
      attributes
      cid
      description
      image_url
      name
    }
  }
`;

export const INSERT_METADATAS = gql`
  mutation InsertMetadatas($objects: [metadata_insert_input!]! = {}) {
    insert_metadata(objects: $objects) {
      affected_rows
    }
  }
`;

export const INSERT_USER_EVENT = gql`
  mutation InsertUserEvent($address: String!, $body: jsonb!, $type: String!) {
    insert_user_events(
      objects: [{ address: $address, body: $body, type: $type }]
    ) {
      affected_rows
    }
  }
`;

export const INSERT_BURN_REQUEST = gql`
  mutation InsertBurnRequest($address: String!) {
    insert_requested_burns(objects: [{ address: $address }]) {
      affected_rows
    }
  }
`;

export const FETCH_BURN_REQUEST_FOR_ADDRESS = gql`
  query FetchBurnRequest($address: String!) {
    requested_burns(where: { address: { _eq: $address } }) {
      id
      address
    }
  }
`;

export const INSERT_SAVAGE_SIDE = gql`
  mutation MyMutation($address: String!, $groupId: Int!, $side: Int!) {
    insert_savage_side(
      objects: { address: $address, group_id: $groupId, side: $side }
    ) {
      affected_rows
    }
  }
`;

export const QUERY_SAVAGE_SIDE_FOR_ACCOUNT = gql`
  query QUERY_SAVAGE_SIDE_FOR_ACCOUNT($address: String, $groupId: Int!) {
    savage_side(
      where: { address: { _eq: $address }, group_id: { _eq: $groupId } }
    ) {
      address
      group_id
      side
    }
  }
`;

export const QUERY_OWNER_AND_CID_EXIST = gql`
  query QUERY_OWNER_AND_CID($address: String!, $cid: String!) {
    tokens(where: { owner: { _eq: $address }, cid: { _eq: $cid } }) {
      token_id
    }
  }
`;

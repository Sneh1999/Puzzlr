import {
  ApolloClient,
  DefaultOptions,
  InMemoryCache,
  HttpLink,
  split,
  NormalizedCacheObject,
  ApolloQueryResult,
  FetchResult,
} from "@apollo/client";
import { getMainDefinition, Observable } from "@apollo/client/utilities";
import { WebSocketLink } from "@apollo/client/link/ws";
import {
  FETCH_COMPLETED_PUZZLES_FOR_GROUP,
  SUBSCRIBE_TO_COMPLETED_PUZZLES_FOR_GROUP,
  SUBSCRIBE_TO_LIVE_PUZZLES_REMAINING_WINNERS,
} from "queries";
import { INSERT_USER_EVENT } from "queries/dbQueries";
import { ModelsNS, NptNS } from "types";

const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_URL;

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: "no-cache",
  },
  query: {
    fetchPolicy: "no-cache",
  },
};

class HasuraClient {
  client: ApolloClient<NormalizedCacheObject>;

  constructor() {
    const httpLink = new HttpLink({ uri: HASURA_URL });

    // Only create the websocket link when run in the browser
    const wsLink = process.browser
      ? new WebSocketLink({
          uri: HASURA_URL.replace(/https?/, "wss"),
          options: {
            reconnect: true,
          },
        })
      : null;

    const link = process.browser
      ? split(
          ({ query }) => {
            const definition = getMainDefinition(query);
            return (
              definition.kind === "OperationDefinition" &&
              definition.operation === "subscription"
            );
          },
          wsLink,
          httpLink
        )
      : httpLink;

    this.client = new ApolloClient({
      link,
      cache: new InMemoryCache(),
      defaultOptions,
    });
  }

  fetchCompletedPuzzlesForGroup(
    groupId: number
  ): Promise<ApolloQueryResult<{ puzzles: ModelsNS.CompletedPuzzle[] }>> {
    return this.client.query({
      query: FETCH_COMPLETED_PUZZLES_FOR_GROUP,
      variables: { groupId },
    });
  }

  subscribeToCompletedPuzzlesForGroup(
    groupId: number
  ): Observable<FetchResult<{ puzzles: ModelsNS.CompletedPuzzle[] }>> {
    return this.client.subscribe({
      query: SUBSCRIBE_TO_COMPLETED_PUZZLES_FOR_GROUP,
      variables: { groupId },
    });
  }

  subscribeToLivePuzzlesRemainingWinners(): Observable<
    FetchResult<{ puzzles: ModelsNS.RemainingWinnersPuzzle[] }>
  > {
    return this.client.subscribe({
      query: SUBSCRIBE_TO_LIVE_PUZZLES_REMAINING_WINNERS,
    });
  }

  insertUserEvent(
    type: NptNS.UserEventType,
    address: string,
    body: NptNS.UserEventBody
  ) {
    return this.client.mutate({
      mutation: INSERT_USER_EVENT,
      variables: { type, address, body },
    });
  }
}

export const hasuraClient = new HasuraClient();

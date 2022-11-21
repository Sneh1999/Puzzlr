import axios from "axios";
import { print } from "graphql";

export async function dbQuery(query: any, variables = {}): Promise<any> {
  try {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_HASURA_URL,
      {
        query: print(query),
        variables: variables,
      },
      {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
        },
      }
    );

    if (response.data.errors) {
      console.error(response.data.errors);
      throw new Error(`Error making database call: ${response.data.errors}`);
    }

    return response.data.data;
  } catch (error) {
    console.error(error);
    throw new Error(`Error making db query: ${error.message}`);
  }
}

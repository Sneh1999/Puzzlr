import axios from "axios";

export async function subgraphQuery(query: string) {
  try {
    const response = await axios.post(process.env.SUBGRAPH_URL, {
      query,
    });
    if (response.data.errors) {
      console.error(response.data.errors);
      throw new Error(`Error making subgraph query: ${response.data.errors}`);
    }

    return response.data.data;
  } catch (error) {
    console.error(error);
    throw new Error(`Could not query the subgraph: ${error.message}`);
  }
}

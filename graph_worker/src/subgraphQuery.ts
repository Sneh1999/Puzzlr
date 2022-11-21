import axios from "axios";

export async function subgraphQuery(query: any) {
  try {
    const res = await axios.post(process.env.SUBGRAPH_URL, {
      query,
    });

    if (res.data.errors) {
      throw res.data.errors;
    }

    return res.data.data;
  } catch (e) {
    throw e;
  }
}

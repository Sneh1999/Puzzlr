import { PackEntity } from "models/types/PackEntity";
import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_PACK_PURCHASE_COMPLETEDS_FOR_ETH_ADDRESS } from "queries";
import { apiResponse } from "utils/apiResponse";
import { subgraphQuery } from "utils/subgraphQuery";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return apiResponse(res, 400, "This HTTP method is not supported", true);
  }

  const eth_address = req.query.eth_address as string;
  if (!eth_address) {
    return apiResponse(res, 400, "eth_address must be provided", true);
  }

  try {
    const response = await subgraphQuery(
      FETCH_PACK_PURCHASE_COMPLETEDS_FOR_ETH_ADDRESS(eth_address)
    );

    const packs = response.packs as PackEntity[];
    return res.json(packs);
  } catch (error) {
    console.error(error);
    return apiResponse(
      res,
      500,
      `Error fetching packs for ${eth_address}: ${error.message}`,
      true
    );
  }
}

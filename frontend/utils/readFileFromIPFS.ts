import axios from "axios";
import { NFTMetadata } from "models/types/NFTMetadata";
import { FETCH_METADATA_BY_CID } from "queries";
import { dbQuery } from "./dbQuery";
import { getIPFSGatewayLink } from "./getIPFSGatewayLink";

export async function readFileFromIPFS(CID: string): Promise<NFTMetadata> {
  try {
    const dbResponse = await dbQuery(FETCH_METADATA_BY_CID, {
      cid: CID,
    });

    if (dbResponse.metadata.length === 1) {
      const metadata: NFTMetadata = {
        name: dbResponse.metadata[0].name,
        description: dbResponse.metadata[0].description,
        image: dbResponse.metadata[0].image_url,
        attributes: dbResponse.metadata[0].attributes,
      };
      return metadata;
    }
    const ipfsGatewayLink = getIPFSGatewayLink(CID);
    const response = await axios.get(ipfsGatewayLink);
    if (response.data.name) {
      const ipfsFile: NFTMetadata = {
        name: response.data.name,
        description: response.data.description,
        image: response.data.image,
        attributes: response.data.attributes,
      };
      return ipfsFile;
    } else {
      throw new Error(`Error reading file from IPFS: Unsupported Format`);
    }
  } catch (error) {
    console.error(error);
    throw new Error(`Error reading file from IPFS: ${error.message}`);
  }
}

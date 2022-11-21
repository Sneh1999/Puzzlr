import axios from "axios";
import FormData from "form-data";
import { NFTMetadata } from "../models/types/NFTMetadata";
import { getIPFSGatewayLink } from "./getIPFSGatewayLink";

export type IPFSUploadResult = {
  cid: string;
  name: string;
  description: string;
  attributes: any;
  image_url: string;
};

export async function uploadFilesToIPFS(
  imageBuffers: Buffer[],
  name: string,
  description?: string
): Promise<IPFSUploadResult[]> {
  const result: IPFSUploadResult[] = [];

  for (let buffer of imageBuffers) {
    try {
      const fileFormData = new FormData();
      fileFormData.append("file", buffer, {
        contentType: "image/jpeg",
        filename: `${name}.jpeg`,
      });

      // Don't use axios here
      // There's an unresolved issue about axios not working well with FormData's
      const uploadFileRes = await fetch(process.env.PINATA_PIN_FILE_URL, {
        method: "POST",
        body: fileFormData as any,
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });
      const jsonRes = await uploadFileRes.json();
      const imageCID = jsonRes.IpfsHash;
      const imageURL = getIPFSGatewayLink(imageCID);

      const metadata: NFTMetadata = {
        name,
        description,
        image: imageURL,
      };

      const uploadJsonRes = await axios.post(
        process.env.PINATA_PIN_JSON_URL,
        metadata,
        {
          headers: {
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
        }
      );
      const metadataCID = uploadJsonRes.data.IpfsHash;
      result.push({
        cid: metadataCID,
        name,
        description,
        attributes: undefined,
        image_url: imageURL,
      });
    } catch (error) {
      console.error(error);
      throw new Error(`Error uploading file to IPFS: ${error.message}`);
    }
  }

  return result;
}

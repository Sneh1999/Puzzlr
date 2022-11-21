import axios from "axios";

/**
 * Downloads an image given a URL and returns a Buffer
 * @param url the URL to download the image from - must be a direct url
 */
export async function downloadImage(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });
    const data = Buffer.from(response.data, "binary");
    return data;
  } catch (error) {
    console.error(error);
    throw new Error(`Error downloading image: ${error.message}`);
  }
}

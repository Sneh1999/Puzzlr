import Jimp from "jimp";

/**
 * Slices an image into a square grid and returns an array of base64 images
 * @param imageBuffer the original image buffer
 * @param gridSize the length of the grid (e.g. 5 will produce a 5x5 grid)
 */
export async function sliceImage(
  imageBuffer: Buffer,
  gridSize: number
): Promise<Buffer[]> {
  try {
    const pieces: Buffer[] = [];

    const image = await Jimp.read(imageBuffer);

    const pieceWidth = image.bitmap.width / gridSize;
    const pieceHeight = image.bitmap.height / gridSize;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const clone = image.clone();
        clone.crop(pieceWidth * x, pieceHeight * y, pieceWidth, pieceHeight);
        const croppedBuffer = await clone.getBufferAsync("image/jpeg");
        pieces.push(croppedBuffer);
      }
    }

    return pieces;
  } catch (error) {
    console.error(error);
    throw new Error(`Error slicing image: ${error.message}`);
  }
}

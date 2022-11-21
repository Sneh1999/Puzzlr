import { JsonRpcProvider } from "@ethersproject/providers";

export function getProvider(): JsonRpcProvider {
  return new JsonRpcProvider(process.env.RPC_URL);
}

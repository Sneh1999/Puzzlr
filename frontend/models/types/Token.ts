export type Token = {
  cid: string;
  owner: string;
  timestamp: string;
  token_id: string;
  type: string;
  token_metadata: TokenMetadata;
};

export type TokenMetadata = {
  name: string;
  description: string;
  image_url: string;
  attributes: any;
};

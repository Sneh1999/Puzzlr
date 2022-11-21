import { NextApiRequest, NextApiResponse } from "next";
import { FETCH_PAYMENT, INSERT_PAYMENT } from "queries/dbQueries";
import Stripe from "stripe";
import { buyPackForGroupInContract } from "utils/buyPackForGroupInContract";
import { dbQuery } from "utils/dbQuery";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, null);

export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookPayloadParser = (req: NextApiRequest) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      resolve(Buffer.from(data).toString());
    });
  });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sig = req.headers["stripe-signature"];
  const data = await webhookPayloadParser(req);
  const ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      data as string,
      sig,
      ENDPOINT_SECRET
    );
  } catch (err) {
    console.log(err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      try {
        const metadata = (event.data.object as any).metadata;
        const response = await dbQuery(FETCH_PAYMENT, {
          payment_id: (event.data.object as any).id,
        });
        if (response.payments.length == 0) {
          await dbQuery(INSERT_PAYMENT, {
            amount: Number((event.data.object as any).amount),
            currency: (event.data.object as any).currency,
            packTier: parseInt(metadata.packTier),
            eth_address: metadata.address,
            payment_id: (event.data.object as any).id,
          });
          await buyPackForGroupInContract(
            metadata.puzzleGroupId,
            metadata.address,
            parseInt(metadata.packTier)
          );
        }
      } catch (error) {}

      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  // Return a response to acknowledge receipt of the event
  return res.status(200).json({ received: true });
}

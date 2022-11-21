import { EPackTiers } from "models/enums/EPackTiers";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { apiResponse } from "utils/apiResponse";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, null);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      // Create Checkout Sessions from body params.
      const packPrice = req.body.packPrice as number;
      const packTier = req.body.packTier;
      const address = String(req.body.address);
      const puzzleGroupId = req.body.puzzleGroupId;

      if (packPrice <= 0) {
        return apiResponse(res, 400, "PackPrice is invalid", true);
      }

      if (packTier === null) {
        return apiResponse(res, 400, "Pack Tier not provided", true);
      }
      if (!address) {
        return apiResponse(res, 400, "address is not passed in the body", true);
      }
      if (!puzzleGroupId) {
        return apiResponse(
          res,
          400,
          "puzzleGroupId is not passed in the body",
          true
        );
      }

      let name = "";
      if (packTier === EPackTiers.GOLD) {
        name = "Gold pack purchase";
      } else if (packTier === EPackTiers.SILVER) {
        name = "Sliver pack purchase";
      } else {
        name = "Bronze pack purchase";
      }
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: name,
                images: ["https://i.ibb.co/F6xkXL9/pack.png"],
              },
              unit_amount: packPrice * 100,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            address: address,
            puzzleGroupId,
            packTier,
          },
        },
        mode: "payment",
        success_url: `${req.headers.origin}/packs/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/packs/?canceled=true`,
      });

      return res.status(200).json(session);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ statusCode: 500, message: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }
}

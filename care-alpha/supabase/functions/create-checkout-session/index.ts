// Supabase Edge Function: create-checkout-session
// Deploy with: supabase functions deploy create-checkout-session --no-verify-jwt

import Stripe from 'https://esm.sh/stripe@16.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.json();
    const {
      patientId,
      doctorId,
      doctorName,
      consultationPriceGbp,
      depositGbp,
    } = body;

    const depositPence = Math.round(Number(depositGbp) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: depositPence,
            product_data: {
              name: `Care deposit - ${doctorName}`,
              description: `15-min consultation (£${consultationPriceGbp})`,
            },
          },
        },
      ],
      metadata: {
        patientId,
        doctorId,
        consultationPriceGbp: String(consultationPriceGbp),
        depositGbp: String(depositGbp),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

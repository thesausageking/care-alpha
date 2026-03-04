// Stripe webhook handler.
// Source of truth for payment confirmation.

import Stripe from 'https://esm.sh/stripe@16.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
});

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) return new Response('Missing stripe-signature', { status: 400 });

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as Stripe.PaymentIntent;
      const paymentIntentId = pi.id;

      const { data: payment, error: pErr } = await supabase
        .from('payments')
        .select('id, booking_id, payment_type')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (pErr || !payment) return new Response('Payment row not found', { status: 404 });

      await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          receipt_url: pi.latest_charge ? `https://dashboard.stripe.com/payments/${pi.latest_charge}` : null,
        })
        .eq('id', payment.id);

      if (payment.payment_type === 'deposit') {
        await supabase
          .from('bookings')
          .update({ status: 'confirmed', updated_at: new Date().toISOString() })
          .eq('id', payment.booking_id)
          .eq('status', 'pending_payment');

        // Mark hold converted and slot booked
        const { data: booking } = await supabase
          .from('bookings')
          .select('slot_id')
          .eq('id', payment.booking_id)
          .single();

        if (booking?.slot_id) {
          await supabase.from('availability_slots').update({ slot_status: 'booked' }).eq('id', booking.slot_id);
          await supabase
            .from('booking_holds')
            .update({ status: 'converted' })
            .eq('slot_id', booking.slot_id)
            .eq('status', 'active');
        }

        await supabase.from('chat_threads').insert({ booking_id: payment.booking_id });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', pi.id);
    }

    return new Response('ok', { status: 200 });
  } catch (e) {
    return new Response(`Webhook error: ${String(e)}`, { status: 400 });
  }
});

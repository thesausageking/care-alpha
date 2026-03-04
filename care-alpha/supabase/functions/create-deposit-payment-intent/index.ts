// Creates Stripe PaymentIntent for booking deposit.
// Auth: patient JWT required.
// NOTE: Minimal starter; add stricter hold expiry/status checks for prod hardening.

import Stripe from 'https://esm.sh/stripe@16.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing bearer token' }), { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user' }), { status: 401 });
    }

    const patientId = userData.user.id;
    const { hold_id } = await req.json();
    if (!hold_id) return new Response(JSON.stringify({ error: 'hold_id required' }), { status: 400 });

    const { data: hold, error: holdErr } = await supabase
      .from('booking_holds')
      .select('id, patient_id, doctor_id, slot_id, status, expires_at')
      .eq('id', hold_id)
      .single();

    if (holdErr || !hold) return new Response(JSON.stringify({ error: 'Hold not found' }), { status: 404 });
    if (hold.patient_id !== patientId) return new Response(JSON.stringify({ error: 'Not your hold' }), { status: 403 });
    if (hold.status !== 'active') return new Response(JSON.stringify({ error: 'Hold not active' }), { status: 400 });

    const now = new Date();
    if (new Date(hold.expires_at) <= now) {
      return new Response(JSON.stringify({ error: 'Hold expired' }), { status: 400 });
    }

    const { data: doctor, error: doctorErr } = await supabase
      .from('doctors')
      .select('default_price_gbp, status')
      .eq('profile_id', hold.doctor_id)
      .single();

    if (doctorErr || !doctor) return new Response(JSON.stringify({ error: 'Doctor not found' }), { status: 404 });
    if (doctor.status !== 'live') return new Response(JSON.stringify({ error: 'Doctor not live' }), { status: 400 });

    const price = Number(doctor.default_price_gbp || 0);
    const deposit = Number((price * 0.3).toFixed(2)); // starter: 30% deposit
    const remainder = Number((price - deposit).toFixed(2));

    const idem = `deposit-${hold_id}`;

    const intent = await stripe.paymentIntents.create(
      {
        amount: Math.round(deposit * 100),
        currency: 'gbp',
        automatic_payment_methods: { enabled: true },
        setup_future_usage: 'off_session',
        metadata: {
          hold_id: hold.id,
          patient_id: patientId,
          doctor_id: hold.doctor_id,
          slot_id: hold.slot_id,
          full_price_gbp: String(price),
          deposit_gbp: String(deposit),
          remainder_gbp: String(remainder),
        },
      },
      { idempotencyKey: idem },
    );

    // Create pending booking row now; only webhook can flip to confirmed.
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        patient_id: patientId,
        doctor_id: hold.doctor_id,
        slot_id: hold.slot_id,
        status: 'pending_payment',
        appointment_type: 'clinic',
        red_flag_result: 'clear',
        price_gbp: price,
        deposit_gbp: deposit,
        remainder_gbp: remainder,
      })
      .select('id')
      .single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: 'Failed to create booking draft' }), { status: 500 });
    }

    await supabase.from('payments').insert({
      booking_id: booking.id,
      payment_type: 'deposit',
      stripe_payment_intent_id: intent.id,
      amount_gbp: deposit,
      status: 'requires_payment_method',
      idempotency_key: idem,
    });

    return new Response(
      JSON.stringify({
        booking_id: booking.id,
        client_secret: intent.client_secret,
        payment_intent_id: intent.id,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

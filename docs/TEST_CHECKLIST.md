# Care. Test Checklist (Execution)

## A) Booking + Payment Webhook Flow
- [ ] Create fresh availability slot
- [ ] Create active booking hold
- [ ] Call create-deposit-payment-intent function
- [ ] Confirm test payment (Stripe test mode)
- [ ] Verify Stripe webhook delivery returns 2xx
- [ ] Verify payments.status becomes succeeded
- [ ] Verify bookings.status becomes confirmed
- [ ] Verify chat thread auto-created for booking

## B) RLS / Access Control
- [ ] Patient cannot read another patient's booking
- [ ] Doctor sees only assigned bookings
- [ ] Only live doctors appear in browse/discovery
- [ ] Non-participants cannot read/write chat thread

## C) Safety + Clinical Guardrails
- [ ] Red-flag triage path blocks booking
- [ ] Emergency guidance is shown clearly
- [ ] Blocked triage cannot be bypassed to payment

## D) Messaging Safety
- [ ] Chat is booking-bound
- [ ] Optional image upload works
- [ ] Personal contact sharing detection triggers warning/block
- [ ] Report issue action creates moderation record

## E) Payments Robustness
- [ ] Booking is only confirmed after webhook success
- [ ] Duplicate webhook/event does not double-confirm/double-charge
- [ ] Failed payment keeps booking in pending/failed safe state
- [ ] Refund flow updates payment and booking state correctly

## F) App Readiness Smoke
- [ ] Crash-free startup + map load
- [ ] Booking flow completes end-to-end
- [ ] Receipt entry visible in history
- [ ] Review prompt appears only after completed appointment

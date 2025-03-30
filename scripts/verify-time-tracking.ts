import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const METER_ID = 'mtr_test_61SHLAEZaiE6FzKlm41AVc47ah8I1D5s';

async function verifyTimeTracking() {
  console.log('Starting time tracking verification...');

  // Get meter configuration
  const meterResponse = await fetch(`https://api.stripe.com/v1/billing/meters/${METER_ID}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
  });
  const meter = await meterResponse.json();
  console.log('Meter configuration:', meter);

  // Find test customer
  const customers = await stripe.customers.list({ limit: 1 });
  const customer = customers.data[0];
  console.log('Found test customer:', {
    id: customer.id,
    name: customer.name,
    email: customer.email
  });

  // Create a test meter event with timestamp from 1 day ago
  const now = 1740304451 + (24 * 60 * 60); // Current time (based on Stripe's minimum allowed timestamp)
  const eventResponse = await fetch('https://api.stripe.com/v1/billing/meter_events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'event_name': 'time_tracking_billing',
      'identifier': `test_${now}`,
      'timestamp': (now - 3600).toString(), // 1 hour ago
      'payload[stripe_customer_id]': customer.id,
      'payload[value]': '30'
    })
  });
  const event = await eventResponse.json();
  console.log('Created test meter event:', event);

  // Wait a few seconds for the event to be processed
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Get meter event summaries for the last 24 hours
  const summariesResponse = await fetch(
    `https://api.stripe.com/v1/billing/meters/${METER_ID}/event_summaries?` +
    new URLSearchParams({
      'start_time': (now - 86400).toString(), // 24 hours ago
      'end_time': now.toString(),
      'customer': customer.id
    }), {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    }
  );
  const summaries = await summariesResponse.json();
  console.log('Meter event summaries:', summaries);

  console.log('Time tracking verification completed.');
}

verifyTimeTracking().catch(console.error); 
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const CUSTOMER_ID = 'cus_RiPhnjYVL5R2MK'; // Nick's customer ID

async function listSubscriptions() {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: CUSTOMER_ID,
      limit: 100,
      expand: ['data.items']
    });

    console.log('Found subscriptions:', subscriptions.data.length);
    subscriptions.data.forEach(sub => {
      console.log({
        id: sub.id,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : 'No trial',
        items: sub.items.data.map(item => ({
          id: item.id,
          price_id: item.price.id,
        })),
      });
    });

    return subscriptions.data;
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    throw error;
  }
}

// Run the listing
listSubscriptions(); 
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const CUSTOMER_ID = 'cus_RiPhnjYVL5R2MK'; // Nick's customer ID
const PRICE_ID = 'price_1R8YUeAVc47ah8I1XEfR4T7I'; // Our metered price ID

async function createSubscription() {
  try {
    // Calculate trial end (start of April 2025)
    const startOfApril = new Date(2025, 3, 1); // Month is 0-based, so 3 = April
    const trialEnd = Math.floor(startOfApril.getTime() / 1000);

    // Create the subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: CUSTOMER_ID,
      items: [{ price: PRICE_ID }],
      collection_method: 'send_invoice',
      days_until_due: 30,
      trial_end: trialEnd
    });

    console.log('Created subscription:', {
      id: subscription.id,
      status: subscription.status,
      trial_end: new Date(subscription.trial_end! * 1000).toISOString(),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      items: subscription.items.data.map(item => ({
        id: item.id,
        price_id: item.price.id,
        product_id: item.price.product,
      })),
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Run the creation
createSubscription(); 
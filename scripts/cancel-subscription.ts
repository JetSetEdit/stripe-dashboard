import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const SUBSCRIPTION_ID = 'sub_1R8YfBAVc47ah8I1hQTiIlo8'; // Nick's subscription ID

async function cancelSubscription() {
  try {
    // Cancel the subscription immediately
    const subscription = await stripe.subscriptions.cancel(SUBSCRIPTION_ID, {
      proration_behavior: 'none' // Don't prorate any charges
    });

    console.log('Cancelled subscription:', {
      id: subscription.id,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
    });

    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

// Run the cancellation
cancelSubscription(); 
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function createSubscription() {
  try {
    const customerId = 'cus_S1ENlAVDtRShhb';
    const priceId = 'price_1R8GScAVc47ah8I1Pe9lER01'; // New price at $0.84/minute

    // Create a new subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    console.log('Created subscription:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      items: subscription.items.data.map(item => ({
        priceId: item.price.id,
        quantity: item.quantity
      }))
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
  }
}

// Run the creation
createSubscription(); 
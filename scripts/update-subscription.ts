import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function updateSubscription() {
  try {
    const subscriptionId = 'sub_1R7xIuAVc47ah8I1FNkpfgdO';
    const newPriceId = 'price_1R8GOaAVc47ah8I1FEap0017';

    // Update the subscription with the new price
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: (await stripe.subscriptions.retrieve(subscriptionId)).items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'none'
    });

    console.log('Updated subscription:', {
      subscriptionId: subscription.id,
      status: subscription.status,
      items: subscription.items.data.map(item => ({
        priceId: item.price.id,
        quantity: item.quantity
      }))
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

// Run the update
updateSubscription(); 
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

async function listCustomers() {
  try {
    console.log('Fetching customers...');
    const customers = await stripe.customers.list({
      limit: 100,
      expand: ['data.subscriptions']
    });

    console.log('Customers with subscriptions:');
    for (const customer of customers.data) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 1,
        status: 'active'
      });

      const subscriptionItemId = subscriptions.data[0]?.items.data[0]?.id;
      
      console.log({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        subscriptionItemId: subscriptionItemId || 'No active subscription'
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
listCustomers(); 
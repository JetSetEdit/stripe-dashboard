import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function listSubscriptions() {
  try {
    console.log('Fetching subscriptions...');
    
    const subscriptions = await stripe.subscriptions.list({
      customer: 'cus_S1ENlAVDtRShhb',
      expand: ['data.customer', 'data.items']
    });

    subscriptions.data.forEach(sub => {
      console.log('\nSubscription:', {
        id: sub.id,
        customer: {
          id: sub.customer.id,
          name: (sub.customer as Stripe.Customer).name,
          email: (sub.customer as Stripe.Customer).email
        },
        status: sub.status
      });
      
      console.log('Items:', sub.items.data.map(item => ({
        id: item.id,
        price: {
          id: item.price.id,
          unit_amount: item.price.unit_amount,
          currency: item.price.currency
        }
      })));
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
  }
}

// Run the test
listSubscriptions(); 
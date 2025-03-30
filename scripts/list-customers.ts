import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function listCustomers() {
  try {
    console.log('Fetching customers...');
    
    const customers = await stripe.customers.list({
      limit: 10
    });

    console.log('Customers:', customers.data.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email
    })));
  } catch (error) {
    console.error('Error fetching customers:', error);
  }
}

// Run the test
listCustomers(); 
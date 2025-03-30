import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function listProducts() {
  try {
    // Get all products
    const products = await stripe.products.list({
      limit: 100,
      active: true,
    });

    console.log('\nActive Products:');
    for (const product of products.data) {
      console.log(`\nProduct: ${product.name}`);
      console.log(`ID: ${product.id}`);
      console.log(`Description: ${product.description}`);
      console.log(`Active: ${product.active}`);
      
      // Get prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      console.log('Associated Prices:');
      for (const price of prices.data) {
        console.log(`- Price ID: ${price.id}`);
        console.log(`  Amount: ${price.unit_amount ? price.unit_amount/100 : 'N/A'} ${price.currency.toUpperCase()}`);
        if (price.recurring) {
          console.log(`  Billing: ${price.recurring.interval}`);
          console.log(`  Usage Type: ${price.recurring.usage_type || 'standard'}`);
        }
      }
    }

  } catch (error) {
    console.error('Error listing products:', error);
  }
}

// Run the listing
listProducts(); 
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

async function createMeteredPrice() {
  try {
    // Create the product
    const product = await stripe.products.create({
      name: 'Time Tracking',
      description: 'Per-minute time tracking service',
    });

    console.log('Created product:', product);

    // Create the metered price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 84, // $0.84 per minute
      currency: 'aud',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
      },
    });

    console.log('Created price:', price);

    return {
      productId: product.id,
      priceId: price.id,
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run the creation
createMeteredPrice(); 
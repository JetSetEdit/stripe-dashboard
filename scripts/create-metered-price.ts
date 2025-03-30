import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function createMeteredPrice() {
  try {
    // First create a product for the metered price
    const product = await stripe.products.create({
      name: 'Time Tracking Service',
      description: 'Metered time tracking service billed per minute ($50/hour)',
    });

    // Create a metered price for the product
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'aud',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
        aggregate_usage: 'sum',
      },
      unit_amount: 84, // $0.84 AUD per minute (equivalent to $50/hour)
      billing_scheme: 'per_unit',
    });

    const hourlyRate = price.unit_amount ? (price.unit_amount * 60) / 100 : 0;

    console.log('Created metered price:', {
      priceId: price.id,
      productId: product.id,
      unitAmount: price.unit_amount,
      currency: price.currency,
      effectiveHourlyRate: hourlyRate, // In AUD
    });

  } catch (error) {
    console.error('Error creating metered price:', error);
  }
}

// Run the creation
createMeteredPrice(); 
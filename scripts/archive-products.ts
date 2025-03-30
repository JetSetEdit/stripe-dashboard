import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function archiveProducts() {
  try {
    // Archive the old price
    const oldPriceId = 'price_1R8GOaAVc47ah8I1FEap0017';
    console.log(`\nArchiving old price: ${oldPriceId}`);
    await stripe.prices.update(oldPriceId, {
      active: false
    });
    console.log('Price archived successfully');

    // Archive the old product
    const oldProductId = 'prod_S2L4KEEpODzUkw';
    console.log(`\nArchiving old product: ${oldProductId}`);
    await stripe.products.update(oldProductId, {
      active: false
    });
    console.log('Product archived successfully');

    // Verify the active products after archiving
    const activeProducts = await stripe.products.list({
      limit: 100,
      active: true,
    });

    console.log('\nRemaining active products:');
    for (const product of activeProducts.data) {
      console.log(`- ${product.name} (${product.id})`);
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });
      for (const price of prices.data) {
        console.log(`  Price: ${price.unit_amount ? price.unit_amount/100 : 'N/A'} ${price.currency.toUpperCase()} (${price.id})`);
      }
    }

  } catch (error) {
    console.error('Error archiving products:', error);
  }
}

// Run the archiving
archiveProducts(); 
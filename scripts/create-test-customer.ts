import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function createTestCustomer() {
  try {
    console.log('🔍 Creating test customer and subscription...\n');

    // 1. Create a product for time tracking
    const product = await stripe.products.create({
      name: 'Time Tracking Service',
      description: 'Metered time tracking service billed per minute',
    });
    console.log('✅ Created product:', {
      id: product.id,
      name: product.name
    });

    // 2. Create a metered price
    const price = await stripe.prices.create({
      product: product.id,
      currency: 'aud',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
        aggregate_usage: 'sum',
      },
      unit_amount: 84, // $0.84 AUD per minute
      billing_scheme: 'per_unit',
    });
    console.log('✅ Created price:', {
      id: price.id,
      unit_amount: price.unit_amount,
      currency: price.currency
    });

    // 3. Create a test customer
    const customer = await stripe.customers.create({
      name: 'Test Company',
      email: 'test@example.com',
      description: 'Test customer for time tracking',
    });
    console.log('✅ Created customer:', {
      id: customer.id,
      name: customer.name,
      email: customer.email
    });

    // 4. Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'allow_incomplete',
    });
    console.log('✅ Created subscription:', {
      id: subscription.id,
      status: subscription.status
    });

    // 5. Get subscription item
    const subscriptionItem = subscription.items.data[0];
    console.log('✅ Subscription item:', {
      id: subscriptionItem.id,
      priceId: subscriptionItem.price.id
    });

    // 6. Test creating a usage record
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItem.id,
      {
        quantity: 1,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment'
      }
    );
    console.log('✅ Created test usage record:', {
      id: usageRecord.id,
      quantity: usageRecord.quantity
    });

    // 7. Summary
    console.log('\n📋 Setup Summary:');
    console.log({
      product: {
        id: product.id,
        name: product.name
      },
      price: {
        id: price.id,
        unitAmount: `$${(price.unit_amount || 0) / 100} ${price.currency.toUpperCase()}/minute`
      },
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        subscriptionItemId: subscriptionItem.id
      }
    });

    return {
      customerId: customer.id,
      subscriptionId: subscription.id,
      subscriptionItemId: subscriptionItem.id
    };

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    throw error;
  }
}

createTestCustomer()
  .then(result => {
    console.log('\n✨ Setup complete! Save these IDs:');
    console.log(result);
  })
  .catch(error => {
    console.error('Failed to create test customer:', error);
    process.exit(1);
  }); 
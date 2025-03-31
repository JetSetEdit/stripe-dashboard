import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function testMeterEvents() {
  try {
    // 1. First, get a list of customers
    console.log('Fetching customers...');
    const customers = await stripe.customers.list({
      limit: 10,
      expand: ['data.subscriptions'],
    });

    // Find a customer with an active subscription
    const customerWithSubscription = customers.data.find(
      customer => customer.subscriptions?.data.length! > 0
    );

    if (!customerWithSubscription) {
      console.error('No customers found with active subscriptions');
      return;
    }

    const subscription = customerWithSubscription.subscriptions?.data[0];
    const subscriptionItem = subscription?.items.data[0];

    if (!subscriptionItem) {
      console.error('No subscription items found');
      return;
    }

    console.log('\nCustomer Details:');
    console.log('Name:', customerWithSubscription.name);
    console.log('Email:', customerWithSubscription.email);
    console.log('Subscription Item ID:', subscriptionItem.id);

    // 2. Create a test usage record
    console.log('\nCreating test usage record...');
    const testMinutes = 5;
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      subscriptionItem.id,
      {
        quantity: testMinutes,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    );

    console.log('\nUsage Record Created:');
    console.log('ID:', usageRecord.id);
    console.log('Quantity:', usageRecord.quantity);
    console.log('Timestamp:', new Date(usageRecord.timestamp * 1000).toLocaleString());

    // 3. Verify the usage was recorded
    console.log('\nVerifying usage record...');
    const usageRecordSummaries = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItem.id,
      { limit: 1 }
    );

    console.log('\nLatest Usage Summary:');
    const latestUsage = usageRecordSummaries.data[0];
    console.log('Total Usage:', latestUsage.total_usage);
    console.log('Period Start:', new Date(latestUsage.period.start * 1000).toLocaleString());
    console.log('Period End:', new Date(latestUsage.period.end * 1000).toLocaleString());

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testMeterEvents().then(() => process.exit(0)); 
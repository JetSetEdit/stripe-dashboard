import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function testPartialTimes() {
  try {
    // Get the active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: 'cus_S1ENlAVDtRShhb',
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      throw new Error('No active subscription found');
    }

    const subscriptionItem = subscriptions.data[0].items.data[0];
    const rate = 0.84; // $0.84 AUD per minute

    // Test cases
    const testCases = [
      { minutes: 17, description: '17 minutes' },
      { minutes: 45, description: '45 minutes' },
      { minutes: 90, description: '1 hour and 30 minutes' },
      { minutes: 7, description: '7 minutes' }
    ];

    console.log('\nTesting different time durations:');
    for (const test of testCases) {
      // Record usage
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: test.minutes,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment'
        }
      );

      // Calculate cost
      const cost = (test.minutes * rate).toFixed(2);
      
      console.log(`\nRecorded ${test.description}:`);
      console.log(`- Minutes: ${test.minutes}`);
      console.log(`- Cost: $${cost} AUD`);
      console.log(`- Usage Record ID: ${usageRecord.id}`);
    }

    // Get total usage
    console.log('\nFetching total usage...');
    const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItem.id,
      { limit: 10 }
    );

    const totalMinutes = usageRecords.data[0]?.total_usage || 0;
    const totalCost = (totalMinutes * rate).toFixed(2);

    console.log('\nTotal Usage Summary:');
    console.log(`- Total Minutes: ${totalMinutes}`);
    console.log(`- Total Cost: $${totalCost} AUD`);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testPartialTimes(); 
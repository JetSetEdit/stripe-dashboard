import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function testSystem() {
  console.log('🔍 Starting system test...\n');

  try {
    // 1. Get existing customer and subscription
    const customerId = 'cus_S1ENlAVDtRShhb'; // Nick Schaffer's customer ID
    const timeTrackingSubscriptionId = 'sub_1R8GSzAVc47ah8I1dZGQ2wmv'; // The subscription with $0.84/minute rate
    
    console.log('1️⃣ Fetching existing customer and subscription...');
    
    const [customer, subscription] = await Promise.all([
      stripe.customers.retrieve(customerId),
      stripe.subscriptions.retrieve(timeTrackingSubscriptionId, {
        expand: ['items.data.price']
      })
    ]);

    if (!customer || customer.deleted) {
      throw new Error('Customer not found or deleted');
    }

    console.log(`✅ Found customer: ${customer.name} (${customer.id})`);
    console.log(`✅ Using subscription: ${subscription.id}`);

    // Get subscription item for time tracking
    const subscriptionItem = subscription.items.data[0];
    const rate = subscriptionItem.price.unit_amount ? subscriptionItem.price.unit_amount / 100 : 0.84;
    
    console.log(`📝 Using subscription item: ${subscriptionItem.id}`);
    console.log(`💰 Rate: $${rate} AUD per minute\n`);

    // 2. Test different time durations
    const testDurations = [
      { minutes: 7, description: 'Quick meeting' },
      { minutes: 17, description: 'Team standup' },
      { minutes: 45, description: 'Planning session' },
      { minutes: 90, description: 'Extended workshop' }
    ];

    console.log('2️⃣ Testing time tracking with different durations...');
    
    for (const test of testDurations) {
      console.log(`\n📊 Recording ${test.minutes} minutes (${test.description})`);
      
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: test.minutes,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment'
        }
      );

      const cost = (test.minutes * rate).toFixed(2);
      console.log(`✅ Created usage record: ${usageRecord.id}`);
      console.log(`💰 Estimated cost: $${cost} AUD`);
    }

    // 3. Verify usage summary
    console.log('\n3️⃣ Verifying usage summary...');
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for records to be processed
    
    const summary = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItem.id,
      { limit: 100 }
    );

    const totalUsage = summary.data.reduce((acc, record) => acc + record.total_usage, 0);
    const totalCost = (totalUsage * rate).toFixed(2);
    
    console.log(`📈 Total usage: ${totalUsage} minutes`);
    console.log(`💵 Total cost: $${totalCost} AUD\n`);

    console.log('✨ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSystem(); 
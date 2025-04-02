import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function testTimeEntries() {
  try {
    console.log('🔍 Starting time entry tests...\n');

    // 1. Get customer and subscription
    const customerId = 'cus_S1ENlAVDtRShhb'; // Nick Schaffer
    const subscriptionId = 'sub_1R8GSzAVc47ah8I1dZGQ2wmv';

    const [customer, subscription] = await Promise.all([
      stripe.customers.retrieve(customerId),
      stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price']
      })
    ]);

    if (!customer || customer.deleted) {
      throw new Error('Customer not found or deleted');
    }

    console.log('✅ Found customer:', {
      id: customer.id,
      name: customer.name,
      email: customer.email
    });

    const subscriptionItem = subscription.items.data[0];
    console.log('\n📋 Using subscription item:', {
      id: subscriptionItem.id,
      priceId: subscriptionItem.price.id,
      amount: subscriptionItem.price.unit_amount,
      currency: subscriptionItem.price.currency
    });

    // 2. Test different time entries
    const testEntries = [
      { minutes: 15, description: 'Quick meeting' },
      { minutes: 30, description: 'Code review' },
      { minutes: 45, description: 'Development work' },
      { minutes: 60, description: 'Project planning' }
    ];

    console.log('\n🧪 Testing time entries...');

    for (const entry of testEntries) {
      console.log(`\n📝 Creating entry: ${entry.description} (${entry.minutes} minutes)`);
      
      try {
        const usageRecord = await stripe.subscriptionItems.createUsageRecord(
          subscriptionItem.id,
          {
            quantity: entry.minutes,
            timestamp: Math.floor(Date.now() / 1000),
            action: 'increment'
          }
        );

        console.log('✅ Usage record created:', {
          id: usageRecord.id,
          quantity: usageRecord.quantity,
          timestamp: new Date(usageRecord.timestamp * 1000).toISOString()
        });
      } catch (error) {
        console.error('❌ Failed to create usage record:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          entry
        });
      }
    }

    // 3. Verify total usage
    console.log('\n📊 Verifying usage records...');
    const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItem.id,
      { limit: 10 }
    );

    const totalUsage = usageRecords.data.reduce((sum, record) => sum + record.total_usage, 0);
    const rate = subscriptionItem.price.unit_amount ? subscriptionItem.price.unit_amount / 100 : 0.84;
    const totalCost = totalUsage * rate;

    console.log('\n💡 Usage summary:', {
      totalMinutes: totalUsage,
      ratePerMinute: `$${rate.toFixed(2)} ${subscriptionItem.price.currency.toUpperCase()}`,
      totalCost: `$${totalCost.toFixed(2)} ${subscriptionItem.price.currency.toUpperCase()}`
    });

    // 4. Show individual records
    console.log('\n📜 Recent usage records:');
    usageRecords.data.forEach(record => {
      console.log({
        period: {
          start: new Date(record.period.start * 1000).toISOString(),
          end: new Date(record.period.end * 1000).toISOString()
        },
        usage: record.total_usage,
        cost: `$${(record.total_usage * rate).toFixed(2)} ${subscriptionItem.price.currency.toUpperCase()}`
      });
    });

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testTimeEntries().then(() => console.log('\n✨ Test complete!')); 
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function verifySubscriptions() {
  try {
    console.log('🔍 Starting subscription verification...\n');

    // 1. Get customer
    const customerId = 'cus_S1ENlAVDtRShhb'; // Nick Schaffer
    const customer = await stripe.customers.retrieve(customerId);
    
    if (!customer || customer.deleted) {
      throw new Error('Customer not found or deleted');
    }
    
    console.log('✅ Found customer:', {
      id: customer.id,
      name: customer.name,
      email: customer.email
    });

    // 2. Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price']
    });

    console.log('\n📋 Active subscriptions:', subscriptions.data.length);

    for (const subscription of subscriptions.data) {
      console.log('\n🔎 Subscription:', {
        id: subscription.id,
        status: subscription.status,
        items: subscription.items.data.map(item => ({
          id: item.id,
          priceId: item.price.id,
          amount: item.price.unit_amount,
          currency: item.price.currency
        }))
      });

      // 3. Test usage record creation for each subscription item
      for (const item of subscription.items.data) {
        console.log(`\n📝 Testing usage record creation for item: ${item.id}`);
        try {
          const usageRecord = await stripe.subscriptionItems.createUsageRecord(
            item.id,
            {
              quantity: 1, // Test with 1 minute
              timestamp: Math.floor(Date.now() / 1000),
              action: 'increment'
            }
          );

          console.log('✅ Successfully created usage record:', {
            id: usageRecord.id,
            quantity: usageRecord.quantity,
            timestamp: new Date(usageRecord.timestamp * 1000).toISOString()
          });

          // 4. Verify usage record was created
          const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
            item.id,
            { limit: 1 }
          );

          console.log('📊 Latest usage summary:', {
            totalUsage: usageRecords.data[0]?.total_usage,
            period: {
              start: new Date(usageRecords.data[0]?.period.start * 1000).toISOString(),
              end: new Date(usageRecords.data[0]?.period.end * 1000).toISOString()
            }
          });
        } catch (error) {
          console.error('❌ Failed to create usage record:', {
            itemId: item.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifySubscriptions().then(() => console.log('\n✨ Verification complete!')); 
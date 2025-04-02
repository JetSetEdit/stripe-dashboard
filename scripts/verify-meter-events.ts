import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function verifyMeterEvents() {
  try {
    const customerId = 'cus_S1ENlAVDtRShhb';
    console.log('Fetching customer details...');
    
    // Get customer details
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      console.log('\nCustomer:', {
        id: customer.id,
        name: customer.name || 'No name',
        email: customer.email || 'No email'
      });
    }

    // Get active subscriptions
    console.log('\nFetching active subscriptions...');
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price']
    });

    console.log('Active Subscriptions:', subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
      items: sub.items.data.map(item => ({
        id: item.id,
        price: {
          id: item.price.id,
          unit_amount: item.price.unit_amount,
          currency: item.price.currency,
          recurring: item.price.recurring
        }
      }))
    })));

    // Record usage for the subscription item
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const subscriptionItem = subscription.items.data[0];
      
      // Create first usage record
      console.log('\nCreating first usage record...');
      const usageRecord1 = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: 30,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment'
        }
      );
      console.log('\nCreated First Usage Record:', usageRecord1);

      // Create second usage record
      console.log('\nCreating second usage record...');
      const usageRecord2 = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: 20,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment'
        }
      );
      console.log('\nCreated Second Usage Record:', usageRecord2);

      // Wait for records to be processed
      console.log('\nWaiting 5 seconds for usage records to be processed...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get usage record summaries
      console.log('\nFetching usage record summaries...');
      const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
        subscriptionItem.id,
        {
          limit: 10
        }
      );
      console.log('\nUsage Record Summaries:', usageRecords);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the verification
verifyMeterEvents(); 
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

const SUBSCRIPTION_ITEM_ID = 'si_S2dxn1p7ciPdDk'; // Nick's subscription item ID

async function testUsage() {
  try {
    // Create a test usage record (1 minute)
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      SUBSCRIPTION_ITEM_ID,
      {
        quantity: 1,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment'
      }
    );

    console.log('Created usage record:', {
      id: usageRecord.id,
      quantity: usageRecord.quantity,
      timestamp: new Date(usageRecord.timestamp * 1000).toISOString(),
      subscription_item: usageRecord.subscription_item
    });

    return usageRecord;
  } catch (error) {
    console.error('Error creating usage record:', error);
    throw error;
  }
}

// Run the test
testUsage(); 
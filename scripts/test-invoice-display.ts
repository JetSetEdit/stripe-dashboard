import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

async function testInvoiceDisplay() {
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

    const subscription = subscriptions.data[0];
    const subscriptionItem = subscription.items.data[0];
    const rate = 0.84; // $0.84 AUD per minute

    // Create a few test usage records with different durations
    const testCases = [
      { minutes: 5, description: '5 minutes meeting' },
      { minutes: 12, description: '12 minutes consultation' },
      { minutes: 3, description: '3 minutes quick check' }
    ];

    console.log('\nRecording test usage entries:');
    for (const test of testCases) {
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItem.id,
        {
          quantity: test.minutes,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment'
        }
      );

      console.log(`\nRecorded ${test.description}:`);
      console.log(`- Minutes: ${test.minutes}`);
      console.log(`- Cost: $${(test.minutes * rate).toFixed(2)} AUD`);
      console.log(`- Usage Record ID: ${usageRecord.id}`);
    }

    // Wait a moment for the usage records to be processed
    console.log('\nWaiting for usage records to be processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Retrieve the upcoming invoice to see how usage is displayed
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: subscription.customer as string,
      subscription: subscription.id
    });

    console.log('\nUpcoming Invoice Details:');
    console.log('------------------------');
    console.log(`Invoice Total: $${(upcomingInvoice.total || 0) / 100} AUD`);
    
    console.log('\nLine Items:');
    upcomingInvoice.lines.data.forEach(line => {
      if (line.period) {
        console.log(`\nPeriod: ${new Date(line.period.start * 1000).toLocaleDateString()} to ${new Date(line.period.end * 1000).toLocaleDateString()}`);
      }
      console.log(`Description: ${line.description || 'Time Tracking Usage'}`);
      console.log(`Quantity: ${line.quantity || 0} minutes`);
      console.log(`Amount: $${(line.amount || 0) / 100} AUD`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testInvoiceDisplay(); 
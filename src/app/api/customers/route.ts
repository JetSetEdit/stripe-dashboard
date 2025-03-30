import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
})

export async function GET() {
  try {
    console.log('Fetching customers with subscriptions...');
    
    // First, get the list of customers with their subscriptions
    const customers = await stripe.customers.list({
      limit: 100,
      expand: ['data.subscriptions']
    });

    if (!customers?.data || !Array.isArray(customers.data)) {
      console.error('Invalid response from Stripe:', customers);
      return NextResponse.json([], { status: 200 });
    }

    console.log('Processing customers data...');

    // Process each customer and fetch their subscription items separately
    const transformedCustomers = await Promise.all(
      customers.data
        .filter(customer => customer && !customer.deleted)
        .map(async customer => {
          const activeSubscriptions = customer.subscriptions?.data
            ?.filter(sub => sub.status === 'active') || [];

          // Fetch subscription items for each active subscription
          const subscriptionsWithItems = await Promise.all(
            activeSubscriptions.map(async sub => {
              const subItems = await stripe.subscriptionItems.list({
                subscription: sub.id
              });

              return {
                id: sub.id,
                status: sub.status,
                current_period_end: sub.current_period_end,
                subscriptionItemId: subItems.data[0]?.id || null
              };
            })
          );

          return {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            subscriptionItemId: subscriptionsWithItems[0]?.subscriptionItemId || null
          };
        })
    );

    const validCustomers = transformedCustomers.filter(customer => customer.subscriptionItemId);

    console.log('Returning transformed customers:', validCustomers);

    return NextResponse.json(validCustomers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json([], { status: 200 });
  }
} 
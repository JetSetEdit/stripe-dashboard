import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

export async function GET(
  request: Request,
  { params }: { params: { subscriptionItemId: string } }
) {
  try {
    const { subscriptionItemId } = params;

    const usageRecords = await stripe.subscriptionItems.listUsageRecordSummaries(
      subscriptionItemId,
      { limit: 100 }
    );

    return NextResponse.json(usageRecords.data);
  } catch (error) {
    console.error('Error fetching usage records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage records' },
      { status: 500 }
    );
  }
} 
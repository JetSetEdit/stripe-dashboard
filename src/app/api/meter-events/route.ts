import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import dotenv from 'dotenv'
import { prisma } from '@/lib/db'

dotenv.config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { subscriptionItemId, minutes, description, timeEntry } = body

    console.log('Processing time entry request:', {
      subscriptionItemId,
      minutes,
      description,
      customerId: timeEntry?.customerId,
      startTime: timeEntry?.startTime,
      endTime: timeEntry?.endTime
    })

    // Validate required fields
    if (!subscriptionItemId || !subscriptionItemId.startsWith('si_')) {
      return NextResponse.json(
        { error: 'Invalid subscription item ID', details: 'Subscription item ID must start with "si_"' },
        { status: 400 }
      )
    }

    if (!minutes || minutes <= 0) {
      return NextResponse.json(
        { error: 'Invalid minutes', details: 'Minutes must be a positive number' },
        { status: 400 }
      )
    }

    if (!timeEntry || !timeEntry.customerId || !timeEntry.startTime || !timeEntry.endTime) {
      return NextResponse.json(
        { error: 'Invalid time entry', details: 'Missing required time entry fields' },
        { status: 400 }
      )
    }

    // 1. First create the time entry in the database
    const dbTimeEntry = await prisma.timeEntry.create({
      data: {
        customerId: timeEntry.customerId,
        startTime: new Date(timeEntry.startTime),
        endTime: new Date(timeEntry.endTime),
        minutes: timeEntry.minutes,
        description: timeEntry.description || '',
        subscriptionItemId: subscriptionItemId,
      }
    }).catch(error => {
      console.error('Database error creating time entry:', error);
      throw new Error('Failed to create time entry in database');
    });

    console.log('Time entry created in database:', dbTimeEntry)

    // 2. Create the usage record in Stripe
    try {
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        subscriptionItemId,
        {
          quantity: minutes,
          timestamp: Math.floor(Date.now() / 1000),
          action: 'increment',
        }
      )

      console.log('Usage record created:', usageRecord)

      // 3. Update the time entry with the usage record ID
      const updatedTimeEntry = await prisma.timeEntry.update({
        where: { id: dbTimeEntry.id },
        data: { usageRecordId: usageRecord.id }
      })

      console.log('Time entry updated with usage record ID:', updatedTimeEntry)

      return NextResponse.json({
        success: true,
        data: {
          timeEntry: updatedTimeEntry,
          usageRecord: {
            id: usageRecord.id,
            quantity: usageRecord.quantity,
            timestamp: usageRecord.timestamp
          }
        }
      })
    } catch (stripeError: any) {
      // If Stripe fails, delete the time entry and report the error
      await prisma.timeEntry.delete({
        where: { id: dbTimeEntry.id }
      }).catch(error => {
        console.error('Failed to delete time entry after Stripe error:', error);
      });

      console.error('Stripe API error:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        param: stripeError.param,
        raw: stripeError
      })

      return NextResponse.json(
        { 
          error: 'Failed to create usage record',
          details: stripeError.message,
          code: stripeError.code || 'unknown'
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message || 'An unexpected error occurred',
        code: error.code || 'unknown'
      },
      { status: 500 }
    )
  }
} 
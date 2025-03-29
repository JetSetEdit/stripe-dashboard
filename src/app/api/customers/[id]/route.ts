import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deletedCustomer = await stripe.customers.del(params.id)
    return NextResponse.json(deletedCustomer)
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 
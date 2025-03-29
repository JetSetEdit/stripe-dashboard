import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const { productId } = await request.json()
    const price = await stripe.prices.create({
      unit_amount: 2000, // $20.00
      currency: 'usd',
      product: productId,
    })
    return NextResponse.json(price)
  } catch (error) {
    console.error('Error creating price:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 
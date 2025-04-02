import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
})

export async function POST() {
  try {
    const product = await stripe.products.create({
      name: 'Test Product',
      description: 'A test product created via the API',
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 
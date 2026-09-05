const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const User = require('../models/mongo/User')

const createCheckoutSession = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      client_reference_id: user._id.toString(),
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Add to .env
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard?success=true`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/pricing?canceled=true`,
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ error: 'Could not create checkout session' })
  }
}

const webhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    // req.body MUST be raw body for Stripe signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.client_reference_id
      const customerId = session.customer
      const subscriptionId = session.subscription

      await User.findByIdAndUpdate(userId, {
        tier: 'pro',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId
      })
      console.log(`User ${userId} upgraded to PRO via checkout`)
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      await User.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { tier: 'free' }
      )
      console.log(`Subscription ${subscription.id} deleted. Downgraded user to free.`)
    }
    
    // Other events (e.g. invoice.payment_failed) can be handled similarly
    
    res.json({ received: true })
  } catch (err) {
    console.error('Error processing webhook:', err)
    res.status(500).send('Webhook processing error')
  }
}

module.exports = { createCheckoutSession, webhook }

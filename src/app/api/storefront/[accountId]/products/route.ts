import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

/**
 * GET /api/storefront/[accountId]/products
 * Public API to fetch products for a connected account's storefront
 *
 * IMPORTANT: In production, you should NOT use the Stripe account ID in the URL
 * Instead, use a custom identifier (like team slug, subdomain, or custom ID)
 * and look up the corresponding Stripe account ID from your database.
 *
 * Example: /api/storefront/acme-corp/products
 * Then query: SELECT stripe_account_id FROM teams WHERE slug = 'acme-corp'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params

    // TODO: In production, replace this with a database lookup
    // Example:
    // const team = await db.teams.findOne({ slug: accountId })
    // const stripeAccountId = team.stripe_account_id

    if (!accountId || !accountId.startsWith('acct_')) {
      return NextResponse.json(
        { error: 'Invalid account identifier' },
        { status: 400 }
      )
    }

    // Fetch products from the connected account using Stripe-Account header
    // Documentation: https://docs.stripe.com/connect/authentication
    const stripe = getStripe()

    const products = await stripe.products.list({
      limit: 100,
      active: true,
      expand: ['data.default_price'], // Expand to get price details
    }, {
      // IMPORTANT: Use stripeAccount to set Stripe-Account header
      // This fetches products from the connected account, not the platform
      stripeAccount: accountId,
    })

    // Transform products for frontend
    const productsData = products.data.map(product => {
      const defaultPrice = product.default_price as any

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        priceId: defaultPrice?.id,
        price: defaultPrice?.unit_amount || 0,
        currency: defaultPrice?.currency || 'usd',
      }
    })

    return NextResponse.json({
      products: productsData,
      accountId,
    })
  } catch (error: any) {
    console.error('[Storefront API] Error fetching products:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid Stripe account or account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

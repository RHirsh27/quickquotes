'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, ShoppingCart, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  images: string[]
  priceId: string
  price: number
  currency: string
}

export default function StorefrontPage() {
  const params = useParams()
  const accountId = params?.accountId as string

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    if (accountId) {
      loadProducts()
    }
  }, [accountId])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/storefront/${accountId}/products`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load products')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err: any) {
      console.error('Error loading products:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (product: Product) => {
    setPurchasing(product.id)

    try {
      const response = await fetch(`/api/storefront/${accountId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: product.priceId,
          quantity: 1,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      console.error('Error creating checkout:', err)
      alert(err.message || 'Failed to start checkout')
      setPurchasing(null)
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading storefront...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Storefront</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <h1 className="text-3xl font-bold text-gray-900">Storefront</h1>
          <p className="text-gray-600 mt-1">
            Browse and purchase products
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No products available
            </h2>
            <p className="text-gray-600">
              This store doesn't have any products yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-blue-300" />
                  )}
                </div>

                {/* Product Details */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(product.price, product.currency)}
                    </div>

                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={purchasing === product.id}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {purchasing === product.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Buy Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note for developers:</strong> This storefront uses the Stripe account ID in the URL ({accountId}).
            In production, you should use a custom identifier (like team slug or subdomain) and look up the
            Stripe account ID from your database for better security and user experience.
          </p>
        </div>
      </div>
    </div>
  )
}

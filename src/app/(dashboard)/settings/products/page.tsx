'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import { Package, Plus, Loader2, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createConnectProduct,
  listConnectProducts,
  getTeamConnectAccount,
} from '@/app/actions/stripe-connect'

interface Product {
  id: string
  name: string
  description: string | null
  defaultPrice: any
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      // Get team's Connect account
      const accountResult = await getTeamConnectAccount()
      if (accountResult.accountId) {
        setAccountId(accountResult.accountId)
      }

      // Load products
      const result = await listConnectProducts()
      if (result.error) {
        console.error('Error loading products:', result.error)
      } else if (result.products) {
        setProducts(result.products)
      }
    } catch (error: any) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Product name is required')
      return
    }

    const priceNum = parseFloat(price)
    if (!priceNum || priceNum <= 0) {
      toast.error('Price must be greater than 0')
      return
    }

    setCreating(true)
    try {
      // Convert dollars to cents for Stripe
      const priceInCents = Math.round(priceNum * 100)

      const result = await createConnectProduct({
        name: name.trim(),
        description: description.trim(),
        priceInCents,
        currency: 'usd',
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Product created successfully!')

        // Reset form
        setName('')
        setDescription('')
        setPrice('')
        setShowForm(false)

        // Reload products
        loadProducts()
      }
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast.error(error.message || 'Failed to create product')
    } finally {
      setCreating(false)
    }
  }

  const formatPrice = (defaultPrice: any) => {
    if (!defaultPrice || typeof defaultPrice !== 'object') {
      return 'N/A'
    }

    const amount = defaultPrice.unit_amount || 0
    const currency = defaultPrice.currency || 'usd'

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!accountId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">
            Connect Your Stripe Account First
          </h2>
          <p className="text-yellow-800 mb-4">
            Before you can create products, you need to complete Stripe Connect onboarding.
          </p>
          <a
            href="/settings/payments"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Payment Settings
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Create and manage products for your storefront
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {/* Create Product Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Product</h2>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Premium Service Package"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.99"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Product'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first product to start selling
          </p>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono">{product.id}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.defaultPrice)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {product.defaultPrice?.currency?.toUpperCase() || 'USD'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          About Connect Products
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Products are created on your connected Stripe account</li>
          <li>• Customers can purchase these products from your storefront</li>
          <li>• Payments go directly to your connected account (minus platform fee)</li>
          <li>• You can manage products in your Stripe dashboard</li>
        </ul>
      </div>
    </div>
  )
}

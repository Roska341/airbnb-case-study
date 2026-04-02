'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'motion/react';
import { ArrowLeft, ShoppingCart, Plus, Minus, CheckCircle, Loader2 } from 'lucide-react';

interface SwagItem {
  id: string;
  name: string;
  price: number;
  sizes: string[] | null;
  image: string;
  category?: string;
  description?: string;
}

interface GatheringData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  groupSize: number;
}

export default function SwagShopPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const router = useRouter();
  const { addToast } = useToast();
  const [swagItems, setSwagItems] = useState<SwagItem[]>([]);
  const [gathering, setGathering] = useState<GatheringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<{id: string, qty: number, size?: string}[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [gatheringRes, swagRes] = await Promise.all([
          fetch(`/api/gatherings/${id}`),
          fetch('/api/swag/catalog'),
        ]);

        if (!gatheringRes.ok) {
          addToast({ message: 'Failed to load gathering details', type: 'error' });
        } else {
          const gatheringData: GatheringData = await gatheringRes.json();
          setGathering(gatheringData);
        }

        if (!swagRes.ok) {
          addToast({ message: 'Failed to load swag catalog', type: 'error' });
        } else {
          const swagData: SwagItem[] = await swagRes.json();
          setSwagItems(swagData);
        }
      } catch {
        addToast({ message: 'An error occurred while loading data', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDeliveryDate = (): string => {
    if (!gathering?.startDate) return 'before the event';
    try {
      const eventDate = new Date(gathering.startDate);
      eventDate.setDate(eventDate.getDate() - 2);
      return eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return 'before the event'; }
  };

  const addToCart = (item: SwagItem, size?: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.size === size);
      if (existing) {
        return prev.map(i => i.id === item.id && i.size === size ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: item.id, qty: 1, size }];
    });
    addToast({ message: `Added ${item.name}${size ? ` (${size})` : ''} to cart`, type: 'success', duration: 2000 });
  };

  const removeFromCart = (itemId: string, size?: string) => {
    const removed = cart.find(i => i.id === itemId && i.size === size);
    const product = swagItems.find(p => p.id === itemId);

    setCart(prev => prev.filter(i => !(i.id === itemId && i.size === size)));

    if (removed && product) {
      addToast({
        message: `Removed ${product.name} from cart`,
        type: 'info',
        undoAction: () => {
          setCart(prev => [...prev, removed]);
        }
      });
    }
  };

  const updateQty = (itemId: string, size: string | undefined, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId && i.size === size) {
        return { ...i, qty: Math.max(1, i.qty + delta) };
      }
      return i;
    }));
  };

  const total = cart.reduce((sum, item) => {
    const product = swagItems.find(p => p.id === item.id);
    return sum + (product?.price || 0) * item.qty;
  }, 0);

  const handleOrder = async () => {
    setIsOrdering(true);
    try {
      const cartItems = cart.map(ci => {
        const product = swagItems.find(p => p.id === ci.id);
        return { ...ci, name: product?.name, price: product?.price };
      });

      // Call mock order API
      const orderRes = await fetch('/api/swag/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems, totalCost: total }),
      });

      if (!orderRes.ok) {
        addToast({ message: 'Order failed. Please try again.', type: 'error' });
        return;
      }

      // Save order to gathering record
      await fetch(`/api/gatherings/${id}/swag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: JSON.stringify(cartItems),
          totalCost: total,
        }),
      });

      setOrderPlaced(true);
      setCart([]);
    } catch {
      addToast({ message: 'An error occurred while placing your order', type: 'error' });
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-12 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-foggy" />
          <p className="text-foggy">Loading swag catalog...</p>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-20 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6">
          <div className="w-24 h-24 bg-babu/10 text-babu rounded-pill flex items-center justify-center mx-auto">
            <CheckCircle size={48} />
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold text-kazan mb-4">Order Placed Successfully!</h2>
        <p className="text-foggy text-lg max-w-md mb-8">Your team swag is being prepared. Estimated delivery to the venue by {getDeliveryDate()}.</p>
        <Button onClick={() => router.push(`/gathering/${id}`)}>Back to Gathering Hub</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-12">
      <Link href={`/gathering/${id}`} className="inline-flex items-center text-foggy hover:text-kazan transition-colors mb-8">
        <ArrowLeft size={16} className="mr-2" /> Back to Hub
      </Link>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-kazan mb-2">Swag Shop</h1>
          <p className="text-foggy text-lg mb-10">Order branded items for your team gathering.</p>

          {swagItems.length === 0 ? (
            <div className="text-center py-16 text-foggy">
              <p className="text-lg">No swag items available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {swagItems.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-0 overflow-hidden hover:shadow-elevated transition-shadow h-full flex flex-col">
                    <div className="aspect-square w-full bg-bg-gray overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-kazan text-lg mb-1 leading-tight">{item.name}</h3>
                      <p className="text-foggy font-medium mb-4">${item.price}</p>

                      <div className="mt-auto">
                        {item.sizes ? (
                          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            {item.sizes.map(size => (
                              <button
                                key={size}
                                className="px-3 py-1 border border-light-gray rounded-md text-sm font-medium text-foggy hover:border-kazan hover:text-kazan transition-colors shrink-0"
                                onClick={() => addToCart(item, size)}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <Button variant="secondary" className="w-full mt-4" onClick={() => addToCart(item)}>
                            Add to Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 shrink-0">
          <div className="sticky top-24">
            <Card className="border border-light-gray shadow-resting">
              <div className="p-6 border-b border-light-gray flex items-center gap-3">
                <ShoppingCart size={20} className="text-kazan" />
                <h3 className="font-bold text-kazan text-lg">Your Order</h3>
                {cart.length > 0 && <Badge variant="active" className="ml-auto">{cart.length}</Badge>}
              </div>

              <CardContent className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-foggy">
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {cart.map((item, i) => {
                      const product = swagItems.find(p => p.id === item.id);
                      if (!product) return null;
                      return (
                        <div key={`${item.id}-${item.size}-${i}`} className="flex gap-4">
                          <div className="w-16 h-16 bg-bg-gray rounded-md overflow-hidden shrink-0">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-kazan text-sm leading-tight mb-1">{product.name}</h4>
                            <div className="flex justify-between items-center text-sm text-foggy mb-2">
                              <span>{item.size ? `Size: ${item.size}` : 'One Size'}</span>
                              <span className="font-medium text-kazan">${product.price * item.qty}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => updateQty(item.id, item.size, -1)} className="w-6 h-6 rounded-pill border border-light-gray flex items-center justify-center text-foggy hover:border-kazan hover:text-kazan"><Minus size={12}/></button>
                              <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                              <button onClick={() => updateQty(item.id, item.size, 1)} className="w-6 h-6 rounded-pill border border-light-gray flex items-center justify-center text-foggy hover:border-kazan hover:text-kazan"><Plus size={12}/></button>
                              <button onClick={() => removeFromCart(item.id, item.size)} className="text-xs text-rausch hover:underline ml-auto">Remove</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="p-4 bg-babu/5 border border-babu/20 rounded-btn">
                      <p className="text-xs font-bold text-babu uppercase tracking-wider mb-1">Smart Suggestion</p>
                      <p className="text-sm text-kazan">Based on team registrations: 4 M, 6 L, 2 XL</p>
                    </div>

                    <div className="pt-4 border-t border-light-gray flex justify-between items-center">
                      <span className="font-bold text-kazan">Total</span>
                      <span className="text-2xl font-bold text-kazan">${total}</span>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleOrder}
                      isLoading={isOrdering}
                    >
                      Place Order
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

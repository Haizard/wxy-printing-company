import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatTZS } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { toast } = useToast();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          paymentMethod: "cash",
        }),
      });

      if (response.ok) {
        const order = await response.json();
        toast({
          title: "Order placed!",
          description: `${order.orderNumber} created successfully`,
          variant: "success",
        });
        clearCart();
      } else {
        const err = await response.json();
        toast({ title: "Failed", description: err.error, variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to place order", variant: "destructive" });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Shopping Cart</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Review your items and checkout
        </p>
      </motion.div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">Your cart is empty</p>
            <p className="text-caption text-[var(--text-tertiary)]">Add items from the calculator</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-subhead font-semibold">{item.name}</h3>
                      <p className="text-caption text-[var(--text-tertiary)]">
                        {formatTZS(item.price)} per unit
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center text-subhead font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-headline font-bold text-[var(--accent-primary)]">
                        {formatTZS(item.price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-[var(--accent-danger)] mt-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order summary */}
          <div>
            <Card variant="strong" className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-caption">
                      <span className="text-[var(--text-secondary)] truncate">
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatTZS(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-headline font-bold">Total</span>
                  <span className="text-title-2 font-bold text-[var(--accent-primary)]">
                    {formatTZS(total)}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {checkingOut ? "Processing..." : "Place Order"}
                </Button>
                <Button variant="ghost" className="w-full" onClick={clearCart}>
                  Clear Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

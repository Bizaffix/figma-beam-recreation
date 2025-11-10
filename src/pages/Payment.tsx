import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const location = useLocation();
  const retreatFromState = (location.state as any)?.retreat;
  const bookingFromState = (location.state as any)?.booking;

  const retreat =
    retreatFromState ?? {
      image: "/placeholder.svg",
      title: "Coastal Quilting Escape",
      date: "Feb 14-17, 2026",
      location: "Mendocino, California",
      price: 900,
    };

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      <div className="px-6 max-w-4xl mx-auto space-y-6 pt-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={retreat.image} alt={retreat.title} className="w-20 h-16 rounded-md object-cover" />
              <div>
                <p className="font-semibold text-card-foreground">{retreat.title}</p>
                <p className="text-sm text-muted-foreground">{retreat.date}</p>
                <p className="text-sm text-muted-foreground">{retreat.location}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">${retreat.price}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <div className="w-5 h-5 rounded border border-border flex items-center justify-center">💳</div>
              <p className="text-sm">Secure payment powered by Stripe</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <Input placeholder="1234 5678 9012 3456" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label>Expiry Date</Label>
                  <Input placeholder="MM/YY" />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input placeholder="123" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted/20 rounded-md text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-4">🔒</span>
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Retreat price</span>
                <span>${retreat.price}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Service fee</span>
                <span>$0</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-card-foreground">
                <span>Total</span>
                <span className="text-primary">${retreat.price}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="fixed bottom-4 left-0 right-0 px-6">
        <div className="max-w-4xl mx-auto">
          <Button className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white" onClick={() => alert('Payment flow not implemented in demo') }>
            Confirm & Pay
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Payment;

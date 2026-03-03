
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Banknote, CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast({
        title: "تم تأكيد الحجز!",
        description: "تم إرسال تذاكرك وبيانات الحجز إلى بريدك الإلكتروني بنجاح.",
      });
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-in zoom-in duration-500">
        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold font-headline">تم الحجز بنجاح!</h1>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3 max-w-xs mx-auto">
          <Mail className="h-5 w-5 text-primary" />
          <p className="text-xs text-primary font-medium">تم إرسال نسخة من التذاكر إلى بريدك الإلكتروني.</p>
        </div>
        <p className="text-muted-foreground max-w-xs">
          اكتمل حجزك بنجاح. يمكنك الآن تتبع موقع الحافلة أو الطرود عبر التطبيق.
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <Button className="w-full h-12" onClick={() => router.push("/track")}>
            تتبع رحلتي
          </Button>
          <Button variant="outline" className="w-full h-12" onClick={() => router.push("/")}>
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">طرق الدفع</h1>
      </header>

      <div className="space-y-4">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="bg-primary/5 border-b py-4">
            <CardTitle className="text-base font-semibold">اختر وسيلة الدفع</CardTitle>
            <CardDescription>حدد الطريقة المفضلة لديك لإتمام الحجز</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <RadioGroup defaultValue="card" onValueChange={setPaymentMethod} className="space-y-4">
              <Label
                htmlFor="card"
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "card" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:bg-muted"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div className="font-medium text-base text-right">بطاقة ائتمان / مدى</div>
                </div>
                <RadioGroupItem value="card" id="card" className="sr-only" />
              </Label>

              <Label
                htmlFor="wallet"
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "wallet" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:bg-muted"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="font-medium text-base text-right">Apple Pay / Google Pay</div>
                </div>
                <RadioGroupItem value="wallet" id="wallet" className="sr-only" />
              </Label>

              <Label
                htmlFor="cash"
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:bg-muted"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Banknote className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="font-medium text-base text-right">دفع نقدي في المكتب</div>
                </div>
                <RadioGroupItem value="cash" id="cash" className="sr-only" />
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>

        {paymentMethod === "card" && (
          <Card className="animate-in slide-in-from-top-2 shadow-sm">
            <CardContent className="p-6 space-y-4 text-right">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">رقم البطاقة</Label>
                <input className="w-full p-3 border rounded-xl bg-muted/20 focus:bg-white transition-all outline-none focus:ring-1 focus:ring-primary/20" placeholder="0000 0000 0000 0000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">تاريخ الانتهاء</Label>
                  <input className="w-full p-3 border rounded-xl bg-muted/20 focus:bg-white transition-all outline-none focus:ring-1 focus:ring-primary/20" placeholder="MM/YY" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">CVV</Label>
                  <input className="w-full p-3 border rounded-xl bg-muted/20 focus:bg-white transition-all outline-none focus:ring-1 focus:ring-primary/20" placeholder="123" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-6">
          <Button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full h-16 text-xl font-bold shadow-xl rounded-2xl bg-primary hover:bg-primary/95 transition-all"
          >
            {isProcessing ? "جاري معالجة الطلب..." : `تأكيد الحجز والدفع`}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-4 leading-relaxed">
            بتأكيد الحجز، أنت توافق على شروط الخدمة وسياسة الخصوصية للعوجان للسفر. ستصلك التذاكر على بريدك الإلكتروني فور إتمام العملية.
          </p>
        </div>
      </div>
    </div>
  );
}


"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Plus, Trash2, Users, Mail, Phone, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminDrivers() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    fullName: "", 
    email: "", 
    phoneNumber: "" 
  });

  const driversRef = useMemoFirebase(() => collection(firestore, "drivers"), [firestore]);
  const { data: drivers, isLoading } = useCollection(driversRef);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى تعبئة الاسم والبريد الإلكتروني" });
      return;
    }

    addDocumentNonBlocking(driversRef, {
      ...formData,
      createdAt: new Date().toISOString()
    });

    toast({ title: "تمت الإضافة", description: "تم تسجيل السائق بنجاح في النظام" });
    setFormData({ fullName: "", email: "", phoneNumber: "" });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا السائق؟")) {
      deleteDocumentNonBlocking(doc(firestore, "drivers", id));
      toast({ title: "تم الحذف", description: "تمت إزالة السائق من النظام" });
    }
  };

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة السائقين</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة سائق</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input 
                  placeholder="مثلاً: محمد أحمد العتوم" 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني (المستخدم للدخول)</Label>
                  <Input 
                    type="email"
                    placeholder="driver@alawajan.com" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <Input 
                    placeholder="05XXXXXXXX" 
                    value={formData.phoneNumber}
                    onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl">حفظ بيانات السائق</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : drivers?.length === 0 ? (
          <div className="text-center p-12 bg-muted/20 rounded-3xl border-2 border-dashed">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">لا يوجد سائقون مسجلون حالياً</p>
          </div>
        ) : drivers?.map(driver => (
          <Card key={driver.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">{driver.fullName}</p>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {driver.email}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {driver.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(driver.id)} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

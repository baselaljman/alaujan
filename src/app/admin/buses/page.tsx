
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Plus, Trash2, Bus, Shield, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminBuses() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    licensePlate: "", 
    model: "", 
    capacity: 40,
    companyName: "العوجان للسفر"
  });

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses, isLoading } = useCollection(busesRef);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.licensePlate) return;

    addDocumentNonBlocking(busesRef, formData);
    toast({ title: "تمت الإضافة", description: "تمت إضافة الحافلة للأسطول" });
    setFormData({ licensePlate: "", model: "", capacity: 40, companyName: "العوجان للسفر" });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد؟")) {
      deleteDocumentNonBlocking(doc(firestore, "buses", id));
      toast({ title: "تم الحذف", description: "تمت إزالة الحافلة من النظام" });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة الأسطول</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة حافلة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم اللوحة</Label>
                  <Input 
                    placeholder="مثلاً: ب ط ر 123" 
                    value={formData.licensePlate}
                    onChange={e => setFormData({...formData, licensePlate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الموديل</Label>
                  <Input 
                    placeholder="مثلاً: Mercedes Travego" 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>السعة (مقاعد)</Label>
                <Input 
                  type="number"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl">حفظ الحافلة</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : buses?.map(bus => (
          <Card key={bus.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Bus className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">لوحة: {bus.licensePlate}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Shield className="h-3 w-3" /> {bus.model} | {bus.capacity} مقعد
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(bus.id)} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

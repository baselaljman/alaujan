
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Plus, Trash2, Bus, Shield, Loader2, User, Link as LinkIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminBuses() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    licensePlate: "", 
    model: "", 
    capacity: 40,
    companyName: "العوجان للسفر",
    driverId: ""
  });

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses, isLoading } = useCollection(busesRef);

  const driversRef = useMemoFirebase(() => collection(firestore, "drivers"), [firestore]);
  const { data: drivers } = useCollection(driversRef);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.licensePlate) return;

    const selectedDriver = drivers?.find(d => d.id === formData.driverId);

    addDocumentNonBlocking(busesRef, {
      ...formData,
      driverName: selectedDriver?.fullName || "غير محدد",
      driverEmail: selectedDriver?.email || ""
    });
    
    toast({ title: "تمت الإضافة", description: "تمت إضافة الحافلة للأسطول" });
    setFormData({ licensePlate: "", model: "", capacity: 40, companyName: "العوجان للسفر", driverId: "" });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد؟")) {
      deleteDocumentNonBlocking(doc(firestore, "buses", id));
      toast({ title: "تم الحذف", description: "تمت إزالة الحافلة من النظام" });
    }
  };

  const handleAssignDriver = (busId: string, driverId: string) => {
    const selectedDriver = drivers?.find(d => d.id === driverId);
    if (!selectedDriver) return;

    updateDocumentNonBlocking(doc(firestore, "buses", busId), {
      driverId: driverId,
      driverName: selectedDriver.fullName,
      driverEmail: selectedDriver.email
    });

    toast({ title: "تم الربط", description: "تم ربط السائق بالحافلة بنجاح" });
  };

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة الأسطول</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة حافلة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>السعة (مقاعد)</Label>
                  <Input 
                    type="number"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>السائق المسؤول</Label>
                  <Select onValueChange={(val) => setFormData({...formData, driverId: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="اختر سائقاً" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers?.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>{driver.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            <CardContent className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
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
              </div>
              
              <div className="pt-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground">السائق المرتبط:</p>
                    <p className="text-xs font-bold text-primary">{bus.driverName || "لم يتم التعيين"}</p>
                  </div>
                </div>
                
                <Select onValueChange={(val) => handleAssignDriver(bus.id, val)}>
                  <SelectTrigger className="w-[140px] h-8 text-[10px] rounded-lg">
                    <SelectValue placeholder="تغيير السائق" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers?.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>{driver.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

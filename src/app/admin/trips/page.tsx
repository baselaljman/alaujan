
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Plus, Trash2, Calendar, Clock, DollarSign, Bus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    busId: "",
    departureTime: "",
    arrivalTime: "",
    pricePerSeat: 350,
    availableSeats: 40,
    status: "Scheduled"
  });

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading } = useCollection(tripsRef);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.busId || !formData.departureTime) return;

    addDocumentNonBlocking(tripsRef, {
      ...formData,
      pricePerSeat: Number(formData.pricePerSeat),
      availableSeats: Number(formData.availableSeats),
      totalSeats: Number(formData.availableSeats),
      createdAt: new Date().toISOString()
    });

    toast({ title: "تمت الإضافة", description: "تمت إضافة الرحلة الجديدة بنجاح" });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الرحلة؟")) {
      deleteDocumentNonBlocking(doc(firestore, "busTrips", id));
      toast({ title: "تم الحذف", description: "تم حذف الرحلة من النظام" });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة الرحلات</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة رحلة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل الرحلة الجديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTrip} className="space-y-4 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الحافلة</Label>
                  <Input 
                    placeholder="مثلاً: AWJ-700" 
                    value={formData.busId}
                    onChange={e => setFormData({...formData, busId: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select onValueChange={v => setFormData({...formData, status: v})} defaultValue="Scheduled">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">مجدولة</SelectItem>
                      <SelectItem value="Departed">انطلقت</SelectItem>
                      <SelectItem value="Delayed">متأخرة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>وقت الانطلاق</Label>
                  <Input 
                    type="datetime-local" 
                    onChange={e => setFormData({...formData, departureTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>وقت الوصول المتوقع</Label>
                  <Input 
                    type="datetime-local" 
                    onChange={e => setFormData({...formData, arrivalTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>سعر المقعد</Label>
                  <Input 
                    type="number" 
                    value={formData.pricePerSeat}
                    onChange={e => setFormData({...formData, pricePerSeat: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>عدد المقاعد</Label>
                  <Input 
                    type="number" 
                    value={formData.availableSeats}
                    onChange={e => setFormData({...formData, availableSeats: Number(e.target.value)})}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl">حفظ الرحلة</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : trips?.map(trip => (
          <Card key={trip.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
                  <Bus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">حافلة: {trip.busId}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(trip.departureTime).toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="font-bold text-sm text-primary">${trip.pricePerSeat}</p>
                  <p className="text-[10px] text-muted-foreground">{trip.status}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(trip.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

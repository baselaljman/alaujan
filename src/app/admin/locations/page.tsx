
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Plus, Trash2, MapPin, Globe, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminLocations() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: "", country: "", description: "" });

  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations, isLoading } = useCollection(locationsRef);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    addDocumentNonBlocking(locationsRef, formData);
    toast({ title: "تمت الإضافة", description: "تمت إضافة المدينة/المحطة بنجاح" });
    setFormData({ name: "", country: "", description: "" });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من الحذف؟")) {
      deleteDocumentNonBlocking(doc(firestore, "locations", id));
      toast({ title: "تم الحذف", description: "تم حذف الموقع من النظام" });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة المدن</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة مدينة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم المدينة</Label>
                  <Input 
                    placeholder="مثلاً: الرياض" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الدولة</Label>
                  <Input 
                    placeholder="مثلاً: السعودية" 
                    value={formData.country}
                    onChange={e => setFormData({...formData, country: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف (اختياري)</Label>
                <Input 
                  placeholder="مثلاً: المحطة الرئيسية" 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl">حفظ المدينة</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : locations?.map(loc => (
          <Card key={loc.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{loc.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" /> {loc.country}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

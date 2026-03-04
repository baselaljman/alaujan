
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  UserCheck, 
  Mail, 
  Loader2, 
  Settings,
  Lock,
  Calendar,
  Bus,
  MapPin,
  Package,
  Users as UsersIcon,
  Edit2
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const PERMISSIONS = [
  { id: "canManageTrips", label: "إدارة الرحلات", icon: Calendar },
  { id: "canManageBuses", label: "إدارة الحافلات", icon: Bus },
  { id: "canManageDrivers", label: "إدارة السائقين", icon: UsersIcon },
  { id: "canManageLocations", label: "إدارة المدن", icon: MapPin },
  { id: "canManageParcels", label: "إدارة الطرود", icon: Package },
  { id: "canManageStaff", label: "إدارة الموظفين والصلاحيات", icon: ShieldAlert },
];

export default function AdminStaff() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    permissions: {
      canManageTrips: false,
      canManageBuses: false,
      canManageDrivers: false,
      canManageLocations: false,
      canManageParcels: false,
      canManageStaff: false,
    }
  });

  const staffRef = useMemoFirebase(() => collection(firestore, "staff_permissions"), [firestore]);
  const { data: staffList, isLoading } = useCollection(staffRef);

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.fullName) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إدخال الاسم والبريد الإلكتروني." });
      return;
    }

    if (editingId) {
      // تعديل موظف موجود
      const staffDocRef = doc(firestore, "staff_permissions", editingId);
      updateDocumentNonBlocking(staffDocRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      toast({ title: "تم التحديث", description: "تم تحديث صلاحيات الموظف بنجاح." });
    } else {
      // إضافة موظف جديد
      addDocumentNonBlocking(staffRef, {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "تمت الإضافة", description: "تم منح الصلاحيات للموظف الجديد بنجاح." });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      permissions: {
        canManageTrips: false,
        canManageBuses: false,
        canManageDrivers: false,
        canManageLocations: false,
        canManageParcels: false,
        canManageStaff: false,
      }
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (staff: any) => {
    setEditingId(staff.id);
    setFormData({
      fullName: staff.fullName,
      email: staff.email,
      permissions: {
        ...formData.permissions,
        ...(staff.permissions || {})
      }
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permId]: !prev.permissions[permId as keyof typeof prev.permissions]
      }
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من سحب كافة الصلاحيات عن هذا الموظف؟")) {
      deleteDocumentNonBlocking(doc(firestore, "staff_permissions", id));
      toast({ title: "تم السحب", description: "تمت إزالة الموظف من قائمة الصلاحيات." });
    }
  };

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-headline text-primary">إدارة الموظفين</h1>
            <p className="text-xs text-muted-foreground">منح صلاحيات التعديل والدخول للنظام</p>
          </div>
        </div>
        <Button 
          onClick={() => isAdding ? resetForm() : setIsAdding(true)} 
          className="rounded-xl gap-2 h-12 px-6 shadow-md"
        >
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة موظف</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-red-100 shadow-2xl animate-in slide-in-from-top-4 duration-500">
          <CardHeader className="bg-red-50/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              {editingId ? <Edit2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              {editingId ? "تعديل صلاحيات الموظف" : "منح صلاحيات جديدة"}
            </CardTitle>
            <CardDescription>
              {editingId ? `تعديل بيانات وصلاحيات ${formData.fullName}` : "أدخل بريد الموظف وحدد ما يمكنه التعديل عليه"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveStaff} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الموظف</Label>
                  <Input 
                    placeholder="الاسم الكامل" 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني (المسجل به في النظام)</Label>
                  <Input 
                    type="email"
                    placeholder="staff@alawajan.com" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-bold text-sm block mb-3">الصلاحيات الممنوحة:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {PERMISSIONS.map((perm) => (
                    <label 
                      key={perm.id} 
                      className={`flex items-center justify-between p-4 border rounded-2xl transition-all cursor-pointer hover:bg-red-50/30 ${formData.permissions[perm.id as keyof typeof formData.permissions] ? 'border-red-200 bg-red-50 ring-1 ring-red-100 shadow-sm' : 'bg-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <perm.icon className={`h-5 w-5 ${formData.permissions[perm.id as keyof typeof formData.permissions] ? 'text-red-600' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-bold">{perm.label}</span>
                      </div>
                      <Checkbox 
                        checked={formData.permissions[perm.id as keyof typeof formData.permissions]}
                        onCheckedChange={() => togglePermission(perm.id)}
                        className="rounded-full"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold bg-red-600 hover:bg-red-700 shadow-xl gap-2 mt-4">
                {editingId ? <RefreshCcw className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                {editingId ? "تحديث بيانات الموظف" : "حفظ الموظف ومنح الصلاحيات"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-primary px-1">قائمة الموظفين الحاليين</h3>
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary opacity-20" /></div>
        ) : staffList?.length === 0 ? (
          <div className="text-center p-16 bg-muted/10 rounded-3xl border-2 border-dashed">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground font-medium">لم يتم تعيين موظفين بصلاحيات خاصة بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {staffList?.map(staff => (
              <Card key={staff.id} className="border-none shadow-sm ring-1 ring-border hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                        <UserCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-bold text-base">{staff.fullName}</h4>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {staff.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(staff)} className="text-primary hover:bg-primary/5 rounded-xl">
                        <Edit2 className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(staff.id)} className="text-red-500 hover:bg-red-50 rounded-xl">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/30 px-5 py-3 border-t flex flex-wrap gap-2">
                    {PERMISSIONS.map(p => staff.permissions?.[p.id] && (
                      <Badge key={p.id} variant="secondary" className="bg-white border-primary/10 text-primary font-medium text-[10px] gap-1 py-1 px-3">
                        <p.icon className="h-3 w-3" /> {p.label}
                      </Badge>
                    ))}
                    {(!staff.permissions || Object.values(staff.permissions).every(v => !v)) && (
                      <span className="text-[10px] text-muted-foreground italic">لا توجد صلاحيات مفعلة</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-start gap-4">
        <Settings className="h-6 w-6 text-red-600 shrink-0 mt-1" />
        <div className="text-right">
          <h4 className="font-bold text-red-800 mb-1">تنبيه المدير العام</h4>
          <p className="text-xs text-red-700/80 leading-relaxed">
            الموظفون المضافون هنا سيتمكنون من الدخول للوحة الإدارة واستخدام الأقسام المحددة لهم فقط بمجرد تسجيل دخولهم ببريدهم الإلكتروني. تأكد من صحة البريد الإلكتروني لمطابقته مع حساب الموظف.
          </p>
        </div>
      </div>
    </div>
  );
}

// أيقونات إضافية لمحاكاة الناقص
function RefreshCcw({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" />
    </svg>
  );
}

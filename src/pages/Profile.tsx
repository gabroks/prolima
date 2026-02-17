import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockUser } from "@/data/mock";
import { Camera } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const [form, setForm] = useState({ ...mockUser });

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-bold">Editar Perfil</h2>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-20 w-20 bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {form.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div><Label>Nome Completo</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Usuário</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
          </div>

          <Button className="w-full" onClick={() => toast.success("Perfil salvo com sucesso!")}>Salvar Perfil</Button>
        </CardContent>
      </Card>
    </div>
  );
}

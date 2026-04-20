import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === "adm" && pass === "123") {
      sessionStorage.setItem("adm_auth", "1");
      navigate("/admin");
    } else {
      toast.error("Usuário ou senha inválidos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-6 border rounded-lg bg-card shadow">
        <div className="flex items-center gap-2 justify-center mb-4">
          <Lock className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Admin</h1>
        </div>
        <div className="space-y-2">
          <Label>Usuário</Label>
          <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Usuário" />
        </div>
        <div className="space-y-2">
          <Label>Senha</Label>
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Senha" />
        </div>
        <Button type="submit" className="w-full">Entrar</Button>
      </form>
    </div>
  );
};

export default AdminLogin;

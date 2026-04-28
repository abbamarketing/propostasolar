import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, SunMedium } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — ENERGIZA SOLAR" },
      { name: "description", content: "Acesse a área de propostas comerciais da Energiza Solar." },
      { property: "og:title", content: "Login — ENERGIZA SOLAR" },
      { property: "og:description", content: "Entrada para vendedores criarem propostas solares profissionais." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginForm) {
    try {
      await signIn(values.email, values.password);
      toast.success("Login realizado com sucesso.");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Não foi possível entrar.", {
        description: "Confira seu e-mail, senha e confirmação de cadastro.",
      });
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="sun-sweep solar-grid hidden min-h-screen flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <AppLogo />
        <div className="relative max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-sidebar-accent px-3 py-1 text-sm font-semibold text-sidebar-foreground">
            <SunMedium className="h-4 w-4 text-solar" />
            Propostas fotovoltaicas
          </div>
          <h1 className="font-display text-5xl font-black tracking-normal">
            Venda energia solar com propostas claras e profissionais.
          </h1>
          <p className="mt-5 text-lg text-sidebar-foreground/72">
            Fluxo guiado para vendedores da ENERGIZA SOLAR LTDA em Montes Claros/MG.
          </p>
        </div>
        <p className="relative text-sm text-sidebar-foreground/62">CNPJ 66.050.090/0001-33 • (38) 9895-9015</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md border-border/80 shadow-panel">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto lg:hidden">
              <AppLogo inverse={false} />
            </div>
            <CardTitle className="font-display text-3xl font-black">Entrar</CardTitle>
            <p className="text-sm text-muted-foreground">Acesse sua área comercial.</p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="vendedor@energizasollar.com" className="h-11 pl-10" {...form.register("email")} />
                </div>
                {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="h-11 pl-10" {...form.register("password")} />
                </div>
                {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
              </div>
              <div className="flex justify-end">
                <button type="button" className="text-sm font-semibold text-primary hover:underline">
                  Esqueci minha senha
                </button>
              </div>
              <Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  LogIn,
  Rocket,
  Settings,
  ShieldCheck,
  SunMedium,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/tutorial")({
  head: () => ({
    meta: [
      { title: "Tutorial — ENERGIZA SOLAR" },
      { name: "description", content: "Guia completo de uso do sistema de propostas Energiza Solar." },
    ],
  }),
  component: TutorialPage,
});

const steps = [
  {
    icon: LogIn,
    title: "1. Faça login",
    desc: "Use o e-mail e senha fornecidos pelo administrador. Caso esqueça a senha, clique em 'Esqueci minha senha' na tela de login.",
  },
  {
    icon: BarChart3,
    title: "2. Conheça o Dashboard",
    desc: "Veja indicadores do mês: propostas criadas, enviadas, aceitas, faturamento previsto e taxa de conversão.",
  },
  {
    icon: Users,
    title: "3. Cadastre o cliente",
    desc: "Vá em Clientes → Novo Cliente. Preencha CPF/CNPJ, contato, endereço e dados da conta de luz (consumo médio, concessionária, tipo de ligação).",
  },
  {
    icon: FileText,
    title: "4. Crie a proposta",
    desc: "Em Propostas → Nova Proposta, selecione o cliente, dimensione o sistema (kWp, módulos, inversor), defina custos e margens, e gere o PDF.",
  },
  {
    icon: Rocket,
    title: "5. Envie e acompanhe",
    desc: "Envie o PDF ao cliente e atualize o status da proposta (Enviada → Em negociação → Aceita/Recusada) à medida que avança.",
  },
];

function TutorialPage() {
  return (
    <AppLayout>
      <div className="min-h-screen">
        <div className="sun-sweep solar-grid border-b bg-surface px-4 py-14 md:px-8">
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <BookOpen className="h-4 w-4" />
              Central de ajuda
            </div>
            <h1 className="font-display text-3xl font-black tracking-normal text-foreground md:text-5xl">
              Tutorial completo do sistema
            </h1>
            <p className="mt-3 text-muted-foreground">
              Aprenda do zero como usar a plataforma Energiza Solar para cadastrar clientes, dimensionar sistemas
              fotovoltaicos, gerar propostas profissionais em PDF e acompanhar suas vendas.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-10 px-4 py-10 md:px-8">
          {/* Quick Start */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-black">Início rápido em 5 passos</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.title} className="border-border/80">
                    <CardHeader className="pb-2">
                      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{s.desc}</CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Detailed by area */}
          <section>
            <h2 className="mb-4 font-display text-2xl font-black">Guia detalhado por área</h2>
            <Tabs defaultValue="clientes" className="w-full">
              <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-muted/60">
                <TabsTrigger value="clientes">Clientes</TabsTrigger>
                <TabsTrigger value="propostas">Propostas</TabsTrigger>
                <TabsTrigger value="dimensionamento">Dimensionamento</TabsTrigger>
                <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
                <TabsTrigger value="config">Configurações</TabsTrigger>
              </TabsList>

              <TabsContent value="clientes" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Gestão de clientes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <p><strong className="text-foreground">Criar cliente:</strong> clique em <Badge variant="secondary">Novo Cliente</Badge>. O CPF/CNPJ é validado automaticamente. Campos opcionais podem ficar em branco.</p>
                    <p><strong className="text-foreground">Conta de luz:</strong> faça upload do PDF/imagem da fatura e informe o consumo médio em kWh — esse valor alimenta o dimensionamento.</p>
                    <p><strong className="text-foreground">Endereço:</strong> ao digitar o CEP, os dados de logradouro, bairro, cidade e UF são preenchidos automaticamente.</p>
                    <p><strong className="text-foreground">Editar/Excluir:</strong> abra o cliente na lista e use o menu de ações. Exclusões são lógicas (soft delete).</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="propostas" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Criando uma proposta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <p><strong className="text-foreground">Wizard guiado:</strong> a criação ocorre em etapas — Cliente → Local/Consumo → Sistema → Custos → Comercial → Revisão.</p>
                    <p><strong className="text-foreground">Status:</strong> rascunho, enviada, negociação, aceita, recusada, expirada. A expiração é automática após o prazo definido (padrão 15 dias).</p>
                    <p><strong className="text-foreground">PDF:</strong> ao final, gere o PDF que será armazenado e poderá ser baixado/reenviado a qualquer momento.</p>
                    <p><strong className="text-foreground">Edição:</strong> propostas em rascunho podem ser editadas livremente. Após enviadas, alterações geram nova versão.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dimensionamento" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><SunMedium className="h-5 w-5 text-solar" /> Dimensionamento solar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <p><strong className="text-foreground">HSP:</strong> o sistema usa a tabela de irradiação por cidade (Horas de Sol Pleno) para calcular a geração esperada.</p>
                    <p><strong className="text-foreground">Performance Ratio:</strong> padrão 0,80 — pode ser ajustado por proposta conforme as condições do telhado.</p>
                    <p><strong className="text-foreground">Cálculo:</strong> kWp necessário = (consumo a compensar / 30) / (HSP × PR). O sistema sugere quantidade de módulos e inversores compatíveis.</p>
                    <p><strong className="text-foreground">Custo de estrutura:</strong> calculado por faixa de quantidade de placas, conforme cadastro em Estrutura.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cadastros" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Catálogos técnicos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <p><strong className="text-foreground">Módulos:</strong> marca, modelo, potência (W), eficiência, garantias e preço de venda.</p>
                    <p><strong className="text-foreground">Inversores:</strong> marca, modelo, potência (kW), tipo (string/microinversor), MPPTs e fases.</p>
                    <p><strong className="text-foreground">Cidades & Tarifas:</strong> base usada para HSP e cálculo financeiro. Mantenha atualizado conforme reajustes da concessionária.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="config" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Configurações da empresa</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                    <p><strong className="text-foreground">Marca:</strong> logo, cores e dados da empresa aparecem no PDF da proposta.</p>
                    <p><strong className="text-foreground">Responsável técnico:</strong> nome, CREA e e-mail são exibidos nas propostas conforme exigência da ART.</p>
                    <p><strong className="text-foreground">Permissões:</strong> Admins gerenciam usuários e catálogos; Vendedores criam propostas e clientes.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-black">
              <HelpCircle className="h-6 w-6 text-primary" /> Perguntas frequentes
            </h2>
            <Accordion type="single" collapsible className="rounded-xl border bg-card">
              <AccordionItem value="q1" className="px-4">
                <AccordionTrigger>Como recupero minha senha?</AccordionTrigger>
                <AccordionContent>
                  Na tela de login, clique em "Esqueci minha senha". Você receberá um e-mail com link para redefinir. Verifique também a caixa de spam.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="px-4">
                <AccordionTrigger>O cliente não recebeu a proposta. O que fazer?</AccordionTrigger>
                <AccordionContent>
                  Reabra a proposta, baixe o PDF e envie manualmente via WhatsApp/e-mail. Confirme se o e-mail do cliente está correto no cadastro.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3" className="px-4">
                <AccordionTrigger>Posso editar uma proposta já enviada?</AccordionTrigger>
                <AccordionContent>
                  Sim. Toda alteração gera uma nova versão e o PDF é regenerado. O histórico de status fica registrado para auditoria.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4" className="px-4">
                <AccordionTrigger>Como o sistema calcula o payback?</AccordionTrigger>
                <AccordionContent>
                  Payback simples = Investimento total / Economia anual estimada. O payback descontado considera reajustes de tarifa e degradação dos módulos.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5" className="px-4">
                <AccordionTrigger>Quem pode cadastrar produtos no catálogo?</AccordionTrigger>
                <AccordionContent>
                  Apenas usuários com perfil <Badge variant="secondary">Admin</Badge> ou <Badge variant="secondary">Gestor</Badge>. Vendedores apenas consultam.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6" className="px-4">
                <AccordionTrigger>Como adiciono opções de financiamento à proposta?</AccordionTrigger>
                <AccordionContent>
                  Na etapa Comercial do wizard, marque "Incluir financiamento" e informe banco, prazo, taxa e entrada. As parcelas aparecerão no PDF.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q7" className="px-4">
                <AccordionTrigger>O que significa "Custo de disponibilidade"?</AccordionTrigger>
                <AccordionContent>
                  É o consumo mínimo cobrado pela concessionária mesmo gerando energia: 30 kWh (monofásico), 50 kWh (bifásico) ou 100 kWh (trifásico). O sistema usa esse valor para descontar da compensação.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q8" className="px-4">
                <AccordionTrigger>Posso usar o sistema no celular?</AccordionTrigger>
                <AccordionContent>
                  Sim, a interface é totalmente responsiva. Recomendamos navegador atualizado (Chrome, Safari ou Edge).
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Best practices */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-2xl font-black">
              <ShieldCheck className="h-6 w-6 text-primary" /> Boas práticas comerciais
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Sempre valide o consumo médio com 12 meses de fatura para evitar subdimensionamento.",
                "Confirme o tipo de telhado antes do envio — impacta o custo da estrutura.",
                "Anexe fotos do local na proposta para passar mais segurança ao cliente.",
                "Defina validade compatível com a volatilidade dos preços (sugerido 7-15 dias).",
                "Atualize o status da proposta logo após cada contato com o cliente.",
                "Personalize as observações comerciais para destacar diferenciais (garantia estendida, manutenção etc.).",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Support */}
          <section>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Precisa de mais ajuda?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Entre em contato com o suporte da Energiza Solar:</p>
                <p>📞 <strong className="text-foreground">(38) 9895-9015</strong> (WhatsApp)</p>
                <p>✉️ <strong className="text-foreground">contato@energizasolar.com</strong></p>
                <p className="pt-2">
                  <Link to="/dashboard" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                    <Zap className="h-4 w-4" /> Voltar ao Dashboard
                  </Link>
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

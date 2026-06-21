from django.core.management.base import BaseCommand, CommandError

PLANO_CONTAS = [
    # Receitas
    {"codigo": "4", "nome": "RECEITAS", "tipo": "receita", "is_synthetic": True, "parent": None},
    {"codigo": "4.1", "nome": "Honorários Advocatícios", "tipo": "receita", "is_synthetic": True, "parent": "4"},
    {"codigo": "4.1.01", "nome": "Honorários Contratuais", "tipo": "receita", "is_synthetic": False, "parent": "4.1"},
    {"codigo": "4.1.02", "nome": "Honorários de Êxito", "tipo": "receita", "is_synthetic": False, "parent": "4.1"},
    {"codigo": "4.1.03", "nome": "Honorários Sucumbenciais", "tipo": "receita", "is_synthetic": False, "parent": "4.1"},
    {"codigo": "4.1.04", "nome": "Honorários de Consultoria", "tipo": "receita", "is_synthetic": False, "parent": "4.1"},
    {"codigo": "4.2", "nome": "Outras Receitas", "tipo": "receita", "is_synthetic": True, "parent": "4"},
    {"codigo": "4.2.01", "nome": "Reembolso de Despesas", "tipo": "receita", "is_synthetic": False, "parent": "4.2"},
    {"codigo": "4.2.02", "nome": "Receitas Financeiras", "tipo": "receita", "is_synthetic": False, "parent": "4.2"},
    {"codigo": "4.2.03", "nome": "Outras Receitas Operacionais", "tipo": "receita", "is_synthetic": False, "parent": "4.2"},

    # Despesas
    {"codigo": "5", "nome": "DESPESAS", "tipo": "despesa", "is_synthetic": True, "parent": None},
    {"codigo": "5.1", "nome": "Custas e Despesas Processuais", "tipo": "despesa", "is_synthetic": True, "parent": "5"},
    {"codigo": "5.1.01", "nome": "Custas Judiciais", "tipo": "despesa", "is_synthetic": False, "parent": "5.1"},
    {"codigo": "5.1.02", "nome": "Preparo Recursal", "tipo": "despesa", "is_synthetic": False, "parent": "5.1"},
    {"codigo": "5.1.03", "nome": "Diligências e Oficiais de Justiça", "tipo": "despesa", "is_synthetic": False, "parent": "5.1"},
    {"codigo": "5.1.04", "nome": "Peritos e Assistentes Técnicos", "tipo": "despesa", "is_synthetic": False, "parent": "5.1"},
    {"codigo": "5.1.05", "nome": "Correios e Notificações", "tipo": "despesa", "is_synthetic": False, "parent": "5.1"},
    {"codigo": "5.2", "nome": "Despesas com Pessoal", "tipo": "despesa", "is_synthetic": True, "parent": "5"},
    {"codigo": "5.2.01", "nome": "Salários e Ordenados", "tipo": "despesa", "is_synthetic": False, "parent": "5.2"},
    {"codigo": "5.2.02", "nome": "Encargos Sociais (INSS, FGTS)", "tipo": "despesa", "is_synthetic": False, "parent": "5.2"},
    {"codigo": "5.2.03", "nome": "Pró-Labore", "tipo": "despesa", "is_synthetic": False, "parent": "5.2"},
    {"codigo": "5.2.04", "nome": "Férias e 13º Salário", "tipo": "despesa", "is_synthetic": False, "parent": "5.2"},
    {"codigo": "5.3", "nome": "Despesas Administrativas", "tipo": "despesa", "is_synthetic": True, "parent": "5"},
    {"codigo": "5.3.01", "nome": "Aluguel de Imóvel", "tipo": "despesa", "is_synthetic": False, "parent": "5.3"},
    {"codigo": "5.3.02", "nome": "Energia Elétrica e Água", "tipo": "despesa", "is_synthetic": False, "parent": "5.3"},
    {"codigo": "5.3.03", "nome": "Telefone e Internet", "tipo": "despesa", "is_synthetic": False, "parent": "5.3"},
    {"codigo": "5.3.04", "nome": "Material de Escritório", "tipo": "despesa", "is_synthetic": False, "parent": "5.3"},
    {"codigo": "5.3.05", "nome": "Serviços de Limpeza e Manutenção", "tipo": "despesa", "is_synthetic": False, "parent": "5.3"},
    {"codigo": "5.3.06", "nome": "Software e Assinaturas", "tipo": "despesa", "is_synthetic": False, "parent": "5.3"},
    {"codigo": "5.3.07", "nome": "Marketing e Publicidade", "tipo": "despesa", "is_synthetic": False, "parent": "5.3"},
    {"codigo": "5.4", "nome": "Despesas Tributárias", "tipo": "despesa", "is_synthetic": True, "parent": "5"},
    {"codigo": "5.4.01", "nome": "ISS — Imposto Sobre Serviços", "tipo": "despesa", "is_synthetic": False, "parent": "5.4"},
    {"codigo": "5.4.02", "nome": "PIS / COFINS", "tipo": "despesa", "is_synthetic": False, "parent": "5.4"},
    {"codigo": "5.4.03", "nome": "IRPJ / CSLL", "tipo": "despesa", "is_synthetic": False, "parent": "5.4"},
    {"codigo": "5.4.04", "nome": "Simples Nacional", "tipo": "despesa", "is_synthetic": False, "parent": "5.4"},
    {"codigo": "5.5", "nome": "Despesas Financeiras", "tipo": "despesa", "is_synthetic": True, "parent": "5"},
    {"codigo": "5.5.01", "nome": "Juros e Encargos Bancários", "tipo": "despesa", "is_synthetic": False, "parent": "5.5"},
    {"codigo": "5.5.02", "nome": "Tarifas Bancárias", "tipo": "despesa", "is_synthetic": False, "parent": "5.5"},

    # Ativo
    {"codigo": "1", "nome": "ATIVO", "tipo": "ativo", "is_synthetic": True, "parent": None},
    {"codigo": "1.1", "nome": "Ativo Circulante", "tipo": "ativo", "is_synthetic": True, "parent": "1"},
    {"codigo": "1.1.01", "nome": "Caixa", "tipo": "ativo", "is_synthetic": False, "parent": "1.1"},
    {"codigo": "1.1.02", "nome": "Banco Conta Corrente", "tipo": "ativo", "is_synthetic": False, "parent": "1.1"},
    {"codigo": "1.1.03", "nome": "Contas a Receber — Clientes", "tipo": "ativo", "is_synthetic": False, "parent": "1.1"},
    {"codigo": "1.1.04", "nome": "Adiantamentos a Funcionários", "tipo": "ativo", "is_synthetic": False, "parent": "1.1"},
    {"codigo": "1.2", "nome": "Ativo Não Circulante", "tipo": "ativo", "is_synthetic": True, "parent": "1"},
    {"codigo": "1.2.01", "nome": "Mobiliário e Equipamentos", "tipo": "ativo", "is_synthetic": False, "parent": "1.2"},
    {"codigo": "1.2.02", "nome": "Computadores e Periféricos", "tipo": "ativo", "is_synthetic": False, "parent": "1.2"},
    {"codigo": "1.2.03", "nome": "Depreciação Acumulada", "tipo": "ativo", "is_synthetic": False, "parent": "1.2"},

    # Passivo
    {"codigo": "2", "nome": "PASSIVO", "tipo": "passivo", "is_synthetic": True, "parent": None},
    {"codigo": "2.1", "nome": "Passivo Circulante", "tipo": "passivo", "is_synthetic": True, "parent": "2"},
    {"codigo": "2.1.01", "nome": "Fornecedores a Pagar", "tipo": "passivo", "is_synthetic": False, "parent": "2.1"},
    {"codigo": "2.1.02", "nome": "Obrigações Trabalhistas", "tipo": "passivo", "is_synthetic": False, "parent": "2.1"},
    {"codigo": "2.1.03", "nome": "Impostos a Recolher", "tipo": "passivo", "is_synthetic": False, "parent": "2.1"},
    {"codigo": "2.1.04", "nome": "Adiantamentos de Clientes", "tipo": "passivo", "is_synthetic": False, "parent": "2.1"},

    # Patrimônio Líquido
    {"codigo": "3", "nome": "PATRIMÔNIO LÍQUIDO", "tipo": "patrimonio", "is_synthetic": True, "parent": None},
    {"codigo": "3.1", "nome": "Capital Social", "tipo": "patrimonio", "is_synthetic": False, "parent": "3"},
    {"codigo": "3.2", "nome": "Reservas de Lucros", "tipo": "patrimonio", "is_synthetic": False, "parent": "3"},
    {"codigo": "3.3", "nome": "Prejuízos Acumulados", "tipo": "patrimonio", "is_synthetic": False, "parent": "3"},
]


class Command(BaseCommand):
    help = "Seed default OAB/advocacia chart of accounts (plano de contas) for a tenant."

    def add_arguments(self, parser):
        parser.add_argument("tenant_id", type=str, help="UUID of the tenant to seed.")
        parser.add_argument(
            "--overwrite",
            action="store_true",
            default=False,
            help="Overwrite existing accounts if they conflict.",
        )

    def handle(self, *args, **options):
        from apps.core.models import Tenant
        from apps.finance.models import PlanoContas

        tenant_id = options["tenant_id"]
        overwrite = options["overwrite"]

        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            raise CommandError(f"Tenant {tenant_id!r} not found.")

        index: dict[str, PlanoContas] = {}
        created = 0
        skipped = 0

        for entry in PLANO_CONTAS:
            parent_codigo = entry["parent"]
            parent_obj = index.get(parent_codigo) if parent_codigo else None

            existing = PlanoContas.objects.filter(tenant=tenant, codigo=entry["codigo"]).first()
            if existing:
                if overwrite:
                    existing.nome = entry["nome"]
                    existing.tipo = entry["tipo"]
                    existing.is_synthetic = entry["is_synthetic"]
                    existing.parent = parent_obj
                    existing.save()
                    index[entry["codigo"]] = existing
                else:
                    index[entry["codigo"]] = existing
                    skipped += 1
                continue

            obj = PlanoContas.objects.create(
                tenant=tenant,
                codigo=entry["codigo"],
                nome=entry["nome"],
                tipo=entry["tipo"],
                is_synthetic=entry["is_synthetic"],
                parent=parent_obj,
            )
            index[entry["codigo"]] = obj
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created}, Skipped (already exist): {skipped}. "
                f"Use --overwrite to update existing ones."
            )
        )

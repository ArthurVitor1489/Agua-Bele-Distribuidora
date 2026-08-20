import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mesParam = searchParams.get('mes'); // Formato YYYY-MM
    const exportCsv = searchParams.get('csv') === 'true';

    let inicio: Date;
    let fim: Date;

    if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      const [ano, mes] = mesParam.split('-').map(Number);
      inicio = new Date(ano, mes - 1, 1);
      fim = new Date(ano, mes, 0, 23, 59, 59, 999);
    } else {
      const agora = new Date();
      inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const notas = await prisma.notaFiscal.findMany({
      where: {
        dataEmissao: {
          gte: inicio,
          lte: fim,
        },
      },
      orderBy: { dataEmissao: 'asc' },
    });

    const totalNotas = notas.length;
    const valorTotal = notas.reduce((acc, n) => acc + (n.valorTotal || 0), 0);
    const totalIcms = notas.reduce((acc, n) => acc + (n.valorIcms || 0), 0);
    const totalPis = notas.reduce((acc, n) => acc + (n.valorPis || 0), 0);
    const totalCofins = notas.reduce((acc, n) => acc + (n.valorCofins || 0), 0);
    const totalTributos = totalIcms + totalPis + totalCofins;

    const configuracao = await prisma.configuracao.findFirst();

    if (exportCsv) {
      // Gerar CSV contábil compatível com Excel e Softwares de Contabilidade
      let csvContent = '\uFEFF'; // BOM para UTF-8 no Excel
      csvContent += 'Numero;Chave de Acesso;Data Emissao;CNPJ Emissor;Razao Social Emissor;Valor Total;ICMS;PIS;COFINS;Total Tributos\n';

      notas.forEach((n) => {
        const dt = new Date(n.dataEmissao).toLocaleDateString('pt-BR');
        const num = n.numero || '';
        const chave = n.chaveAcesso || '';
        const cnpj = n.emissorCnpj || '';
        const raz = (n.emissorNome || '').replace(/;/g, ' ');
        const vTotal = (n.valorTotal || 0).toFixed(2).replace('.', ',');
        const vIcms = (n.valorIcms || 0).toFixed(2).replace('.', ',');
        const vPis = (n.valorPis || 0).toFixed(2).replace('.', ',');
        const vCofins = (n.valorCofins || 0).toFixed(2).replace('.', ',');
        const vTrib = ((n.valorIcms || 0) + (n.valorPis || 0) + (n.valorCofins || 0)).toFixed(2).replace('.', ',');

        csvContent += `${num};${chave};${dt};${cnpj};${raz};${vTotal};${vIcms};${vPis};${vCofins};${vTrib}\n`;
      });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="fechamento_fiscal_${mesParam || 'mes_atual'}.csv"`,
        },
      });
    }

    return NextResponse.json({
      empresa: configuracao?.nomeEmpresa || 'Água Belle — Distribuidora de Água',
      cnpjEmpresa: configuracao?.cnpj || '',
      periodo: {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        mesExtenso: inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      },
      resumo: {
        totalNotas,
        valorTotal,
        totalIcms,
        totalPis,
        totalCofins,
        totalTributos,
      },
      notas: notas.map((n) => ({
        id: n.id,
        numero: n.numero,
        chaveAcesso: n.chaveAcesso,
        dataEmissao: n.dataEmissao,
        emitenteNome: n.emissorNome,
        emitenteCnpj: n.emissorCnpj,
        valorTotal: n.valorTotal,
        icms: n.valorIcms,
        pis: n.valorPis,
        cofins: n.valorCofins,
        arquivoUrl: n.arquivoUrl,
      })),
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório do contador:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar relatório' }, { status: 500 });
  }
}

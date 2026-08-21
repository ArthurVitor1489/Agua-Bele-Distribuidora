import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.configuracao.findFirst({
      where: { id: 'default' },
    });

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json({ error: error.message || 'Erro ao carregar configurações' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const config = await prisma.configuracao.upsert({
      where: { id: 'default' },
      update: {
        nomeEmpresa: body.nomeEmpresa,
        cnpj: body.cnpj,
        inscricaoEstadual: body.inscricaoEstadual,
        telefone: body.telefone,
        endereco: body.endereco,
        cidade: body.cidade,
        estado: body.estado,
        chavePix: body.chavePix,
      },
      create: {
        id: 'default',
        nomeEmpresa: body.nomeEmpresa || '',
        cnpj: body.cnpj || '',
        inscricaoEstadual: body.inscricaoEstadual || '',
        telefone: body.telefone || '',
        endereco: body.endereco || '',
        cidade: body.cidade || '',
        estado: body.estado || '',
        chavePix: body.chavePix || '',
      },
    });

    return NextResponse.json(config);
  } catch (error: any) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json({ error: error.message || 'Erro ao salvar configurações' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, novaSenha } = body;

    if (!novaSenha || novaSenha.length < 4) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 4 caracteres.' }, { status: 400 });
    }

    const emailNormalizado = (email || 'admin@aguabelle.com.br').trim().toLowerCase();
    const senhaHash = await hashPassword(novaSenha);

    const user = await prisma.user.upsert({
      where: { email: emailNormalizado },
      update: { senha: senhaHash },
      create: {
        nome: 'Administrador',
        email: emailNormalizado,
        senha: senhaHash,
      },
    });

    return NextResponse.json({ sucesso: true, mensagem: 'Senha alterada com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ error: error.message || 'Erro ao alterar senha' }, { status: 500 });
  }
}

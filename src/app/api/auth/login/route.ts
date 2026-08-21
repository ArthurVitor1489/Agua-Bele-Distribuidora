import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const senha = body.senha;

    if (!email || !senha) {
      return NextResponse.json({ error: 'Informe o e-mail e a senha de acesso.' }, { status: 400 });
    }

    // Auto-seed admin se nenhum usuário existir no banco
    const totalUsers = await prisma.user.count();
    if (totalUsers === 0) {
      const senhaHash = await hashPassword('123456');
      await prisma.user.create({
        data: {
          nome: 'Administrador',
          email: 'admin@aguabelle.com.br',
          senha: senhaHash,
        },
      });
    }

    // Buscar usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    const senhaValida = await comparePassword(senha, user.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    // Criar token JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      nome: user.nome,
    });

    const response = NextResponse.json({
      sucesso: true,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
    });

    // Definir cookie HttpOnly seguro
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Erro ao realizar login:', error);
    return NextResponse.json({ error: error.message || 'Erro ao realizar login' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ sucesso: true, mensagem: 'Sessão encerrada com sucesso.' });
  
  response.cookies.set({
    name: 'auth_token',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}

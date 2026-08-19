import { NextResponse } from 'next/server';
import { restaurarBackup, BackupPayload } from '@/lib/backup';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo de backup enviado.' }, { status: 400 });
    }

    const text = await file.text();
    let backupData: BackupPayload;

    try {
      backupData = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Arquivo inválido. Deve ser um JSON válido de backup do Água Belle.' }, { status: 400 });
    }

    const resultado = await restaurarBackup(backupData);

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro ao restaurar backup:', error);
    return NextResponse.json({ error: error.message || 'Erro ao restaurar backup' }, { status: 500 });
  }
}

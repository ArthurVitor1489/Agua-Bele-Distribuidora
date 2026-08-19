import { NextResponse } from 'next/server';
import { gerarBackupCompleto } from '@/lib/backup';

export async function GET() {
  try {
    const backup = await gerarBackupCompleto();
    const jsonString = JSON.stringify(backup, null, 2);

    const filename = `Backup_AguaBelle_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar backup:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar backup' }, { status: 500 });
  }
}

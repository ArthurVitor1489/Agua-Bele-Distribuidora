import { NextResponse } from 'next/server';
import { extrairDadosTextoNfe } from '@/lib/pdf-parser';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Salvar arquivo original no storage
    const storageDir = path.join(process.cwd(), 'storage', 'nfe');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(storageDir, safeName);
    fs.writeFileSync(filePath, buffer);

    // Extrair texto do PDF
    let textoExtraido = '';
    try {
      // Dynamic import of pdf-parse
      const pdfParse = (await import('pdf-parse')).default;
      const pdfData = await pdfParse(buffer);
      textoExtraido = pdfData.text || '';
    } catch (e: any) {
      console.warn('Fallback para parser textual:', e.message);
      textoExtraido = buffer.toString('utf-8');
    }

    // Extrai os dados estruturados usando o parser inteligente
    const dadosExtraidos = extrairDadosTextoNfe(textoExtraido);

    return NextResponse.json({
      sucesso: true,
      arquivoUrl: `/api/notas-fiscais/arquivo/${safeName}`,
      arquivoNome: file.name,
      dados: dadosExtraidos,
    });
  } catch (error: any) {
    console.error('Erro no upload/leitura de PDF de nota fiscal:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar PDF da nota fiscal' },
      { status: 500 }
    );
  }
}

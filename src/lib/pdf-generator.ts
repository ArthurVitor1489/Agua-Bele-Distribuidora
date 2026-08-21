import { PedidoDTO } from '@/types';

async function fetchEmpresaConfig() {
  try {
    const res = await fetch('/api/configuracoes');
    if (res.ok) {
      const data = await res.json();
      if (data && data.nomeEmpresa) {
        const enderecoCompleto = [
          data.endereco,
          data.cidade,
          data.estado,
        ].filter(Boolean).join(', ');

        return {
          nome: data.nomeEmpresa || 'Aguabelle - Fabricação e Comércio de Águas Ltda',
          cnpj: data.cnpj || '34.194.297/0001-95',
          telefone: data.telefone || '+55 83 9177-5672',
          endereco: enderecoCompleto || 'Rua José Firmino da Silva 1415, Jardim Paulistano - CEP: 58415-245',
          chavePix: data.chavePix || data.cnpj || '34.194.297/0001-95',
        };
      }
    }
  } catch (e) {
    console.error('Erro ao carregar configuracoes da empresa para PDF:', e);
  }

  return {
    nome: 'Aguabelle - Fabricação e Comércio de Águas Ltda',
    cnpj: '34.194.297/0001-95',
    telefone: '+55 83 9177-5672',
    endereco: 'Rua José Firmino da Silva 1415, Jardim Paulistano - CEP: 58415-245',
    chavePix: '34.194.297/0001-95',
  };
}

export async function gerarPdfPedido(pedido: PedidoDTO, empresaCustom?: any) {
  const empresa = empresaCustom || await fetchEmpresaConfig();
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Colors
  const brandPrimary = [2, 132, 199]; // #0284c7 Sky/Navy
  const textDark = [15, 23, 42]; // Slate 900
  const textMuted = [100, 116, 139]; // Slate 500
  const bgLight = [241, 245, 249]; // Slate 100

  // Header Banner
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(empresa.nome || 'Aguabelle - Fabricação e Comércio de Águas Ltda', 14, 11);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`CNPJ: ${empresa.cnpj || '34.194.297/0001-95'} | Fone/WhatsApp: ${empresa.telefone || '+55 83 9177-5672'}`, 14, 18);
  doc.text(`Endereço: ${empresa.endereco || 'Rua José Firmino da Silva 1415, Jardim Paulistano - CEP: 58415-245'}`, 14, 24);

  // Pedido Info Box Right Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`PEDIDO Nº #${pedido.numero}`, 196, 11, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const dataFormatada = new Date(pedido.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Emissão: ${dataFormatada}`, 196, 18, { align: 'right' });
  doc.text(`Status: ${pedido.status}`, 196, 24, { align: 'right' });

  // Section 1: Dados do Cliente
  let currentY = 38;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(14, currentY, 182, 34, 2, 2, 'F');

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DADOS DO CLIENTE & ENTREGA', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Cliente: ${pedido.cliente?.nome || 'Cliente Balcão'}`, 18, currentY + 14);
  doc.text(`CPF/CNPJ: ${pedido.cliente?.cpfCnpj || 'Não informado'}`, 18, currentY + 20);
  doc.text(`Telefone/WhatsApp: ${pedido.cliente?.telefone || pedido.cliente?.whatsapp || 'Não informado'}`, 18, currentY + 26);

  const enderecoCompleto = [
    pedido.cliente?.logradouro ? `${pedido.cliente.logradouro}, ${pedido.cliente.numero || 'S/N'}` : '',
    pedido.cliente?.complemento,
    pedido.cliente?.bairro,
    pedido.cliente?.cidade ? `${pedido.cliente.cidade} - ${pedido.cliente.estado || 'PB'}` : '',
  ].filter(Boolean).join(' - ');

  doc.text(`Endereço: ${enderecoCompleto || 'Retirada no depósito'}`, 18, currentY + 31);

  // Section 2: Itens do Pedido (Table)
  currentY = 78;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ITENS DO PEDIDO', 14, currentY);

  currentY += 4;
  // Table Header
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(14, currentY, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUTO / DESCRIÇÃO', 18, currentY + 5);
  doc.text('QTD', 115, currentY + 5, { align: 'center' });
  doc.text('VALOR UNIT.', 145, currentY + 5, { align: 'right' });
  doc.text('SUBTOTAL', 190, currentY + 5, { align: 'right' });

  currentY += 7;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  pedido.itens.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 7, 'F');
    }
    const nomeProduto = item.produto?.nome || item.produtoNome || 'Água Mineral Galão 20L';
    doc.text(nomeProduto, 18, currentY + 5);
    doc.text(String(item.quantidade), 115, currentY + 5, { align: 'center' });
    doc.text(`R$ ${Number(item.valorUnitario).toFixed(2)}`, 145, currentY + 5, { align: 'right' });
    doc.text(`R$ ${Number(item.total).toFixed(2)}`, 190, currentY + 5, { align: 'right' });
    currentY += 7;
  });

  // Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY, 196, currentY);
  currentY += 6;

  // Totals Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(120, currentY, 76, 30, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 125, currentY + 7);
  doc.text(`R$ ${Number(pedido.subtotal).toFixed(2)}`, 190, currentY + 7, { align: 'right' });

  if (pedido.desconto > 0) {
    doc.text('Desconto:', 125, currentY + 13);
    doc.text(`- R$ ${Number(pedido.desconto).toFixed(2)}`, 190, currentY + 13, { align: 'right' });
  }

  if (pedido.acrescimo > 0) {
    doc.text('Acréscimo:', 125, currentY + 19);
    doc.text(`+ R$ ${Number(pedido.acrescimo).toFixed(2)}`, 190, currentY + 19, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('TOTAL:', 125, currentY + 26);
  doc.text(`R$ ${Number(pedido.total).toFixed(2)}`, 190, currentY + 26, { align: 'right' });

  // Payment info box left
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('FORMA DE PAGAMENTO', 14, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Forma: ${pedido.formaPagamento || 'A definir / Pendente'}`, 14, currentY + 12);

  if (pedido.formaPagamento === 'BOLETO' && pedido.boletoReceber) {
    doc.text(`Boleto nº: ${pedido.boletoReceber.numero}`, 14, currentY + 18);
    doc.text(`Parcelas: ${pedido.boletoReceber.quantidadeParcelas}x de R$ ${(pedido.total / pedido.boletoReceber.quantidadeParcelas).toFixed(2)}`, 14, currentY + 24);
  } else if (pedido.formaPagamento === 'PIX') {
    doc.text(`Chave PIX: ${empresa.chavePix}`, 14, currentY + 18);
  } else if (pedido.formaPagamento === 'FIADO') {
    doc.text('Condição: Faturamento fiado em aberto para quitação posterior.', 14, currentY + 18);
  }

  currentY += 38;

  // Observations
  if (pedido.observacoes) {
    doc.setFillColor(254, 249, 195); // light yellow
    doc.roundedRect(14, currentY, 182, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(133, 77, 14);
    doc.text('OBSERVAÇÕES:', 18, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(pedido.observacoes, 18, currentY + 11);
    currentY += 22;
  } else {
    currentY += 8;
  }

  // Signature Block
  currentY = Math.max(currentY, 230);
  doc.setDrawColor(148, 163, 184);
  doc.line(20, currentY + 15, 95, currentY + 15);
  doc.line(115, currentY + 15, 190, currentY + 15);

  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(empresa.nome ? empresa.nome.substring(0, 35).toUpperCase() : 'AGUABELLE DISTRIBUIDORA', 57, currentY + 20, { align: 'center' });
  doc.text('ASSINATURA DO CLIENTE / RECEBEDOR', 152, currentY + 20, { align: 'center' });

  // Footer
  doc.setFontSize(7);
  doc.text(`${empresa.nome || 'Aguabelle'} — Documento gerado eletronicamente para fins comerciais e de entrega.`, 105, 287, { align: 'center' });

  return doc;
}

export async function baixarPdfPedido(pedido: PedidoDTO) {
  const doc = await gerarPdfPedido(pedido);
  doc.save(`Pedido_${pedido.numero}_Aguabelle.pdf`);
}

export async function imprimirPdfPedido(pedido: PedidoDTO) {
  const doc = await gerarPdfPedido(pedido);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

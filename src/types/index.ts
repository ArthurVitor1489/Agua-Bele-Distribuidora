export type StatusPedido = 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'CANCELADO';

export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO' | 'FIADO' | 'BOLETO';

export type StatusBoleto = 'PENDENTE' | 'VENCIDA' | 'PAGA' | 'CANCELADA';

export type StatusGarrafao = 'CHEIO' | 'VAZIO' | 'DANIFICADO' | 'VENCIDO' | 'DESCARTADO';

export type TipoMovimentacaoEstoque = 
  | 'ENTRADA' 
  | 'SAIDA' 
  | 'AJUSTE' 
  | 'DEVOLUCAO' 
  | 'PERDA' 
  | 'DANIFICADO' 
  | 'DESCARTE';

export type CategoriaProduto = 'AGUA_25L' | 'GARRAFAO_NOVO' | 'SUPORTE' | 'BOMBA' | 'ACESSORIO' | 'OUTRO';

export type CategoriaDespesa = 
  | 'COMBUSTIVEL' 
  | 'MANUTENCAO' 
  | 'FORNECEDOR' 
  | 'PESSOAL' 
  | 'CONTAS_FIXAS' 
  | 'IMPOSTOS' 
  | 'OUTROS';

export interface ClienteDTO {
  id: string;
  nome: string;
  cpfCnpj?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pontoReferencia?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  precosEspeciais?: { produtoId: string; preco: number; produto?: any }[];
  createdAt: string;
  updatedAt: string;
}

export interface PedidoItemDTO {
  id?: string;
  produtoId: string;
  produtoNome?: string;
  quantidade: number;
  valorUnitario: number;
  desconto?: number;
  total: number;
}

export interface PedidoDTO {
  id: string;
  numero: number;
  clienteId: string;
  cliente?: ClienteDTO;
  data: string;
  status: StatusPedido;
  formaPagamento?: FormaPagamento | null;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  observacoes?: string | null;
  itens: PedidoItemDTO[];
  createdAt: string;
  updatedAt: string;
  boletoReceber?: BoletoReceberDTO | null;
  fiado?: FiadoDTO | null;
  pagamentos?: PagamentoDTO[];
}

export interface PagamentoDTO {
  id: string;
  pedidoId: string;
  forma: FormaPagamento;
  valor: number;
  dataPagamento: string;
  observacoes?: string | null;
}

export interface FiadoDTO {
  id: string;
  pedidoId: string;
  clienteId: string;
  cliente?: ClienteDTO;
  pedido?: PedidoDTO;
  valorOriginal: number;
  valorPago: number;
  saldo: number;
  situacao: 'ABERTO' | 'PARCIAL' | 'QUITADO';
  createdAt: string;
  updatedAt: string;
  historico?: FiadoHistoricoDTO[];
}

export interface FiadoHistoricoDTO {
  id: string;
  fiadoId: string;
  valorPago: number;
  dataPagamento: string;
  formaPagamento: FormaPagamento;
  observacoes?: string | null;
}

export interface BoletoReceberDTO {
  id: string;
  pedidoId: string;
  clienteId: string;
  cliente?: ClienteDTO;
  pedido?: PedidoDTO;
  numero: string;
  quantidadeParcelas: number;
  valorTotal: number;
  createdAt: string;
  parcelas: BoletoParcelaDTO[];
}

export interface BoletoParcelaDTO {
  id: string;
  boletoReceberId: string;
  numeroParcela: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: StatusBoleto;
}

export interface EstoqueGarrafaoDTO {
  id: string;
  anoFabricacao: number;
  anoValidade: number;
  quantidade: number;
  status: StatusGarrafao;
  observacoes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DespesaDTO {
  id: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  data: string;
  formaPagamento: FormaPagamento;
  status: 'PAGA' | 'PENDENTE';
  observacoes?: string | null;
  boletoPagarId?: string | null;
}

export interface NotaFiscalDTO {
  id: string;
  numero: string;
  serie?: string | null;
  dataEmissao: string;
  emissorNome: string;
  emissorCnpj: string;
  chaveAcesso?: string | null;
  valorTotal: number;
  valorIcms: number;
  valorPis: number;
  valorCofins: number;
  outrosTributos: number;
  arquivoUrl?: string | null;
  observacoes?: string | null;
  itens?: {
    id: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }[];
  createdAt: string;
}

export interface DashboardMetricsDTO {
  faturamento: number;
  recebido: number;
  emAberto: number;
  despesas: number;
  resultado: number;
  recebimentoPorForma: {
    forma: string;
    valor: number;
    quantidade: number;
  }[];
  pedidosPorStatus: {
    status: StatusPedido;
    quantidade: number;
    valorTotal: number;
  }[];
  fiadosResumo: {
    clientesDevendo: number;
    valorTotalEmAberto: number;
  };
  boletosResumo: {
    quantidadePendente: number;
    quantidadeVencida: number;
    valorTotalEmAberto: number;
  };
  estoqueResumo: {
    aguaDisponivel: number;
    garrafoesCheios: number;
    garrafoesVazios: number;
    garrafoesDanificados: number;
    garrafoesQuebrados: number;
    garrafoesVencidos: number;
    garrafoesDescartados: number;
    garrafoesProximoVencimento: number;
  };
  notasFiscaisResumo: {
    quantidadeNotas: number;
    valorTotal: number;
    tributosDestacados: number;
  };
}

export interface ConfiguracaoDTO {
  id: string;
  nomeEmpresa: string;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  chavePix?: string | null;
}

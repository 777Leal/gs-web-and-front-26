export const EMPTY = [];   // fallback estável (mesma referência sempre) para useStore

export const LBL = { ok: "Estável", warn: "Atenção", critical: "Janela crítica" };

// usado quando o Dashboard ainda não publicou leituras
export const SEED_LOTS = [
  { id: "l1", fruit: "Banana", variety: "Nanica", kg: 40, price: 6, hours: 20, status: "critical", discount: 40 },
  { id: "l2", fruit: "Maçã", variety: "Fuji", kg: 60, price: 8, hours: 150, status: "ok", discount: 10 },
  { id: "l3", fruit: "Tomate", variety: "Italiano", kg: 35, price: 7, hours: 60, status: "warn", discount: 10 }
];

export const CO2_KG = 1.1, MEALS_KG = 2.5;   // fatores ilustrativos: substitua por dados auditados

export const ROUTES = { dashboard: "Dashboard IoT", connection: "Conexão hiperlocal", impact: "Impacto social" };
export const NAV = [["dashboard", "Dashboard IoT", "activity"], ["connection", "Conexão hiperlocal", "pin"], ["impact", "Impacto social", "leaf"]];

export const LAW = [
  ["Lei nº 15.224/2025: política nacional", "Instituiu a Política Nacional de Combate à Perda e ao Desperdício de Alimentos e revogou a Lei nº 14.016/2020. O doador e o intermediário só respondem civilmente por danos se houver dolo, e a doação não configura relação de consumo."],
  ["Condições do alimento doado", "Podem ser doados alimentos in natura, preparados ou embalados dentro do prazo de validade, desde que as normas sanitárias e as propriedades nutricionais sejam mantidas."],
  ["Selo Doador de Alimentos", "Concedido pelo Poder Executivo a estabelecimentos que doam alimentos, e também a produtores rurais, cooperativas e associações de produtores. Tem validade de dois anos."],
  ["Incentivo fiscal", "A tramitação da lei incluiu incentivo fiscal para doações, mas parte desse ponto foi vetada (Veto 35/2025). Confirme a situação atual com seu contador antes de contar com o benefício."]
];

export const CHECKS = [
  "Alimento próprio para consumo e dentro da validade",
  "Armazenamento e transporte respeitam as normas sanitárias",
  "Doação gratuita, sem contrapartida ao doador",
  "Entrega a banco de alimentos, entidade beneficente ou beneficiário vulnerável",
  "Registro da doação guardado (data, destino e quantidade)"
];

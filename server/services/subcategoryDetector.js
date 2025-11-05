/**
 * Subcategory Detection Service
 * Auto-detects subcategories for each item based on description and main category
 */

const subcategoryMappings = {
  supermercado: {
    bebidas_alcoolicas: {
      id: 'bebidas_alcoolicas',
      name: 'Bebidas Alcoólicas',
      emoji: '🍺',
      keywords: [
        'cerv', 'cerveja', 'beer', 'brahma', 'skol', 'heineken', 'stella', 'corona',
        'budweiser', 'baden', 'eisenbahn', 'bohemia', 'antarctica', 'itaipava',
        'vinho', 'wine', 'tinto', 'branco', 'rose', 'espumante', 'champagne',
        'whisky', 'whiskey', 'vodka', 'gin', 'rum', 'tequila', 'cachaca', 'caipirinha',
        'licor', 'conhaque', 'sake', 'smirnoff', 'absolut', 'jack daniels'
      ]
    },
    bebidas_nao_alcoolicas: {
      id: 'bebidas_nao_alcoolicas',
      name: 'Bebidas Não Alcoólicas',
      emoji: '🥤',
      keywords: [
        'suco', 'juice', 'refrigerante', 'refri', 'coca', 'pepsi', 'guarana', 'fanta',
        'sprite', 'agua', 'mineral', 'tonica', 'energetico', 'red bull', 'monster',
        'cha', 'mate', 'leao', 'lipton', 'nestea', 'del valle', 'maguary', 'kapo',
        'tang', 'fresh', 'aurora', 'sufresh', 'tial', 'nescafe', 'dolca'
      ]
    },
    carnes: {
      id: 'carnes',
      name: 'Carnes e Derivados',
      emoji: '🥩',
      keywords: [
        'carne', 'bov', 'bovina', 'peito', 'file', 'contra', 'costela', 'picanha',
        'alcatra', 'patinho', 'coxao', 'lagarto', 'miolo', 'acem', 'fraldinha',
        'bacon', 'linguica', 'salsicha', 'hamburguer', 'nuggets',
        'frango', 'ave', 'coxa', 'peito', 'asa', 'sobrecoxa', 'sassami',
        'porco', 'suino', 'lombo', 'pernil', 'costela', 'bisteca',
        'peru', 'chester', 'tender',
        'peixe', 'pescado', 'tilapia', 'salmao', 'atum', 'sardinha', 'merluza',
        'friboi', 'seara', 'sadia', 'perdigao', 'aurora', 'marfrig', 'swift'
      ]
    },
    laticinios: {
      id: 'laticinios',
      name: 'Laticínios',
      emoji: '🥛',
      keywords: [
        'leite', 'milk', 'integral', 'desnatado', 'semi', 'italac', 'parmalat',
        'ninho', 'molico', 'piracanjuba', 'lider', 'batavo', 'nestle',
        'queijo', 'cheese', 'mussarela', 'prato', 'minas', 'parmesao', 'provolone',
        'gorgonzola', 'cheddar', 'coalho', 'frescal', 'ricota', 'cream cheese',
        'iogurte', 'yogurt', 'danone', 'activia', 'vigor', 'paulista', 'batavo',
        'manteiga', 'margarina', 'requeijao', 'catupiry', 'creme de leite',
        'nata', 'chantilly', 'condensado', 'doce de leite'
      ]
    },
    padaria: {
      id: 'padaria',
      name: 'Padaria',
      emoji: '🍞',
      keywords: [
        'pao', 'bread', 'frances', 'forma', 'integral', 'centeio', 'bisnaga',
        'brioche', 'hamburguer', 'hot dog', 'ciabatta', 'baguete',
        'bolo', 'cake', 'torta', 'croissant', 'sonho', 'rosca', 'bomba',
        'biscoito', 'cookie', 'bolacha', 'wafer', 'cream cracker', 'maria',
        'muffin', 'cupcake', 'brownie', 'panetone', 'chocotone',
        'wickbold', 'plusvita', 'nutrella', 'pullman', 'bauducco'
      ]
    },
    frutas_verduras: {
      id: 'frutas_verduras',
      name: 'Frutas e Verduras',
      emoji: '🍎',
      keywords: [
        'banana', 'maca', 'laranja', 'uva', 'morango', 'melancia', 'melao',
        'abacaxi', 'manga', 'pera', 'pessego', 'kiwi', 'limao', 'tangerina',
        'mamao', 'abacate', 'goiaba', 'maracuja', 'coco', 'ameixa',
        'alface', 'tomate', 'cebola', 'batata', 'cenoura', 'abobrinha',
        'brocolis', 'couve', 'repolho', 'pimentao', 'berinjela', 'chuchu',
        'mandioca', 'inhame', 'beterraba', 'pepino', 'rucula', 'agriao',
        'salsa', 'cebolinha', 'coentro', 'manjericao', 'hortalica', 'verdura'
      ]
    },
    mercearia: {
      id: 'mercearia',
      name: 'Mercearia',
      emoji: '🍝',
      keywords: [
        'arroz', 'rice', 'feijao', 'bean', 'macarrao', 'pasta', 'espaguete',
        'penne', 'parafuso', 'renata', 'adria', 'barilla',
        'oleo', 'azeite', 'olive', 'liza', 'soya', 'salada', 'girassol',
        'acucar', 'sugar', 'sal', 'salt', 'farinha', 'flour', 'fuba', 'amido',
        'molho', 'sauce', 'tomate', 'pesto', 'shoyu', 'maionese', 'ketchup',
        'mostarda', 'hellmanns', 'heinz', 'quero', 'elefante', 'uniao',
        'cafe', 'coffee', 'pilao', 'tres coracoes', 'santa clara', 'pimpinela',
        'cha', 'tea', 'chocolate', 'achocolatado', 'nescau', 'toddy', 'ovomaltine',
        'cereal', 'aveia', 'granola', 'musli', 'corn flakes', 'sucrilhos', 'nestlé'
      ]
    },
    congelados: {
      id: 'congelados',
      name: 'Congelados',
      emoji: '🧊',
      keywords: [
        'congelado', 'frozen', 'lasanha', 'pizza', 'nuggets', 'empanado',
        'batata', 'frita', 'palito', 'hamburguer', 'almondega',
        'peixe', 'file', 'tilapia', 'salmao', 'camarao',
        'sorvete', 'ice cream', 'picole', 'kibon', 'nestle', 'rochinha',
        'acai', 'polpa', 'fruta congelada', 'vegetais congelados',
        'sadia', 'seara', 'perdigao', 'aurora', 'da granja'
      ]
    },
    doces_sobremesas: {
      id: 'doces_sobremesas',
      name: 'Doces e Sobremesas',
      emoji: '🍰',
      keywords: [
        'chocolate', 'choc', 'hersheys', 'lacta', 'garoto', 'nestle', 'arcor',
        'barra', 'tablete', 'bombom', 'trufa', 'diamante negro', 'ouro branco',
        'doce', 'candy', 'bala', 'pirulito', 'chiclete', 'drops', 'halls',
        'mentos', 'trident', 'fini', 'haribo',
        'pudim', 'mousse', 'gelatina', 'sobremesa', 'dessert',
        'geleia', 'compota', 'mel', 'honey', 'melado', 'rapadura',
        'paçoca', 'pe de moleque', 'doce de leite', 'goiabada', 'marmelada'
      ]
    },
    temperos_condimentos: {
      id: 'temperos_condimentos',
      name: 'Temperos e Condimentos',
      emoji: '🧂',
      keywords: [
        'tempero', 'condimento', 'seasoning', 'alho', 'garlic', 'cebola', 'onion',
        'pimenta', 'pepper', 'cominho', 'oregano', 'manjericao', 'salsa',
        'cebolinha', 'coentro', 'louro', 'tomilho', 'alecrim', 'canela',
        'noz moscada', 'cravo', 'gengibre', 'curcuma', 'curry', 'paprica',
        'knorr', 'sazon', 'arisco', 'maggi', 'kitano', 'chinsu', 'ervas'
      ]
    },
    higiene_limpeza: {
      id: 'higiene_limpeza',
      name: 'Higiene e Limpeza',
      emoji: '🧻',
      keywords: [
        'sabonete', 'soap', 'shampoo', 'condicionador', 'creme', 'hidratante',
        'desodorante', 'perfume', 'colonia', 'escova', 'dente', 'pasta',
        'fio dental', 'enxaguante', 'listerine', 'oral b',
        'papel higienico', 'guard', 'neve', 'personal', 'absorvente', 'sempre livre',
        'fralda', 'pampers', 'huggies', 'lenco', 'toalha',
        'detergente', 'ype', 'limpol', 'clear', 'omo', 'ariel', 'ace', 'comfort',
        'sabao', 'agua sanitaria', 'desinfetante', 'limpa', 'ajax', 'veja',
        'esponja', 'pano', 'vassoura', 'rodo', 'balde', 'saco lixo', 'fralda', 'pampers',
        'huggies', 'lenco', 'toalha', 'bebe'
      ]
    },
    pet: {
      id: 'pet',
      name: 'Pet',
      emoji: '🐾',
      keywords: [
        'racao', 'pet', 'cachorro', 'dog', 'cao', 'gato', 'cat', 'felino',
        'areia', 'silica', 'granulado', 'pipicat', 'kelco',
        'petisco', 'snack', 'bifinho', 'osso', 'brinquedo',
        'coleira', 'guia', 'comedouro', 'bebedouro', 'casinha',
        'whiskas', 'pedigree', 'royal canin', 'premier', 'golden', 'special dog'
      ]
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  transporte: {
    combustivel: {
      id: 'combustivel',
      name: 'Combustível',
      emoji: '⛽',
      keywords: [
        'gasolina', 'alcool', 'etanol', 'diesel', 'gnv', 'gas',
        'shell', 'ipiranga', 'petrobras', 'br', 'ale', 'raizen'
      ]
    },
    manutencao: {
      id: 'manutencao',
      name: 'Manutenção e Reparos',
      emoji: '🔧',
      keywords: [
        'oficina', 'mecanica', 'revisao', 'troca', 'oleo', 'filtro',
        'pneu', 'balanceamento', 'alinhamento', 'freio', 'bateria',
        'pecas', 'auto', 'reparo', 'conserto'
      ]
    },
    estacionamento: {
      id: 'estacionamento',
      name: 'Estacionamento',
      emoji: '🅿️',
      keywords: ['estacionamento', 'parking', 'vaga', 'mensalista', 'zona azul']
    },
    transporte_publico: {
      id: 'transporte_publico',
      name: 'Transporte Público',
      emoji: '🚌',
      keywords: [
        'onibus', 'metro', 'trem', 'bilhete', 'passagem', 'vale transporte',
        'recarga', 'cartao', 'bom', 'sptrans', 'cptm', 'metrô'
      ]
    },
    apps_transporte: {
      id: 'apps_transporte',
      name: 'Apps de Transporte',
      emoji: '🚗',
      keywords: ['uber', '99', 'cabify', 'corrida', 'viagem', 'app']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  saude: {
    medicamentos: {
      id: 'medicamentos',
      name: 'Medicamentos',
      emoji: '💊',
      keywords: [
        'medicamento', 'remedio', 'farmacia', 'drogaria', 'comprimido',
        'capsula', 'pomada', 'creme', 'xarope', 'generico', 'antibiotico'
      ]
    },
    consultas: {
      id: 'consultas',
      name: 'Consultas',
      emoji: '👨‍⚕️',
      keywords: ['consulta', 'medico', 'doutor', 'clinica', 'atendimento']
    },
    exames: {
      id: 'exames',
      name: 'Exames',
      emoji: '🩺',
      keywords: ['exame', 'laboratorio', 'analise', 'raio x', 'tomografia', 'ressonancia']
    },
    plano_saude: {
      id: 'plano_saude',
      name: 'Plano de Saúde',
      emoji: '🏥',
      keywords: ['plano', 'unimed', 'bradesco saude', 'amil', 'sulamerica', 'convenio']
    },
    academia: {
      id: 'academia',
      name: 'Academia',
      emoji: '💪',
      keywords: ['academia', 'gym', 'smartfit', 'bodytech', 'bio ritmo', 'fitness']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  pessoais: {
    salao_beleza: {
      id: 'salao_beleza',
      name: 'Salão e Beleza',
      emoji: '💇',
      keywords: ['salao', 'cabeleireiro', 'barbeiro', 'manicure', 'pedicure', 'estetica']
    },
    cosmeticos: {
      id: 'cosmeticos',
      name: 'Cosméticos',
      emoji: '💄',
      keywords: ['cosmetico', 'maquiagem', 'perfume', 'boticario', 'natura', 'avon']
    },
    roupas: {
      id: 'roupas',
      name: 'Roupas',
      emoji: '👕',
      keywords: ['roupa', 'camisa', 'calca', 'vestido', 'renner', 'riachuelo', 'c&a']
    },
    calcados: {
      id: 'calcados',
      name: 'Calçados',
      emoji: '👟',
      keywords: ['calcado', 'sapato', 'tenis', 'sandalia', 'chinelo', 'bota']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  educacao: {
    mensalidade: {
      id: 'mensalidade',
      name: 'Mensalidade',
      emoji: '🎓',
      keywords: ['mensalidade', 'anuidade', 'escola', 'colegio', 'faculdade', 'universidade']
    },
    material: {
      id: 'material',
      name: 'Material Escolar',
      emoji: '📚',
      keywords: ['livro', 'caderno', 'apostila', 'papelaria', 'material', 'lapis', 'caneta']
    },
    cursos: {
      id: 'cursos',
      name: 'Cursos',
      emoji: '📖',
      keywords: ['curso', 'aula', 'workshop', 'treinamento', 'certificacao']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  filhos: {
    creche_escola: {
      id: 'creche_escola',
      name: 'Creche/Escola',
      emoji: '🏫',
      keywords: ['creche', 'escola', 'colegio', 'infantil']
    },
    brinquedos: {
      id: 'brinquedos',
      name: 'Brinquedos',
      emoji: '🧸',
      keywords: ['brinquedo', 'toy', 'ri happy', 'pbkids', 'lego', 'boneca']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  financeiras: {
    emprestimo: {
      id: 'emprestimo',
      name: 'Empréstimo',
      emoji: '💰',
      keywords: ['emprestimo', 'loan', 'financiamento', 'credito', 'parcela']
    },
    pagamento_cartao: {
      id: 'pagamento_cartao',
      name: 'Pagamento de Cartão de Crédito',
      emoji: '💳',
      keywords: [
        'pagamento cartao', 'fatura', 'fatura cartao', 'cartao credito',
        'invoice', 'nubank', 'inter', 'itau', 'bradesco', 'santander',
        'banco do brasil', 'caixa', 'mastercard', 'visa', 'elo', 'amex',
        'american express', 'hipercard', 'pag cartao', 'pgto cartao'
      ]
    },
    tarifas: {
      id: 'tarifas',
      name: 'Tarifas Bancárias',
      emoji: '🏦',
      keywords: ['tarifa', 'taxa', 'anuidade', 'manutencao', 'bancaria']
    },
    investimentos: {
      id: 'investimentos',
      name: 'Investimentos',
      emoji: '📈',
      keywords: ['investimento', 'aplicacao', 'acao', 'fundo', 'tesouro', 'cdb']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  lazer: {
    cinema_teatro: {
      id: 'cinema_teatro',
      name: 'Cinema e Teatro',
      emoji: '🎬',
      keywords: ['cinema', 'teatro', 'filme', 'ingresso', 'cinemark', 'uci']
    },
    streaming: {
      id: 'streaming',
      name: 'Streaming',
      emoji: '📺',
      keywords: ['netflix', 'spotify', 'disney', 'amazon prime', 'hbo', 'deezer']
    },
    viagens: {
      id: 'viagens',
      name: 'Viagens',
      emoji: '✈️',
      keywords: ['viagem', 'hotel', 'pousada', 'passagem', 'turismo', 'booking']
    },
    restaurantes: {
      id: 'restaurantes',
      name: 'Restaurantes',
      emoji: '🍽️',
      keywords: ['restaurante', 'bar', 'lanchonete', 'ifood', 'delivery', 'pizza']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  pets: {
    racao: {
      id: 'racao',
      name: 'Ração',
      emoji: '🍖',
      keywords: ['racao', 'alimentacao', 'comida', 'whiskas', 'pedigree', 'royal']
    },
    veterinario: {
      id: 'veterinario',
      name: 'Veterinário',
      emoji: '🏥',
      keywords: ['veterinario', 'vet', 'clinica', 'consulta', 'vacina']
    },
    acessorios: {
      id: 'acessorios',
      name: 'Acessórios',
      emoji: '🦴',
      keywords: ['coleira', 'guia', 'brinquedo', 'comedouro', 'casinha', 'areia']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  moradia: {
    aluguel: {
      id: 'aluguel',
      name: 'Aluguel',
      emoji: '🏠',
      keywords: ['aluguel', 'rent', 'locacao', 'imobiliaria']
    },
    condominio: {
      id: 'condominio',
      name: 'Condomínio',
      emoji: '🏢',
      keywords: ['condominio', 'administradora', 'sindico', 'taxa condominial']
    },
    iptu: {
      id: 'iptu',
      name: 'IPTU',
      emoji: '📄',
      keywords: ['iptu', 'imposto', 'predial', 'territorial']
    },
    manutencao: {
      id: 'manutencao',
      name: 'Manutenção',
      emoji: '🔨',
      keywords: ['manutencao', 'reparo', 'reforma', 'pintura', 'encanador', 'eletricista']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  contas_fixas: {
    energia: {
      id: 'energia',
      name: 'Energia Elétrica',
      emoji: '⚡',
      keywords: ['energia', 'luz', 'eletrica', 'cemig', 'copel', 'light', 'enel']
    },
    agua: {
      id: 'agua',
      name: 'Água e Esgoto',
      emoji: '💧',
      keywords: ['agua', 'esgoto', 'sabesp', 'cedae', 'saneamento']
    },
    gas: {
      id: 'gas',
      name: 'Gás',
      emoji: '🔥',
      keywords: ['gas', 'comgas', 'botijao', 'encanado']
    },
    internet: {
      id: 'internet',
      name: 'Internet',
      emoji: '📡',
      keywords: ['internet', 'banda larga', 'fibra', 'net', 'vivo', 'claro', 'oi']
    },
    telefone: {
      id: 'telefone',
      name: 'Telefone',
      emoji: '📞',
      keywords: ['telefone', 'celular', 'tim', 'vivo', 'claro', 'oi', 'plano']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  },

  outras: {
    presentes: {
      id: 'presentes',
      name: 'Presentes',
      emoji: '🎁',
      keywords: ['presente', 'gift', 'aniversario', 'natal', 'dia das maes', 'dia dos pais']
    },
    doacao: {
      id: 'doacao',
      name: 'Doações',
      emoji: '❤️',
      keywords: ['doacao', 'caridade', 'ong', 'igreja', 'doacoes']
    },
    multas: {
      id: 'multas',
      name: 'Multas e Taxas',
      emoji: '🚨',
      keywords: ['multa', 'taxa', 'detran', 'infracacao', 'penalidade']
    },
    seguros: {
      id: 'seguros',
      name: 'Seguros',
      emoji: '🛡️',
      keywords: ['seguro', 'insurance', 'vida', 'carro', 'residencial', 'porto seguro']
    },
    servicos: {
      id: 'servicos',
      name: 'Serviços Diversos',
      emoji: '🔧',
      keywords: ['servico', 'manutencao', 'reparo', 'conserto', 'assistencia']
    },
    outros: {
      id: 'outros',
      name: 'Outros',
      emoji: '💡',
      keywords: []
    }
  }
};

/**
 * Detect subcategory for an item based on description and main category
 * @param {string} description - Item description (e.g., "CERV B.BADEN GOLD 350ML")
 * @param {string} mainCategoryId - Main category ID (e.g., "supermercado")
 * @returns {object} Subcategory object { id, name, emoji }
 */
function detectSubcategory(description, mainCategoryId) {
  // Normalize description
  const desc = description.toLowerCase().trim();

  // Get subcategories for this main category
  const subcategories = subcategoryMappings[mainCategoryId];

  if (!subcategories) {
    console.log(`[Subcategory] No subcategories defined for category: ${mainCategoryId}`);
    return { id: 'outros', name: 'Outros', emoji: '💡' };
  }

  // Try to match keywords
  for (const [subcatId, subcatData] of Object.entries(subcategories)) {
    // Skip "outros" for now (fallback)
    if (subcatId === 'outros') continue;

    // Check if any keyword matches
    for (const keyword of subcatData.keywords) {
      if (desc.includes(keyword.toLowerCase())) {
        console.log(`[Subcategory] Matched "${keyword}" → ${subcatData.emoji} ${subcatData.name}`);
        return {
          id: subcatData.id,
          name: subcatData.name,
          emoji: subcatData.emoji
        };
      }
    }
  }

  // No match found, return "Outros"
  console.log(`[Subcategory] No match found for "${description}", using default: Outros`);
  return subcategories.outros || { id: 'outros', name: 'Outros', emoji: '💡' };
}

/**
 * Get all subcategories for a specific main category
 * @param {string} mainCategoryId - Main category ID (e.g., "supermercado")
 * @returns {array} Array of subcategory objects
 */
function getSubcategoriesByCategory(mainCategoryId) {
  const subcategories = subcategoryMappings[mainCategoryId];

  if (!subcategories) {
    return [{ id: 'outros', name: 'Outros', emoji: '💡' }];
  }

  // Return array of subcategories (without keywords)
  return Object.values(subcategories).map(subcat => ({
    id: subcat.id,
    name: subcat.name,
    emoji: subcat.emoji
  }));
}

module.exports = {
  detectSubcategory,
  getSubcategoriesByCategory,
  subcategoryMappings
};

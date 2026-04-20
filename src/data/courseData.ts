export interface CourseEntry {
  area: string;
  carreira: string;
  formacoes: {
    label: string;
    cursos: string[];
  }[];
}

export interface CategoryData {
  categoria: string;
  areas: CourseEntry[];
}

// Formation level labels matching Excel columns C-G
const FORMACAO_LABELS = [
  "Ponto de Partida",
  "Formação Completa",
  "Formação Continuada",
  "Formação Alternativa",
  "Nível Especialista",
];

function buildEntry(
  area: string,
  carreira: string,
  cols: (string | null)[][]
): CourseEntry {
  const formacoes = FORMACAO_LABELS.map((label, i) => {
    const cursos = cols
      .map((row) => row[i])
      .filter((v): v is string => v != null && v.trim() !== "");
    return { label, cursos };
  }).filter((f) => f.cursos.length > 0);

  return { area, carreira, formacoes };
}

// Raw data from Excel
const rawData: {
  area: string;
  carreiras: { nome: string; rows: (string | null)[][] }[];
}[] = [
  {
    area: "Mkt / Tráfego",
    carreiras: [
      {
        nome: "Marketing Digital & Gestão de Tráfego",
        rows: [
          ["Google Workspace", "Photoshop", "Marketing Digital", "Illustrator", "Vendas"],
          ["Canva", "IA", "Mentoria em Captação de Video e Direção de Arte para Negócios", "Youtuber", "Gestão de Negócios"],
          ["Capcut", null, null, null, null],
        ],
      },
    ],
  },
  {
    area: "Arquitetura",
    carreiras: [
      {
        nome: "Design de Interiores",
        rows: [
          ["Autocad Civil", "Vray", "Mentoria em Renderização com IA", "IA", "Gestão de Escritório"],
          ["Sketch Up", "Canva", "Mentoria em Detalhamento de Projetos de Interiores", "Lumion / Enscape", null],
        ],
      },
      {
        nome: "Urbanismo",
        rows: [
          ["Autocad", "Excel", "Mentoria em Qgis", "Illustrator", "Análise de Dados Georreferenciados"],
          ["SketchUp", "Revit", null, "Photoshop", "Análise de Cadastro"],
        ],
      },
      {
        nome: "Arquitetura",
        rows: [
          ["Autocad", "Archicad", "Photoshop", "Photoshop", "Gestão de Projetos"],
          ["Sketch Up", "Vray", "Lumion/Enscape", "Excel", "Gestão de Escritório"],
          [null, null, "Mentoria em Projetos Complementares", "Mentoria em Sketch Up Avançado e Layout", "Análise de Cadastro"],
        ],
      },
    ],
  },
  {
    area: "Design Gráfico",
    carreiras: [
      {
        nome: "Design Digital",
        rows: [
          ["Canva", "Illustrator", "Marketing Digital", "Lógica de Programação", "Identidade Visual no Design de Produto"],
          ["Photoshop", "Photoshop p/ Fotografia", "Mentoria em Interface do Usuário", "HTML/CSS", "Acessibilidade digital"],
          [null, null, null, "Mentoria em Figma", "UX Score"],
        ],
      },
      {
        nome: "Comunicação Visual",
        rows: [
          ["Canva", "Illustrator", "Mentoria em Branding", "IA", "Visual Merchandising"],
          ["CorelDraw", "Photoshop", "After Effects", "Mentoria em Figma", "Brandbook"],
          [null, "Mentoria em Configurações de Impressão", null, null, null],
        ],
      },
      {
        nome: "Impressão 3D",
        rows: [
          ["Mentoria em Blender 3D", "Mentoria em Manutenção de Impressora", "Técnicas de Polimento", "Mentoria em Maquetaria", "Vendas"],
          ["CorelDraw", "Mentoria em Fatiamento", null, null, null],
        ],
      },
    ],
  },
  {
    area: "Engenharia",
    carreiras: [
      {
        nome: "Engenharia Civil",
        rows: [
          ["Autocad", "Revit Hidrossanitário", null, null, null],
          ["Revit", "Excel", null, null, null],
        ],
      },
      {
        nome: "Engenharia de Produto/Industrial",
        rows: [
          ["Autocad", "SketchUp", "Mentoria em Revit para Industrias", "Autocad 3D", "Sistemas de Otimização DFM"],
          ["Autocad Mecânica", "SolidWorks", "Excel + Excel Avançado", "Mentoria em Civil3D", null],
        ],
      },
    ],
  },
  {
    area: "Produção Audiovisual",
    carreiras: [
      {
        nome: "Motion Design",
        rows: [
          ["Illustrator", "Photoshop", "Mentoria em Figma", null, null],
          ["Youtuber", "After Effects", "Mentoria em Illustrator Avançado", null, null],
        ],
      },
      {
        nome: "Produção de Video p/ Mídias",
        rows: [
          ["Capcut", "Premiere", "Photoshop", "Canva", null],
          ["Youtuber", "After Effects", "Mentoria em Captação de Video", null, null],
        ],
      },
    ],
  },
  {
    area: "Projetos Técnicos",
    carreiras: [
      {
        nome: "Projeto Civil",
        rows: [
          ["Autocad", "Autocad Mecânica", "Revit", "Autocad 3D", null],
        ],
      },
      {
        nome: "Marcenaria/Marmoraria",
        rows: [
          ["Autocad", "SketchUp", "Vray", null, null],
          [null, null, "Mentoria em Sketch+Hellomob", null, null],
        ],
      },
    ],
  },
  {
    area: "IA (Inteligência Artificial)",
    carreiras: [
      { nome: "Machine Learning", rows: [] },
      { nome: "Ferramentas IA", rows: [] },
    ],
  },
  {
    area: "Ingressante (Jovens)",
    carreiras: [
      {
        nome: "Orientação Vocacional",
        rows: [
          ["Express/Windows", "Word", "Youtuber", "Marketing Digital ADM", null],
        ],
      },
      {
        nome: "Desenvolvimento Pessoal",
        rows: [
          ["Google Workspace", "Excel", "Lógica de Programação", "Hardware", null],
        ],
      },
      {
        nome: "Informática e Nuvem",
        rows: [
          ["Powerpoint/Canva", "IA", "Administrativos", "Games Construct", null],
        ],
      },
    ],
  },
  {
    area: "Fotografia",
    carreiras: [
      {
        nome: "Fotografia Digital",
        rows: [["Photoshop", "Photoshop p/ Fotografia", null, null, null]],
      },
      {
        nome: "Fotografia Publicitária",
        rows: [["Photoshop", "Photoshop p/ Fotografia", "InDesign", null, null]],
      },
      {
        nome: "Captação de Video",
        rows: [["Capcut", "Premiere", "Mentoria em Captação de Video", null, null]],
      },
    ],
  },
  {
    area: "Games",
    carreiras: [
      {
        nome: "Game Design",
        rows: [
          ["Construct", "Photoshop", "Mentoria em Blender", null, null],
          [null, "Illustrator", null, null, null],
        ],
      },
      {
        nome: "Programação de Jogos",
        rows: [["Lógica de Programação", "Construct", "Python", null, null]],
      },
      {
        nome: "Modelagem 3D",
        rows: [["Mentoria em Blender", "Photoshop", null, null, null]],
      },
    ],
  },
  {
    area: "Kids",
    carreiras: [
      { nome: "Informática Essencial", rows: [] },
      { nome: "Robótica", rows: [] },
    ],
  },
  {
    area: "Administrativos",
    carreiras: [
      { nome: "Gestão de Projetos", rows: [] },
      { nome: "Gestão de Empresas", rows: [] },
      { nome: "Gestão de Pessoas", rows: [] },
      { nome: "Assistência Virtual", rows: [] },
      { nome: "Logística", rows: [] },
    ],
  },
  {
    area: "Negócios",
    carreiras: [
      { nome: "Executivo", rows: [] },
      { nome: "Empreendedorismo", rows: [] },
      { nome: "Operacional", rows: [] },
    ],
  },
];

// Map Excel areas to website categories
const categoryMapping: Record<string, string> = {
  "Mkt / Tráfego": "Gestão Comercial",
  "Arquitetura": "Projetos Digitais para Arquitetura e Engenharias",
  "Design Gráfico": "Design Gráfico",
  "Engenharia": "Projetos Digitais para Arquitetura e Engenharias",
  "Produção Audiovisual": "Produção Audiovisual",
  "Projetos Técnicos": "Projetos Digitais para Arquitetura e Engenharias",
  "IA (Inteligência Artificial)": "Programação",
  "Ingressante (Jovens)": "Informática Essencial",
  "Fotografia": "Fotografia",
  "Games": "Programação",
  "Kids": "Informática Kids",
  "Administrativos": "Gestão Administrativa",
  "Negócios": "Excel para Negócios",
};

export function getCourseData(): CategoryData[] {
  const categoryMap = new Map<string, CourseEntry[]>();

  for (const areaData of rawData) {
    const catName = categoryMapping[areaData.area] || areaData.area;

    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, []);
    }

    for (const carreira of areaData.carreiras) {
      const entry = buildEntry(areaData.area, carreira.nome, carreira.rows);
      categoryMap.get(catName)!.push(entry);
    }
  }

  return Array.from(categoryMap.entries()).map(([categoria, areas]) => ({
    categoria,
    areas,
  }));
}

export const CATEGORIAS = [
  "Design Gráfico",
  "Excel para Negócios",
  "Gestão Administrativa",
  "Gestão Comercial",
  "Informática Essencial",
  "Informática Kids",
  "Produção Audiovisual",
  "Programação",
  "Projetos Digitais para Arquitetura e Engenharias",
  "Fotografia",
];

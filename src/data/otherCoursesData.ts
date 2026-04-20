export interface OtherCoursesArea {
  area: string;
  courses: string[];
}

export function getOtherCoursesByArea(): OtherCoursesArea[] {
  return [
    {
      area: "Informática Essencial",
      courses: [
        "Introdução à Informática",
        "Informática p/ Adultos",
        "Internet",
        "Windows",
        "Express",
        "Word",
        "Powerpoint",
        "Excel",
        "Google Workspace",
      ],
    },
    {
      area: "Mkt / Tráfego",
      courses: ["Marketing Digital", "Tráfego Pago", "Consultoria"],
    },
    {
      area: "Projetos",
      courses: [
        "Autocad",
        "Autocad Mecânica",
        "Revit",
        "Revit Hidrossanitário",
        "Sketch Up",
        "Vray",
        "Lumion",
        "Enscape",
        "Layout",
        "Geo",
        "Civil 3D",
      ],
    },
    {
      area: "Design Gráfico",
      courses: ["Photoshop", "Illustrator", "Coreldraw", "Canva", "Impressão 3D"],
    },
    {
      area: "Produção Audiovisual",
      courses: ["Youtuber", "Capcut", "Premiere", "AfterEffects"],
    },
    {
      area: "IA (Inteligência Artificial)",
      courses: ["Introdução a IA", "Gemini"],
    },
    {
      area: "Ingressante (Jovens)",
      courses: ["Oratória", "Currículo", "Hardware", "Segurança de Dados"],
    },
    {
      area: "Fotografia",
      courses: ["Photoshop p/ Fotografia", "Lightroom", "Fotografia"],
    },
    {
      area: "Games",
      courses: ["Construct", "Blender"],
    },
    {
      area: "Kids",
      courses: ["Informática Kids", "Robótica"],
    },
    {
      area: "Programação",
      courses: [
        "Lógica de Programação",
        "HTML",
        "CSS",
        "Javascript",
        "Python",
        "Php",
        "MySQL",
      ],
    },
  ];
}

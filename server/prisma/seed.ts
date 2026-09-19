import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedOption = { text: string; isCorrect: boolean };
type SeedQuestion = { prompt: string; order: number; options: SeedOption[] };
type SeedCourse = {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  image: string;
  passThreshold: number;
  questions: SeedQuestion[];
};

// Course content and questions are derived from the legacy HTML course pages
// (html/curso1.html, curso2.html, curso3.html). All content is in Spanish.
const courses: SeedCourse[] = [
  {
    slug: "rcp",
    title: "Reanimación Cardiopulmonar",
    description:
      "Técnica de emergencia que se aplica cuando una persona deja de respirar o su corazón deja de latir, mediante compresiones torácicas y, en algunos casos, respiración boca a boca.",
    minutes: 20,
    image: "reanimacion.png",
    passThreshold: 70,
    questions: [
      {
        prompt: "¿Qué es la Reanimación Cardiopulmonar (RCP)?",
        order: 1,
        options: [
          {
            text: "Una técnica de emergencia que se aplica cuando una persona ha dejado de respirar o su corazón ha dejado de latir.",
            isCorrect: true,
          },
          {
            text: "Una técnica para detener hemorragias externas.",
            isCorrect: false,
          },
          {
            text: "Una maniobra para desobstruir las vías respiratorias por atragantamiento.",
            isCorrect: false,
          },
          {
            text: "Un procedimiento para medir la presión arterial.",
            isCorrect: false,
          },
        ],
      },
      {
        prompt: "¿A qué ritmo deben realizarse las compresiones torácicas?",
        order: 2,
        options: [
          { text: "100-120 veces por minuto.", isCorrect: true },
          { text: "40-60 veces por minuto.", isCorrect: false },
          { text: "150-200 veces por minuto.", isCorrect: false },
          { text: "20-30 veces por minuto.", isCorrect: false },
        ],
      },
      {
        prompt: "¿Cuál es la profundidad aproximada de cada compresión torácica?",
        order: 3,
        options: [
          { text: "5 centímetros aproximadamente.", isCorrect: true },
          { text: "1 centímetro.", isCorrect: false },
          { text: "10 centímetros.", isCorrect: false },
          { text: "20 centímetros.", isCorrect: false },
        ],
      },
      {
        prompt:
          "¿Cuál es la secuencia correcta de compresiones y respiraciones boca a boca?",
        order: 4,
        options: [
          { text: "30 compresiones seguidas de 2 respiraciones.", isCorrect: true },
          { text: "15 compresiones seguidas de 5 respiraciones.", isCorrect: false },
          { text: "5 compresiones seguidas de 30 respiraciones.", isCorrect: false },
          { text: "2 compresiones seguidas de 30 respiraciones.", isCorrect: false },
        ],
      },
      {
        prompt: "Si la persona no responde, ¿qué debes hacer?",
        order: 5,
        options: [
          { text: "Llamar al 911.", isCorrect: true },
          { text: "Aplicar un torniquete.", isCorrect: false },
          { text: "Darle agua para beber.", isCorrect: false },
          { text: "Esperar sin hacer nada.", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "hemorragias",
    title: "Hemorragias Externas",
    description:
      "Técnica de primeros auxilios para detener una hemorragia externa y evitar la pérdida excesiva de sangre, mediante presión y el uso de un torniquete.",
    minutes: 60,
    image: "hemorragia.png",
    passThreshold: 70,
    questions: [
      {
        prompt: "¿Dónde se coloca el torniquete?",
        order: 1,
        options: [
          { text: "Entre 5 y 10 cm por encima de la herida.", isCorrect: true },
          { text: "Directamente sobre la herida.", isCorrect: false },
          { text: "Sobre la articulación más cercana.", isCorrect: false },
          { text: "Por debajo de la herida.", isCorrect: false },
        ],
      },
      {
        prompt: "¿Sobre qué parte nunca debe colocarse el torniquete?",
        order: 2,
        options: [
          {
            text: "Sobre una articulación, como el codo o la rodilla.",
            isCorrect: true,
          },
          { text: "Sobre el muslo.", isCorrect: false },
          { text: "Sobre el brazo.", isCorrect: false },
          { text: "Sobre la pantorrilla.", isCorrect: false },
        ],
      },
      {
        prompt: "¿Qué objeto se utiliza para hacer la torsión del torniquete?",
        order: 3,
        options: [
          {
            text: "Un objeto rígido como un palito o un bolígrafo.",
            isCorrect: true,
          },
          { text: "Solo las manos, sin ningún objeto.", isCorrect: false },
          { text: "Un paño mojado.", isCorrect: false },
          { text: "Una venda elástica sin objeto.", isCorrect: false },
        ],
      },
      {
        prompt:
          "¿Por qué es vital anotar la hora exacta de colocación del torniquete?",
        order: 4,
        options: [
          {
            text: "Porque no debe permanecer más de 2 horas si es posible.",
            isCorrect: true,
          },
          { text: "Para saber cuánta sangre se ha perdido.", isCorrect: false },
          { text: "Para cobrar por el servicio médico.", isCorrect: false },
          { text: "No es necesario anotar la hora.", isCorrect: false },
        ],
      },
      {
        prompt: "¿Cuándo debes dejar de girar el torniquete?",
        order: 5,
        options: [
          { text: "Cuando el sangrado se detiene por completo.", isCorrect: true },
          { text: "Cuando la piel se vuelve morada.", isCorrect: false },
          { text: "Después de exactamente 10 vueltas.", isCorrect: false },
          { text: "Cuando el paciente siente dolor.", isCorrect: false },
        ],
      },
    ],
  },
  {
    slug: "heimlich",
    title: "Maniobra de Heimlich",
    description:
      "Técnica de primeros auxilios para expulsar un objeto que obstruye las vías respiratorias de una persona atragantada, aplicando compresiones abdominales.",
    minutes: 15,
    image: "heimich.png",
    passThreshold: 70,
    questions: [
      {
        prompt: "¿Cuándo se utiliza la maniobra de Heimlich?",
        order: 1,
        options: [
          {
            text: "Cuando una persona está atragantada y no puede respirar, hablar ni toser.",
            isCorrect: true,
          },
          {
            text: "Cuando una persona ha dejado de respirar por un paro cardíaco.",
            isCorrect: false,
          },
          {
            text: "Cuando una persona tiene una hemorragia en un brazo.",
            isCorrect: false,
          },
          {
            text: "Cuando una persona está inconsciente por un desmayo.",
            isCorrect: false,
          },
        ],
      },
      {
        prompt: "¿Dónde debes colocar el puño cerrado?",
        order: 2,
        options: [
          {
            text: "Justo por encima del ombligo y debajo del esternón.",
            isCorrect: true,
          },
          { text: "En el centro del pecho.", isCorrect: false },
          { text: "Sobre la garganta.", isCorrect: false },
          { text: "En la parte baja de la espalda.", isCorrect: false },
        ],
      },
      {
        prompt: "¿En qué dirección se realizan las compresiones abdominales?",
        order: 3,
        options: [
          {
            text: "Hacia adentro y hacia arriba, como un movimiento de 'J'.",
            isCorrect: true,
          },
          { text: "Hacia abajo y hacia afuera.", isCorrect: false },
          { text: "Solo hacia arriba, sin presionar.", isCorrect: false },
          { text: "En círculos sobre el abdomen.", isCorrect: false },
        ],
      },
      {
        prompt: "En un bebé menor de 1 año atragantado, ¿qué debes hacer primero?",
        order: 4,
        options: [
          {
            text: "Colocarlo boca abajo sobre tu antebrazo y dar 5 golpes entre los omóplatos.",
            isCorrect: true,
          },
          {
            text: "Aplicar la misma maniobra que en un adulto.",
            isCorrect: false,
          },
          { text: "Darle agua para que trague el objeto.", isCorrect: false },
          {
            text: "Realizar compresiones con el puño cerrado.",
            isCorrect: false,
          },
        ],
      },
      {
        prompt: "¿Cuántas veces se repiten las compresiones abdominales?",
        order: 5,
        options: [
          {
            text: "De 5 a 10 veces hasta que expulse el objeto o pierda el conocimiento.",
            isCorrect: true,
          },
          { text: "Una sola vez.", isCorrect: false },
          { text: "30 veces.", isCorrect: false },
          { text: "100 veces.", isCorrect: false },
        ],
      },
    ],
  },
];

async function main(): Promise<void> {
  // Guard: only seed when the courses table is empty. This keeps the seed
  // non-destructive when it runs on subsequent deploys (it must never wipe
  // registered users or their exam results).
  const existingCourses = await prisma.course.count();
  if (existingCourses > 0) {
    console.log("Courses already present — skipping seed.");
    return;
  }

  console.log("Seeding Velvet Health database...");

  // Clear existing data in dependency order for a deterministic, idempotent seed.
  await prisma.examResult.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  for (const course of courses) {
    await prisma.course.create({
      data: {
        slug: course.slug,
        title: course.title,
        description: course.description,
        minutes: course.minutes,
        image: course.image,
        passThreshold: course.passThreshold,
        questions: {
          create: course.questions.map((question) => ({
            prompt: question.prompt,
            order: question.order,
            options: { create: question.options },
          })),
        },
      },
    });
  }

  console.log(`Seeded ${courses.length} courses.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

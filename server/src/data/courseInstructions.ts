// Static Spanish instructions per course, derived from the legacy HTML course
// content. The Prisma `Course` model has no instructions column, so these live
// in code and are returned by `GET /api/courses/:slug`.

export const courseInstructions: Record<string, string[]> = {
  rcp: [
    "Revisa si responde: sacúdelo y pregúntale '¿Estás bien?'",
    "Si no responde, llama al 911.",
    "Verifica si respira: si no respira o jadea, comienza RCP.",
    "Haz compresiones torácicas: manos en el centro del pecho.",
    "Presiona fuerte y rápido: 100-120 veces por minuto.",
    "Profundidad: 5 cm aproximadamente.",
    "Agrega respiraciones: 30 compresiones + 2 respiraciones boca a boca (solo con protección y entrenamiento).",
    "Sigue hasta que llegue ayuda o se use un DEA.",
  ],
  hemorragias: [
    "Ubica la herida (solo se aplica en brazos o piernas).",
    "Coloca el torniquete 5 a 10 cm por encima de la herida.",
    "Nunca sobre una articulación (ni en codo ni rodilla).",
    "Envuelve firmemente con una venda ancha o paño.",
    "Inserta un objeto para hacer torsión (palito, bolígrafo, etc.).",
    "Gira hasta detener el sangrado por completo.",
    "Fija la palanca con cinta o venda para que no se suelte.",
    "Anota la hora exacta de colocación (no debe estar más de 2 horas si es posible).",
  ],
  heimlich: [
    "Ponte detrás de la persona.",
    "Rodea su cintura con ambos brazos.",
    "Coloca un puño cerrado justo por encima del ombligo, pero debajo del esternón.",
    "Sujeta el puño con la otra mano.",
    "Realiza compresiones hacia adentro y hacia arriba (movimiento de 'J').",
    "Repite de 5 a 10 veces hasta que expulse el objeto o pierda el conocimiento.",
    "En bebés menores de 1 año: colócalo boca abajo sobre tu antebrazo y da 5 golpes entre los omóplatos.",
    "Gíralo boca arriba y da 5 compresiones torácicas con dos dedos.",
  ],
};

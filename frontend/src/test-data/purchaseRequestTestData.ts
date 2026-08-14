import type { CreatePurchaseRequestInput } from "../types/api";

export type PurchaseRequestTestData = CreatePurchaseRequestInput;

const teams: CreatePurchaseRequestInput["approvers"][] = [
  [{ name: "Carlos García", email: "carlos.garcia@example.com", role: "FINANCE" }, { name: "Laura Martínez", email: "laura.martinez@example.com", role: "MANAGER" }, { name: "Andrés Rodríguez", email: "andres.rodriguez@example.com", role: "DIRECTOR" }],
  [{ name: "Natalia Ramírez", email: "natalia.ramirez@example.com", role: "PROCUREMENT" }, { name: "Sebastián Díaz", email: "sebastian.diaz@example.com", role: "OPERATIONS" }, { name: "Camila Herrera", email: "camila.herrera@example.com", role: "FINANCE" }],
  [{ name: "Paula Moreno", email: "paula.moreno@example.com", role: "LEGAL" }, { name: "Felipe Castro", email: "felipe.castro@example.com", role: "SECURITY" }, { name: "Valentina Rojas", email: "valentina.rojas@example.com", role: "TECHNOLOGY" }],
];

function testCase(title: string, description: string, amount: number, requestedBy: string, teamIndex: number): PurchaseRequestTestData {
  const approvers = teams[teamIndex];
  if (!approvers) throw new Error(`Unknown approval team: ${teamIndex}`);
  return { title, description, amount, requestedBy, approvers };
}

export const PURCHASE_REQUEST_TEST_DATA: readonly PurchaseRequestTestData[] = [
  testCase("Compra de portátiles para desarrollo", "Adquisición de equipos portátiles para el equipo de desarrollo de software.", 18_500_000, "Mariana Torres", 0),
  testCase("Renovación de monitores corporativos", "Compra de monitores para renovar los puestos de trabajo administrativos.", 9_200_000, "Daniel Gómez", 1),
  testCase("Licencias de diseño UX", "Renovación anual de licencias para las herramientas del equipo de experiencia de usuario.", 6_750_000, "Sofía Vargas", 2),
  testCase("Mobiliario para nueva sede", "Compra de escritorios y sillas ergonómicas para la apertura de la nueva sede.", 32_400_000, "Julián Méndez", 0),
  testCase("Capacitación en ciberseguridad", "Programa de formación especializada para los equipos de tecnología y operaciones.", 11_800_000, "Paola Jiménez", 1),
  testCase("Servidores para ambiente de pruebas", "Adquisición de servidores destinados a integración continua y pruebas de carga.", 45_900_000, "Ricardo Peña", 2),
  testCase("Renovación de antivirus", "Renovación de licencias corporativas de protección para estaciones de trabajo.", 14_250_000, "Alejandra Ruiz", 0),
  testCase("Campaña de lanzamiento regional", "Contratación de medios y producción de piezas para el lanzamiento regional.", 27_600_000, "Mateo Silva", 1),
  testCase("Equipos para sala de videoconferencia", "Compra de cámaras, micrófonos y pantallas para la sala principal.", 16_300_000, "Lucía Cárdenas", 2),
  testCase("Consultoría de arquitectura cloud", "Acompañamiento experto para revisar la arquitectura y el plan de optimización cloud.", 38_000_000, "Santiago León", 0),
  testCase("Suscripción a plataforma de analítica", "Suscripción anual para análisis de producto y comportamiento de usuarios.", 21_500_000, "Isabella Cruz", 1),
  testCase("Dotación de elementos de seguridad", "Adquisición de elementos de protección personal para el equipo de mantenimiento.", 7_850_000, "Tomás Molina", 2),
  testCase("Servicio de traducción técnica", "Traducción al inglés y portugués de manuales técnicos y material de soporte.", 5_480_000, "Gabriela Ortiz", 0),
  testCase("Renovación de certificados digitales", "Compra y renovación de certificados para portales y servicios internos.", 4_900_000, "Nicolás Pardo", 1),
  testCase("Auditoría financiera externa", "Contratación de la auditoría financiera independiente del cierre anual.", 29_700_000, "Martina Reyes", 2),
  testCase("Material promocional para feria", "Producción de material impreso y artículos promocionales para feria empresarial.", 8_320_000, "Emiliano Acosta", 0),
  testCase("Actualización de red inalámbrica", "Renovación de puntos de acceso y controladores de la red de oficinas.", 41_250_000, "Sara Guerrero", 1),
  testCase("Programa de bienestar laboral", "Actividades trimestrales de bienestar físico y emocional para colaboradores.", 13_600_000, "Samuel Arias", 2),
  testCase("Dispositivos móviles para ventas", "Compra de tabletas con accesorios para el equipo comercial de campo.", 24_900_000, "Manuela Lozano", 0),
  testCase("Mantenimiento preventivo de ascensores", "Contrato semestral de inspección y mantenimiento para los ascensores de la sede.", 10_450_000, "Jerónimo Soto", 1),
  testCase("Investigación de mercado", "Estudio cuantitativo y cualitativo para evaluar una nueva línea de servicios.", 19_800_000, "Antonella Vega", 2),
  testCase("Renovación de impresoras", "Sustitución de impresoras obsoletas por equipos multifuncionales eficientes.", 17_750_000, "David Cabrera", 0),
  testCase("Licencias de gestión de proyectos", "Compra anual de licencias para planificación y seguimiento de proyectos.", 12_240_000, "Elena Fuentes", 1),
  testCase("Adecuación del centro de datos", "Mejoras eléctricas y de refrigeración para el centro de datos principal.", 52_600_000, "Martín Salazar", 2),
  testCase("Servicio de mensajería empresarial", "Contrato anual de recolección y entrega de documentos entre sedes.", 9_960_000, "Valeria Campos", 0),
  testCase("Equipamiento para laboratorio QA", "Compra de dispositivos y accesorios para pruebas de compatibilidad.", 22_380_000, "Juan Pablo Ríos", 1),
  testCase("Producción de videos de capacitación", "Producción audiovisual de módulos de inducción para nuevos colaboradores.", 15_700_000, "Emma Navarro", 2),
  testCase("Soporte premium de base de datos", "Renovación del soporte especializado para la plataforma de base de datos.", 34_100_000, "Benjamín Ospina", 0),
  testCase("Papelería corporativa sostenible", "Compra semestral de suministros de oficina fabricados con materiales reciclados.", 3_850_000, "Victoria Beltrán", 1),
  testCase("Evaluación de riesgos operativos", "Consultoría para actualizar la matriz y los controles de riesgos operativos.", 26_450_000, "Lucas Valencia", 2),
];

export function getRandomPurchaseRequestTestData(previous?: PurchaseRequestTestData, random: () => number = Math.random): PurchaseRequestTestData {
  const candidates = previous && PURCHASE_REQUEST_TEST_DATA.length > 1
    ? PURCHASE_REQUEST_TEST_DATA.filter((item) => item !== previous)
    : PURCHASE_REQUEST_TEST_DATA;
  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  const selected = candidates[index];
  if (!selected) throw new Error("Purchase request test data bank is empty.");
  return selected;
}

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { User } from '../users/user.entity';

const DEMO_USERS: Partial<User>[] = [
  { username: 'cliente', name: 'Carlos Cliente', role: 'cliente' },
  {
    username: 'trabajador',
    name: 'Tomás Trabajador',
    role: 'trabajador',
    especialidad: 'plomeria',
    especialidadesExtra: ['albanileria'],
    experiencia: 8,
    descripcionProfesional:
      'Plomero con más de 8 años de experiencia en remodelaciones residenciales. Trabajo limpio, puntual y con garantía.',
    zonasCobertura: ['Manga', 'Bocagrande', 'Centro Histórico'],
    calificacion: 4.8,
    trabajosCompletados: 42,
    verificado: true,
  },
  {
    username: 'trabajador2',
    name: 'Laura Martínez',
    role: 'trabajador',
    especialidad: 'electricidad',
    especialidadesExtra: ['yeso'],
    experiencia: 5,
    descripcionProfesional:
      'Electricista certificada, especialista en instalaciones residenciales y tableros eléctricos. Materiales incluidos en cada cotización.',
    zonasCobertura: ['Crespo', 'Getsemaní', 'Pie de la Popa'],
    calificacion: 4.5,
    trabajosCompletados: 23,
    verificado: true,
  },
  { username: 'admin', name: 'Admin ObraRed', role: 'admin' },
];

async function seed() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(User);
  const passwordHash = await bcrypt.hash('obrared1', 10);

  for (const data of DEMO_USERS) {
    const existing = await repo.findOne({ where: { username: data.username } });
    if (existing) {
      console.log(`Ya existe: ${data.username}`);
      continue;
    }
    const user = repo.create({ ...data, passwordHash });
    await repo.save(user);
    console.log(`Creado: ${data.username}`);
  }

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

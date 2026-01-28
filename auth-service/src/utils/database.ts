import { DataSource } from 'typeorm';
import { Usuario, Rol } from '../entities';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'logiflow_auth',
  synchronize: true,
  logging: process.env.NODE_ENV === 'development',
  entities: [Usuario, Rol],
  migrations: [],
  subscribers: []
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Base de datos auth-service conectada correctamente');

    // Crear roles por defecto si no existen
    const rolRepository = AppDataSource.getRepository(Rol);
    const roles = ['ROLE_CLIENTE', 'ROLE_REPARTIDOR', 'ROLE_SUPERVISOR', 'ROLE_GERENTE', 'ROLE_ADMIN'];

    for (const rolNombre of roles) {
      const exists = await rolRepository.findOne({ where: { nombre: rolNombre as any } });
      if (!exists) {
        const rol = rolRepository.create({ nombre: rolNombre as any });
        await rolRepository.save(rol);
        console.log(`Rol ${rolNombre} creado`);
      }
    }
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error);
    throw error;
  }
};

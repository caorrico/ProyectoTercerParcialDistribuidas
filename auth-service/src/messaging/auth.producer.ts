import { getChannel } from './rabbitmq.config';

const EXCHANGE_NAME = 'logiflow.events';

export interface UsuarioEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  microservice: string;
  data: {
    usuarioId: string;
    username: string;
    email: string;
    roles: string[];
    zonaId?: string;
  };
}

export const publishUsuarioCreado = async (usuario: {
  id: string;
  username: string;
  email: string;
  roles: string[];
  zonaId?: string;
}): Promise<void> => {
  const channel = getChannel();
  
  if (!channel) {
    console.warn('⚠️  RabbitMQ no disponible (channel undefined), evento usuario.creado no publicado');
    return;
  }

  const event: UsuarioEvent = {
    eventId: `usuario-${usuario.id}-${Date.now()}`,
    eventType: 'usuario.creado',
    timestamp: new Date().toISOString(),
    microservice: 'auth-service',
    data: {
      usuarioId: usuario.id.toString(),
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles,
      zonaId: usuario.zonaId
    }
  };

  const routingKey = 'usuario.creado';

  try {
    console.log(`📤 Publicando evento: ${routingKey} (usuario: ${usuario.username})`);
    
    const published = channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    if (published) {
      console.log(`✅ Evento publicado exitosamente: ${routingKey} - ${event.eventId}`);
    } else {
      console.warn(`⚠️  Buffer lleno, evento en cola pero no publicado: ${routingKey}`);
    }
  } catch (error) {
    console.error('❌ Error publicando evento de usuario:', error);
  }
};

export const publishUsuarioDesactivado = async (usuario: {
  id: string;
  username: string;
  email: string;
  roles: string[];
}): Promise<void> => {
  const channel = getChannel();
  
  if (!channel) {
    console.warn('RabbitMQ no disponible, evento no publicado');
    return;
  }

  const event: UsuarioEvent = {
    eventId: `usuario-${usuario.id}-${Date.now()}`,
    eventType: 'usuario.desactivado',
    timestamp: new Date().toISOString(),
    microservice: 'auth-service',
    data: {
      usuarioId: usuario.id.toString(),
      username: usuario.username,
      email: usuario.email,
      roles: usuario.roles
    }
  };

  const routingKey = 'usuario.desactivado';

  try {
    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log(`Evento publicado: ${routingKey}`, event.eventId);
  } catch (error) {
    console.error('Error publicando evento de usuario:', error);
  }
};

export const publishUsuarioActualizado = async (usuario: {
  id: string;
  username: string;
  email: string;
}): Promise<void> => {
  const channel = getChannel();
  
  if (!channel) {
    console.warn('RabbitMQ no disponible, evento no publicado');
    return;
  }

  const event: UsuarioEvent = {
    eventId: `usuario-${usuario.id}-${Date.now()}`,
    eventType: 'usuario.actualizado',
    timestamp: new Date().toISOString(),
    microservice: 'auth-service',
    data: {
      usuarioId: usuario.id.toString(),
      username: usuario.username,
      email: usuario.email,
      roles: []
    }
  };

  const routingKey = 'usuario.actualizado';

  try {
    channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true }
    );

    console.log(`Evento publicado: ${routingKey}`, event.eventId);
  } catch (error) {
    console.error('Error publicando evento de usuario:', error);
  }
};

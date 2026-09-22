import { sampleMonthDays, type Day } from '@trustcab/core';

// Dados de exemplo do app do passageiro, só para desenhar as telas. Quando o app for ligado ao backend, isto sai.
// A passageira é a Ana Souza, a mesma do app do motorista: as viagens com o Carlos são as mesmas dos dois lados.
// No MVP, cada passageiro tem um motorista só.

export const me = { name: 'Ana Souza', firstName: 'Ana' };

export type Vehicle = { model: string; color: string; plate: string };

export type Driver = {
  id: string;
  name: string;
  phone: string;
  vehicle: Vehicle;
  // Chave Pix para pagar (a mesma que vai nas cobranças).
  pix: { label: string; key: string };
  // Desde quando você está na rede desta pessoa.
  since: Date;
};

export function sampleDriver(now: Date): Driver {
  return {
    id: 'carlos',
    name: 'Carlos Mendes',
    phone: '11912345678',
    vehicle: { model: 'Onix', color: 'prata', plate: 'FTR4E21' },
    pix: { label: 'E-mail', key: 'carlos.mendes@email.com' },
    since: new Date(now.getFullYear(), now.getMonth() - 6, 24),
  };
}

// Convite de exemplo para testar a entrada por código depois de sair da rede do Carlos.
export function sampleInvites(now: Date): Record<string, Driver> {
  return {
    joao23: {
      id: 'joao',
      name: 'João Pereira',
      phone: '11934567890',
      vehicle: { model: 'Corolla', color: 'preto', plate: 'KJH7C12' },
      pix: { label: 'CPF', key: '321.654.987-00' },
      since: now,
    },
  };
}

// Viagens da Ana num mês: as mesmas do app do Carlos.
export function sampleTrips(month: Date, now: Date): Day[] {
  const driver = sampleDriver(now);
  return sampleMonthDays(month, now).map((day) => ({
    date: day.date,
    trips: day.trips.filter((trip) => trip.passenger === me.name).map((trip) => ({ ...trip, driver: driver.name })),
  }));
}

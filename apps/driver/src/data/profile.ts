import AsyncStorage from '@react-native-async-storage/async-storage';

import { setPix as remoteSetPix, setVehicle as remoteSetVehicle } from '@trustcab/core/db';

import type { Plan } from './plan';
import { inviteShortUrl, TERMS_VERSION } from '@trustcab/core';
import { randomUUID } from 'expo-crypto';
import { useSyncExternalStore } from 'react';

// Dados do motorista: chave Pix, veículo, link de convite e preferências de notificação.
// Vira escrita no Firestore quando o app for ligado ao backend.

export type PixType = 'cpf' | 'phone' | 'email' | 'random';
export type Vehicle = { model: string; color: string; plate: string };

// O que avisa o motorista. "local" sai do próprio celular (não precisa de internet); "push" vem do servidor.
export const NOTIFICATIONS = {
  tripReminder: {
    title: 'Hora de sair',
    text: 'Quando libera o "Estou a caminho", 1 hora antes da viagem.',
    source: 'local',
  },
  forgottenTrip: {
    title: 'Viagem sem conclusão',
    text: 'Se uma viagem passou do horário e você não concluiu.',
    source: 'local',
  },
  tripRequest: {
    title: 'Pedidos de viagem',
    text: 'Quando um passageiro pede uma viagem para você aprovar.',
    source: 'push',
  },
  tripCancelled: {
    title: 'Viagem cancelada pelo passageiro',
    text: 'Para você não sair à toa.',
    source: 'push',
  },
  message: {
    title: 'Mensagens',
    text: 'Quando um passageiro escreve no chat.',
    source: 'push',
  },
  inviteAccepted: {
    title: 'Convite aceito',
    text: 'Quando alguém entra na sua rede pelo seu link.',
    source: 'push',
  },
} as const;

export type NotificationKind = keyof typeof NOTIFICATIONS;

export type Profile = {
  pix: { type: PixType; key: string } | null;
  vehicle: Vehicle | null;
  // Já passou pelo primeiro acesso (preenchendo ou pulando).
  onboarded: boolean;
  // Qual versão dos termos a pessoa aceitou ao entrar, e quando. É o que prova o aceite depois.
  termsVersion: number | null;
  termsAcceptedAt: string | null;
  notifications: Record<NotificationKind, boolean>;
  // Parte final do link de convite. Gerar um novo invalida o anterior.
  inviteToken: string;
  // Plano da conta: grátis (até três passageiros) ou pago (sem limite).
  plan: Plan;
};

// Mesmo formato do token que o servidor gera: 8 caracteres, sem letras e números fáceis de confundir.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function newToken() {
  return Array.from(randomUUID().replace(/-/g, '').slice(0, 8), (c) => ALPHABET[parseInt(c, 16) % ALPHABET.length]).join('');
}

const initial: Profile = {
  pix: null,
  vehicle: null,
  onboarded: false,
  termsVersion: null,
  termsAcceptedAt: null,
  notifications: Object.fromEntries(Object.keys(NOTIFICATIONS).map((kind) => [kind, true])) as Profile['notifications'],
  inviteToken: newToken(),
  plan: 'free',
};

// O perfil é a única coisa que precisa sobreviver a fechar o app: sem ele, a sessão do
// Google volta logada (o Firebase guarda a dela no AsyncStorage) mas o "onboarded" volta
// falso, e o primeiro acesso recomeça do zero a cada abertura.
const CHAVE = 'trustcab.driver.profile';

let profile: Profile = initial;
const listeners = new Set<() => void>();
// Até a leitura do disco terminar, ninguém pode gravar por cima do que está salvo.
let carregado = false;

AsyncStorage.getItem(CHAVE)
  .then((bruto) => {
    // Campos novos de versões futuras entram pelo "initial"; o que estava salvo manda no resto.
    if (bruto) emit({ ...initial, ...(JSON.parse(bruto) as Partial<Profile>) });
  })
  .catch(() => {})
  .finally(() => {
    carregado = true;
  });

function emit(next: Profile) {
  profile = next;
  listeners.forEach((listener) => listener());
  if (carregado) AsyncStorage.setItem(CHAVE, JSON.stringify(next)).catch(() => {});
}

// Quem está logado agora. O layout do app avisa quando a sessão muda. Com uid, carro e Pix
// moram no Firestore — é de lá que a Function onUserUpdated os espalha para os passageiros
// conectados. Sem uid (sessão de desenvolvimento, sem conta) tudo fica local, como antes.
let uid: string | null = null;

export function setCurrentUid(next: string | null) {
  uid = next;
}

export function setPix(pix: Profile['pix']) {
  emit({ ...profile, pix });
  if (uid) remoteSetPix(uid, pix).catch(() => {});
}

export function setVehicle(vehicle: Vehicle | null) {
  emit({ ...profile, vehicle });
  if (uid) remoteSetVehicle(uid, vehicle).catch(() => {});
}

// O que vem do banco manda: é o mesmo dado que o passageiro está vendo.
export function mergeRemote(remote: { vehicle: Vehicle | null; pix: Profile['pix'] } | null) {
  if (!remote) return;
  if (JSON.stringify(remote.vehicle) === JSON.stringify(profile.vehicle) && JSON.stringify(remote.pix) === JSON.stringify(profile.pix)) return;
  emit({ ...profile, vehicle: remote.vehicle, pix: remote.pix });
}

export function acceptTerms() {
  emit({ ...profile, termsVersion: TERMS_VERSION, termsAcceptedAt: new Date().toISOString() });
}

export function finishOnboarding() {
  emit({ ...profile, onboarded: true });
}

export function setNotification(kind: NotificationKind, on: boolean) {
  emit({ ...profile, notifications: { ...profile.notifications, [kind]: on } });
}

// Link novo: o anterior para de funcionar para quem ainda não entrou.
export function renewInviteLink() {
  emit({ ...profile, inviteToken: newToken() });
}


// Excluir conta ou sair: o próximo acesso começa do zero.
export function resetProfile() {
  emit({ ...initial, inviteToken: newToken() });
}

// Carro e Pix são obrigatórios para começar qualquer viagem.
export function missingSetup(current: Profile) {
  return { vehicle: !current.vehicle, pix: !current.pix, any: !current.vehicle || !current.pix };
}

export function getProfile() {
  return profile;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProfile() {
  return useSyncExternalStore(
    subscribe,
    () => profile,
    () => profile,
  );
}

export const PIX_TYPES: Record<PixType, { label: string; placeholder: string }> = {
  cpf: { label: 'CPF', placeholder: '000.000.000-00' },
  phone: { label: 'Celular', placeholder: '(11) 98765-4321' },
  email: { label: 'E-mail', placeholder: 'voce@email.com' },
  random: { label: 'Aleatória', placeholder: 'Cole a chave que o banco gerou' },
};

// Confere o formato da chave e diz o que corrigir. null = chave válida.
export function pixError(type: PixType, key: string) {
  const value = key.trim();
  const digits = value.replace(/\D/g, '');
  if (!value) return 'Escreva sua chave Pix.';
  if (type === 'cpf' && digits.length !== 11) return 'O CPF tem 11 números. Confira e tente de novo.';
  if (type === 'phone' && (digits.length < 10 || digits.length > 11)) return 'Use DDD + celular, como (11) 98765-4321.';
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Confira o e-mail: falta o @ ou o domínio.';
  if (type === 'random' && value.replace(/-/g, '').length !== 32) return 'A chave aleatória tem 32 letras e números. Copie de novo do app do banco.';
  return null;
}

export function formatCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Placa antiga (ABC-1234) ou Mercosul (ABC1D23).
export function plateError(plate: string) {
  const value = plate.replace(/[\s-]/g, '').toUpperCase();
  if (!value) return 'Escreva a placa.';
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(value)) return 'Use o formato ABC-1234 ou ABC1D23.';
  return null;
}

// Texto do convite que sai pelo WhatsApp.
export function inviteMessage(firstName: string, driverName: string, token: string) {
  return `Oi, ${firstName || '…'}! Sou ${driverName} e agora organizo minhas corridas pelo TrustCab. Entre pelo meu link para marcar suas viagens comigo: ${inviteShortUrl(token)}`;
}

// Assinar ou voltar para o grátis. Com a cobrança real, quem chama isto é a confirmação da loja.
export function setPlan(plan: Plan) {
  emit({ ...profile, plan });
}

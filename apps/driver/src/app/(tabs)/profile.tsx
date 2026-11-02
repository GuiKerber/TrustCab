import { router } from 'expo-router';

import { bookingShortUrl, daysOfAccess, formatPhone, priceLabel, todayISO, weekdayList } from '@trustcab/core';
import { ListGroup, ListRow, PageHeader, ScrollScreen } from '@trustcab/ui';

import { TopBar } from '@/components/TopBar';
import { useDriver } from '@/data/driver';
import { PIX_TYPES, useProfile } from '@/data/profile';
import { driver } from '@trustcab/core';
import { useAuth } from '@trustcab/core/auth';

// Perfil: quem você é, como recebe (Pix), o carro que aparece na sua página e o link de agenda.
export default function Profile() {
  const { user, devSession } = useAuth();
  const profile = useProfile();
  const { phone, slug, slots, plan, open } = useDriver();
  const name = user?.displayName ?? driver.firstName;
  const restam = daysOfAccess(plan, todayISO());

  return (
    <ScrollScreen>
      <TopBar title="Perfil" />

      <PageHeader title={name} meta={devSession ? 'Sessão de desenvolvimento, sem conta Google.' : (user?.email ?? '')} />

      <ListGroup label="Recebimento">
        <ListRow
          icon="qr_code_2"
          title="Chave Pix"
          value={profile.pix ? `${PIX_TYPES[profile.pix.type].label} · ${profile.pix.key}` : 'Crie para cobrar e mostrar o QR Code'}
          pending={!profile.pix}
          onPress={() => router.push('/pix')}
        />
      </ListGroup>

      <ListGroup label="Carro">
        <ListRow
          icon="directions_car"
          title="Veículo"
          value={profile.vehicle ? `${profile.vehicle.model} ${profile.vehicle.color} · ${profile.vehicle.plate}` : 'Adicione: aparece no aviso "Cheguei"'}
          pending={!profile.vehicle}
          onPress={() => router.push('/vehicle')}
        />
      </ListGroup>

      <ListGroup label="Sua agenda">
        <ListRow
          icon="chat"
          title="Seu WhatsApp"
          value={phone ? formatPhone(phone) : 'Cadastre: é por ele que o passageiro fala com você'}
          pending={!phone}
          onPress={() => router.push('/phone')}
        />
        <ListRow
          icon="link"
          title="Seu link"
          value={slug ? bookingShortUrl(slug) : 'Gere o link que você manda no WhatsApp'}
          pending={!slug}
          onPress={() => router.push('/link')}
          accessibilityHint="Abre o link para compartilhar ou gerar outro"
        />
        <ListRow
          icon="schedule"
          title="Horários"
          value={`${weekdayList(slots.weekdays)} · ${slots.from} às ${slots.to}`}
          onPress={() => router.push('/hours')}
          accessibilityHint="Define o que aparece para quem abre seu link"
        />
      </ListGroup>

      <ListGroup label="Conta">
        <ListRow
          icon="workspace_premium"
          title="Plano"
          value={
            plan.status === 'active'
              ? `Assinatura ativa · ${priceLabel()} por mês`
              : !open
                ? 'Mês grátis encerrado · seu link não recebe pedidos'
                : restam === 1
                  ? 'Seu mês grátis acaba hoje'
                  : `Mês grátis · ${restam} dias`
          }
          pending={!open}
          onPress={() => router.push('/plan')}
          accessibilityHint="Abre os planos"
        />
        <ListRow
          icon="settings"
          title="Configurações"
          value="Notificações, sair e excluir conta"
          onPress={() => router.push('/settings')}
        />
      </ListGroup>
    </ScrollScreen>
  );
}

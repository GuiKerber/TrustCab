import { Redirect, useLocalSearchParams } from 'expo-router';

// Link de convite (trustcab.app/i/<código>): abre o convite com o código já preenchido.
export default function InviteLink() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <Redirect href={{ pathname: '/join', params: { code: token } }} />;
}

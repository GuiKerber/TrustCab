import { Redirect, useLocalSearchParams } from 'expo-router';

// Link direto para uma viagem (notificação ou link externo): abre a Home no dia dela, com a folha aberta.
export default function TripLink() {
  const { id, day } = useLocalSearchParams<{ id: string; day?: string }>();
  return <Redirect href={{ pathname: '/', params: { trip: id, ...(day ? { day } : {}) } }} />;
}

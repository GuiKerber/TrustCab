import { useLoginProps } from '@trustcab/core/auth';
import { LoginScreen } from '@trustcab/ui';

import { acceptTerms } from '@/data/profile';

// Login do motorista: marca, uma frase e o botão do Google.
export default function Login() {
  return <LoginScreen brand="TrustCab Driver" headline={['Dirija para', 'quem você', 'conhece.']} {...useLoginProps({ onAccept: acceptTerms })} />;
}

import { useLoginProps } from '@trustcab/core/auth';
import { LoginScreen } from '@trustcab/ui';

// Login do motorista: marca, uma frase e uma única ação em texto.
export default function Login() {
  return <LoginScreen brand="TrustCab Driver" headline={['Dirija para', 'quem você', 'conhece.']} {...useLoginProps()} />;
}

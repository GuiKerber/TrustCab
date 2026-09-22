import { useLoginProps } from '@trustcab/core/auth';
import { LoginScreen } from '@trustcab/ui';

// Login do passageiro: o mesmo do motorista, com a frase de quem é levado.
export default function Login() {
  return <LoginScreen brand="TrustCab" headline={['Vá com', 'quem você', 'conhece.']} {...useLoginProps()} />;
}

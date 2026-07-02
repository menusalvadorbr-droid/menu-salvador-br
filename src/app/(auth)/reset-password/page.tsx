import { redirect } from 'next/navigation'

/**
 * O link de recuperação de senha (resetPasswordForEmail) aponta para
 * /reset-password. Para não duplicar a lógica de "definir nova senha",
 * essa rota apenas redireciona para a página unificada /definir-senha,
 * que também é usada no fluxo de convite de funcionário.
 */
export default function ResetPasswordPage() {
  redirect('/definir-senha')
}

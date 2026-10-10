"use client";

import { useActionState } from "react";
import { changePassword } from "@/app/actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="atual">Senha atual</label>
        <input id="atual" name="atual" type="password" className="input" autoComplete="current-password" required />
      </div>
      <div className="field">
        <label htmlFor="nova">Nova senha</label>
        <input id="nova" name="nova" type="password" className="input" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="field">
        <label htmlFor="confirmacao">Confirmar nova senha</label>
        <input id="confirmacao" name="confirmacao" type="password" className="input" autoComplete="new-password" minLength={8} required />
      </div>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="form-ok" role="status">{state.ok}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Salvando…" : "Salvar nova senha"}</button>
    </form>
  );
}

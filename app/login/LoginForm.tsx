"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action}>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" className="input" autoComplete="current-password" autoFocus required />
      </div>
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" style={{ width: "100%", height: 42 }} disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

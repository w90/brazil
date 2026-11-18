import { useState, type ChangeEvent, type FormEvent } from "react";

interface Props {
  onUnlock: (password: string) => boolean;
}

export const AccessGate = (props: Props) => {
  const { onUnlock } = props;
  const [password, setPassword] = useState("");
  const [isRejected, setIsRejected] = useState(false);

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    setIsRejected(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isAccepted = onUnlock(password);
    if (isAccepted) {
      return;
    }

    setIsRejected(true);
  }

  return (
    <main className="gate">
      <form className="gate__card" onSubmit={handleSubmit}>
        <h1>Wejście</h1>
        <label className="gate__field">
          <span>Hasło</span>
          <input type="password" value={password} onChange={handlePasswordChange} autoComplete="current-password" />
        </label>
        <button type="submit">Wejdź</button>
        {isRejected ? <p className="gate__error">Złe hasło.</p> : null}
      </form>
    </main>
  );
};

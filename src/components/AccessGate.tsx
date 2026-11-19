import { useState, type ChangeEvent, type FormEvent } from "react";

interface Props {
  onUnlock: (name: string) => boolean;
}

export const AccessGate = (props: Props) => {
  const { onUnlock } = props;
  const [name, setName] = useState("");
  const [isRejected, setIsRejected] = useState(false);

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value.toLowerCase());
    setIsRejected(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isAccepted = onUnlock(name);
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
          <span>Imię</span>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            autoComplete="given-name"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>
        <button type="submit">Wejdź</button>
        {isRejected ? <p className="gate__error">Nie znam tego imienia.</p> : null}
      </form>
    </main>
  );
};

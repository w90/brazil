import { useState, type ChangeEvent, type FormEvent } from "react";

interface Props {
  onImport: (pageUrl: string) => Promise<string>;
}

export const AddListingForm = (props: Props) => {
  const { onImport } = props;
  const [pageUrl, setPageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleUrlChange(event: ChangeEvent<HTMLInputElement>) {
    setPageUrl(event.target.value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const result = await onImport(pageUrl);
      setMessage(result);
      setPageUrl("");
    } catch (error) {
      const isError = error instanceof Error;
      setMessage(isError ? error.message : "Nie udało się dodać ogłoszenia.");
    }

    setIsSubmitting(false);
  }

  return (
    <form className="add-listing" onSubmit={handleSubmit}>
      <label className="filters__field filters__field--search">
        <span>Link OLX</span>
        <input
          value={pageUrl}
          onChange={handleUrlChange}
          placeholder="https://rj.olx.com.br/..."
          inputMode="url"
        />
      </label>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Dodaję…" : "DODAJ Ogłoszenie"}
      </button>
      {message ? <p className="add-listing__message">{message}</p> : null}
    </form>
  );
};

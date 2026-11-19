import { useEffect, useRef, useState } from "react";
import { subscribeSaveNotice } from "../domain/saveNotice";

export const SaveNotice = () => {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(function listenForSaves() {
    function handleSaved() {
      setIsVisible(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(function hideNotice() {
        setIsVisible(false);
      }, 1800);
    }

    return subscribeSaveNotice(handleSaved);
  }, []);

  useEffect(function clearNoticeTimer() {
    return function stopNoticeTimer() {
      if (timerRef.current === null) {
        return;
      }

      window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="save-notice" role="status">
      <span className="save-notice__mark" aria-hidden="true">
        ✓
      </span>
      Zapisano
    </div>
  );
};

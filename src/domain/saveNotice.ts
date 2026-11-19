type SaveNoticeListener = () => void;

const listeners = new Set<SaveNoticeListener>();

export function subscribeSaveNotice(listener: SaveNoticeListener): () => void {
  listeners.add(listener);

  return function unsubscribeFromSaveNotice() {
    listeners.delete(listener);
  };
}

export function notifySaved(): void {
  for (const listener of listeners) {
    listener();
  }
}

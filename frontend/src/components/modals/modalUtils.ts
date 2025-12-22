import React from 'react';

/**
 * Creates a keydown handler for modal Enter key behavior.
 * This handler triggers the provided callback when Enter is pressed,
 * but respects native behavior for interactive elements like textareas, buttons, and links.
 *
 * @param onEnterPress - Callback to invoke when Enter is pressed on non-interactive elements
 * @returns A React keyboard event handler for div elements
 */
export const createModalEnterHandler = (
  onEnterPress: () => void,
): ((event: React.KeyboardEvent<HTMLDivElement>) => void) => {
  return (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      // Don't capture Enter for textareas (they need it for newlines)
      if (event.target instanceof HTMLTextAreaElement) {
        return;
      }
      // Don't capture Enter for buttons - let them handle it natively
      // This ensures that when a button is focused, Enter activates it
      // Exception: If it's a tab that's already selected, capture Enter since
      // pressing Enter on an already-selected tab is a no-op
      if (event.target instanceof HTMLButtonElement) {
        const isTab = event.target.getAttribute('role') === 'tab';
        const isAlreadySelected = event.target.getAttribute('aria-selected') === 'true';
        if (!isTab || !isAlreadySelected) {
          return;
        }
      }
      // Don't capture Enter for links - let them navigate
      if (event.target instanceof HTMLAnchorElement) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onEnterPress();
    }
  };
};

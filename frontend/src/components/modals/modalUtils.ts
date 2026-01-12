import React from 'react';

/**
 * Creates a keydown handler for modal Enter key behavior.
 * This handler triggers the provided callback when Enter is pressed,
 * but respects native behavior for interactive elements like textareas, buttons, links,
 * and dropdown/select menu items.
 *
 * @param onEnterPress - Callback to invoke when Enter is pressed on non-interactive elements
 * @returns A React keyboard event handler for div elements
 */
export const createModalEnterHandler = (
  onEnterPress: () => void,
): React.KeyboardEventHandler<HTMLDivElement> => {
  return (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      const { target } = event;

      // Don't capture Enter for textareas (they need it for newlines)
      if (target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't capture Enter for buttons - let them handle it natively
      // This ensures that when a button is focused, Enter activates it
      // Exception: If it's a tab that's already selected, capture Enter since
      // pressing Enter on an already-selected tab is a no-op
      if (target instanceof HTMLButtonElement) {
        const isTab = target.getAttribute('role') === 'tab';
        const isAlreadySelected = target.getAttribute('aria-selected') === 'true';
        if (!isTab || !isAlreadySelected) {
          return;
        }
      }

      // Don't capture Enter for links - let them navigate
      if (target instanceof HTMLAnchorElement) {
        return;
      }

      // Don't capture Enter for dropdown/select menu items
      // PatternFly Select and Dropdown use these roles for their options
      // Also allow combobox (typeahead selects where focus stays on input)
      if (target instanceof HTMLElement) {
        const role = target.getAttribute('role');
        if (
          role === 'option' ||
          role === 'menuitem' ||
          role === 'menuitemradio' ||
          role === 'combobox'
        ) {
          return;
        }
      }

      event.preventDefault();
      event.stopPropagation();
      onEnterPress();
    }
  };
};

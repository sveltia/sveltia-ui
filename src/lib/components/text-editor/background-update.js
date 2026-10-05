import { SKIP_DOM_SELECTION_TAG } from 'lexical';

/**
 * @import { LexicalEditor, UpdateTag } from 'lexical';
 */

/**
 * Get the tags of an editor update the user didn’t make, such as one that highlights the code once
 * a grammar has loaded. While the focus is elsewhere, the update leaves the DOM selection alone,
 * which would otherwise move the focus back to the editor, taking over what the user types next.
 * @param {LexicalEditor} editor Editor instance.
 * @param {UpdateTag[]} [tags] Other tags of the update.
 * @returns {UpdateTag[]} Tags.
 */
export const getBackgroundUpdateTags = (editor, tags = []) =>
  editor.getRootElement()?.contains(document.activeElement)
    ? tags
    : [...tags, SKIP_DOM_SELECTION_TAG];

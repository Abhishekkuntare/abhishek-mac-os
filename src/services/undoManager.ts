export interface UndoAction {
  label: string;
  undo: () => void;
  redo: () => void;
}

const undoStack: UndoAction[] = [];
const redoStack: UndoAction[] = [];

export const pushUndoAction = (action: UndoAction): void => {
  undoStack.push(action);
  redoStack.length = 0;
};

export const undo = (): string | null => {
  const action = undoStack.pop();
  if (!action) return null;

  try {
    action.undo();
    redoStack.push(action);
    return action.label;
  } catch (error) {
    undoStack.push(action);
    throw error;
  }
};

export const redo = (): string | null => {
  const action = redoStack.pop();
  if (!action) return null;

  try {
    action.redo();
    undoStack.push(action);
    return action.label;
  } catch (error) {
    redoStack.push(action);
    throw error;
  }
};

export const canUndo = (): boolean => undoStack.length > 0;
export const canRedo = (): boolean => redoStack.length > 0;

export const clearUndoHistory = (): void => {
  undoStack.length = 0;
  redoStack.length = 0;
};

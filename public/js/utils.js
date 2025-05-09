export function saveState(layers, undoStack, redoStack) {
  undoStack.push(JSON.parse(JSON.stringify(layers)));
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
}

export function undo(layers, undoStack, redoStack, currentLayer) {
  if (undoStack.length) {
    redoStack.push(JSON.parse(JSON.stringify(layers)));
    layers.length = 0;
    layers.push(...undoStack.pop());
    currentLayer = Math.min(currentLayer, layers.length - 1);
    return currentLayer;
  }
  return currentLayer;
}

export function redo(layers, undoStack, redoStack, currentLayer) {
  if (redoStack.length) {
    undoStack.push(JSON.parse(JSON.stringify(layers)));
    layers.length = 0;
    layers.push(...redoStack.pop());
    currentLayer = Math.min(currentLayer, layers.length - 1);
    return currentLayer;
  }
  return currentLayer;
} 
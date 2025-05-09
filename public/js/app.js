import { Canvas } from './canvas.js';
import { Tools } from './tools.js';
import { Layers } from './layers.js';
import { saveState, undo, redo } from './utils.js';

class App {
  constructor() {
    this.canvas = new Canvas(document.getElementById('canvas'));
    this.tools = new Tools(this.canvas);
    this.layers = new Layers(this.canvas);
    
    // Connect components
    this.canvas.tools = this.tools;
    this.canvas.layers = this.layers;
    this.canvas.saveState = () => saveState(this.layers.layers, this.undoStack, this.redoStack);
    this.canvas.undo = () => {
      this.layers.currentLayer = undo(this.layers.layers, this.undoStack, this.redoStack, this.layers.currentLayer);
      this.layers.renderLayersUI();
      this.canvas.drawAll();
    };
    this.canvas.redo = () => {
      this.layers.currentLayer = redo(this.layers.layers, this.undoStack, this.redoStack, this.layers.currentLayer);
      this.layers.renderLayersUI();
      this.canvas.drawAll();
    };

    // Initialize state
    this.undoStack = [];
    this.redoStack = [];
    this.layers.createLayer();
    this.tools.updateToolUI();

    // Setup save button
    document.getElementById('saveBtn').addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'canvas.png';
      link.href = this.canvas.canvas.toDataURL();
      link.click();
    });

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
}); 
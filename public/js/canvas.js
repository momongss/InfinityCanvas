export class Canvas {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.tools = null;
    this.layers = null;
    this.currentStroke = null;
    this.isDrawing = false;
    this.isPanning = false;
    this.lastX = 0;
    this.lastY = 0;
    this.panStartX = 0;
    this.panStartY = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.zoom = 1;
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoSteps = 50;
    this.setupEventListeners();
    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setupEventListeners() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this));
    this.canvas.addEventListener("pointermove", this.handlePointerMove.bind(this));
    this.canvas.addEventListener("pointerup", this.handlePointerUp.bind(this));
    this.canvas.addEventListener("pointerout", this.handlePointerUp.bind(this));
    this.canvas.addEventListener("wheel", this.handleWheel.bind(this), { passive: false });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
  }

  // 변환된 좌표 얻기 (화면좌표 → 논리좌표)
  toWorld(x, y) {
    return {
      x: (x - this.offsetX) / this.zoom,
      y: (y - this.offsetY) / this.zoom
    };
  }

  // 논리좌표 → 화면좌표
  toScreen(x, y) {
    return {
      x: x * this.zoom + this.offsetX,
      y: y * this.zoom + this.offsetY
    };
  }

  handlePointerDown(e) {
    if (e.button === 2) { // 우클릭 팬 시작
      this.isPanning = true;
      this.panStartX = e.clientX;
      this.panStartY = e.clientY;
      this.startOffsetX = this.offsetX;
      this.startOffsetY = this.offsetY;
      return;
    }
    if (e.button === 0) {
      if (this.tools.currentTool === "text") {
        console.log("[텍스트] 텍스트 도구 선택됨, 입력 위치 클릭");
        // 텍스트 입력창 띄우기
        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const { x, y } = this.toWorld(sx, sy);
        this.showTextInput(x, y);
        return;
      }
      this.isDrawing = true;
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const { x, y } = this.toWorld(sx, sy);
      this.lastX = x;
      this.lastY = y;
      this.currentStroke = {
        tool: this.tools.currentTool,
        color: this.tools.currentTool === "eraser" ? "#ffffff" : this.tools.brushColor,
        size: this.tools.currentSize,
        points: [{ x, y }],
        composite: this.tools.currentTool === "eraser" ? "destination-out" : "source-over"
      };
      this.layers.layers[this.layers.currentLayer].strokes.push(this.currentStroke);
    }
  }

  handlePointerMove(e) {
    if (this.isPanning) {
      // 팬(이동)
      this.offsetX = this.startOffsetX + (e.clientX - this.panStartX);
      this.offsetY = this.startOffsetY + (e.clientY - this.panStartY);
      this.drawAll();
      return;
    }
    if (!this.isDrawing) return;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x, y } = this.toWorld(sx, sy);
    this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.offsetX, this.offsetY);
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.globalCompositeOperation = this.currentStroke.composite;
    this.ctx.strokeStyle = this.currentStroke.color;
    this.ctx.lineWidth = this.tools.currentSize;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.stroke();
    this.ctx.globalCompositeOperation = "source-over";
    this.currentStroke.points.push({ x, y });
    this.lastX = x;
    this.lastY = y;
    if (this.tools.currentTool === "eraser") {
      this.handleMouseMove(e);
    }
  }

  handlePointerUp(e) {
    if (e.button === 2) {
      this.isPanning = false;
      return;
    }
    if (this.isDrawing) {
      this.isDrawing = false;
      this.saveState();
    }
  }

  handleWheel(e) {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wx = (sx - this.offsetX) / this.zoom;
    const wy = (sy - this.offsetY) / this.zoom;
    this.zoom *= scale;
    // 줌 기준점이 고정되도록 offset 보정
    this.offsetX = sx - wx * this.zoom;
    this.offsetY = sy - wy * this.zoom;
    this.drawAll();
  }

  handleMouseMove(e) {
    if (this.tools.currentTool === "eraser") {
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const { x, y } = this.toWorld(sx, sy);
      this.drawAll();
      // 도넛 미리보기 (화면좌표 기준)
      const scr = this.toScreen(x, y);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.beginPath();
      this.ctx.arc(scr.x, scr.y, this.tools.currentSize / 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#000";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(scr.x, scr.y, this.tools.currentSize / 2 - 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  showTextInput(x, y) {
    // 이미 입력창이 있으면 제거
    if (this.textInputEl) {
      this.textInputEl.remove();
    }
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "텍스트 입력...";
    input.style.position = "fixed";
    const scr = this.toScreen(x, y);
    input.style.left = scr.x + "px";
    input.style.top = scr.y + "px";
    input.style.fontSize = this.tools.textFontSize + "px";
    input.style.fontFamily = this.tools.textFontFamily;
    input.style.color = this.tools.textColor;
    input.style.border = "2px solid #007aff";
    input.style.background = "#fff";
    input.style.zIndex = 99999;
    input.style.padding = "4px 8px";
    input.style.minWidth = "60px";
    input.style.outline = "2px solid #007aff";
    input.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
    input.style.display = "block";
    document.body.appendChild(input);
    requestAnimationFrame(() => {
      input.focus();
    });
    this.textInputEl = input;
    console.log("[텍스트] 입력창 생성 at", x, y, input);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (input.value.trim()) {
        this.layers.layers[this.layers.currentLayer].strokes.push({
          tool: "text",
          text: input.value,
          x,
          y,
          color: this.tools.textColor,
          fontSize: this.tools.textFontSize,
          fontFamily: this.tools.textFontFamily
        });
        this.saveState();
        this.drawAll();
        console.log("[텍스트] 입력 완료:", input.value);
      }
      if (this.textInputEl && this.textInputEl.parentNode) {
        this.textInputEl.remove();
      }
      this.textInputEl = null;
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        finish();
      } else if (e.key === "Escape") {
        finish();
        console.log("[텍스트] 입력 취소");
      }
    });
    input.addEventListener("blur", finish);
  }

  drawAll() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(this.zoom, 0, 0, this.zoom, this.offsetX, this.offsetY);
    this.layers.layers.forEach((layer) => {
      if (layer.visible) {
        layer.strokes.forEach((stroke) => {
          if (stroke.tool === "text") {
            this.ctx.globalCompositeOperation = "source-over";
            this.ctx.font = `${stroke.fontSize || 32}px ${stroke.fontFamily || 'sans-serif'}`;
            this.ctx.fillStyle = stroke.color || "#000";
            this.ctx.textBaseline = "top";
            this.ctx.fillText(stroke.text, stroke.x, stroke.y);
            return;
          }
          if (stroke.points.length < 2) return;
          this.ctx.globalCompositeOperation = stroke.composite;
          this.ctx.beginPath();
          this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          this.ctx.strokeStyle = stroke.color;
          this.ctx.lineWidth = stroke.size;
          this.ctx.lineCap = "round";
          this.ctx.lineJoin = "round";
          this.ctx.stroke();
          this.ctx.globalCompositeOperation = "source-over";
        });
      }
    });
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 변환 초기화
  }

  saveState() {
    const state = {
      layers: JSON.parse(JSON.stringify(this.layers.layers)),
      currentLayer: this.layers.currentLayer,
    };

    this.undoStack.push(state);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const currentState = {
      layers: JSON.parse(JSON.stringify(this.layers.layers)),
      currentLayer: this.layers.currentLayer,
    };
    this.redoStack.push(currentState);

    const previousState = this.undoStack.pop();
    this.layers.layers = previousState.layers;
    this.layers.currentLayer = previousState.currentLayer;
    this.drawAll();
    this.layers.renderLayersUI();
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const currentState = {
      layers: JSON.parse(JSON.stringify(this.layers.layers)),
      currentLayer: this.layers.currentLayer,
    };
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop();
    this.layers.layers = nextState.layers;
    this.layers.currentLayer = nextState.currentLayer;
    this.drawAll();
    this.layers.renderLayersUI();
  }
} 
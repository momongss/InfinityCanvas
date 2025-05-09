export class Tools {
  constructor(canvas) {
    this.canvas = canvas;
    this.currentTool = "pen";
    this.brushColor = "#000";
    this.penSize = 4;
    this.eraserSize = 20;
    this.textFontSize = 32;
    this.textColor = "#000";
    this.textFontFamily = "sans-serif";
    this.toolPanel = document.getElementById("toolPanel");
    this.toolPopup = document.getElementById("toolPopup");
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.querySelectorAll(".toolBtn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const t = btn.dataset.tool;
        if (t === "undo") this.canvas.undo();
        else if (t === "redo") this.canvas.redo();
        else {
          this.currentTool = t;
          this.updateToolUI();
          this.showToolPopup(btn);
        }
      })
    );

    document.addEventListener("click", (e) => {
      if (!this.toolPanel.contains(e.target) && !this.toolPopup.contains(e.target))
        this.toolPopup.style.display = "none";
    });
  }

  updateToolUI() {
    document
      .querySelectorAll(".toolBtn")
      .forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.tool === this.currentTool)
      );
  }

  showToolPopup(btn) {
    const r = btn.getBoundingClientRect();
    this.toolPopup.innerHTML = "";
    
    if (this.currentTool === "pen") {
      const colorInp = document.createElement("input");
      colorInp.type = "color";
      colorInp.value = this.brushColor;
      colorInp.addEventListener("input", (e) => (this.brushColor = e.target.value));

      const row = document.createElement("div");
      row.className = "popup-row";
      const sizeInp = document.createElement("input");
      sizeInp.type = "range";
      sizeInp.min = 1;
      sizeInp.max = 50;
      sizeInp.value = this.penSize;
      const numInp = document.createElement("input");
      numInp.type = "number";
      numInp.min = 1;
      numInp.max = 50;
      numInp.value = this.penSize;

      sizeInp.addEventListener("input", (e) => {
        this.penSize = +e.target.value;
        numInp.value = this.penSize;
      });
      numInp.addEventListener("input", (e) => {
        this.penSize = +e.target.value;
        sizeInp.value = this.penSize;
      });

      row.append(sizeInp, numInp);
      this.toolPopup.append(colorInp, row);
    } else if (this.currentTool === "eraser") {
      const row = document.createElement("div");
      row.className = "popup-row";
      
      const sizeInp = document.createElement("input");
      sizeInp.type = "range";
      sizeInp.min = 5;
      sizeInp.max = 100;
      sizeInp.value = this.eraserSize;
      
      const numInp = document.createElement("input");
      numInp.type = "number";
      numInp.min = 5;
      numInp.max = 100;
      numInp.value = this.eraserSize;

      sizeInp.addEventListener("input", (e) => {
        this.eraserSize = +e.target.value;
        numInp.value = this.eraserSize;
      });
      numInp.addEventListener("input", (e) => {
        this.eraserSize = +e.target.value;
        sizeInp.value = this.eraserSize;
      });

      row.append(sizeInp, numInp);
      this.toolPopup.append(row);
    } else if (this.currentTool === "text") {
      const colorInp = document.createElement("input");
      colorInp.type = "color";
      colorInp.value = this.textColor;
      colorInp.addEventListener("input", (e) => (this.textColor = e.target.value));

      const sizeRow = document.createElement("div");
      sizeRow.className = "popup-row";
      const sizeInp = document.createElement("input");
      sizeInp.type = "range";
      sizeInp.min = 10;
      sizeInp.max = 120;
      sizeInp.value = this.textFontSize;
      const numInp = document.createElement("input");
      numInp.type = "number";
      numInp.min = 10;
      numInp.max = 120;
      numInp.value = this.textFontSize;
      sizeInp.addEventListener("input", (e) => {
        this.textFontSize = +e.target.value;
        numInp.value = this.textFontSize;
      });
      numInp.addEventListener("input", (e) => {
        this.textFontSize = +e.target.value;
        sizeInp.value = this.textFontSize;
      });
      sizeRow.append(sizeInp, numInp);

      const fontRow = document.createElement("div");
      fontRow.className = "popup-row";
      const fontSel = document.createElement("select");
      ["sans-serif", "serif", "monospace", "cursive"].forEach(f => {
        const opt = document.createElement("option");
        opt.value = f;
        opt.textContent = f;
        if (f === this.textFontFamily) opt.selected = true;
        fontSel.appendChild(opt);
      });
      fontSel.addEventListener("change", (e) => {
        this.textFontFamily = e.target.value;
      });
      fontRow.append(fontSel);

      this.toolPopup.append(colorInp, sizeRow, fontRow);
    }
    
    this.toolPopup.style.left = r.right + 10 + "px";
    this.toolPopup.style.top = r.top + "px";
    this.toolPopup.style.display = "flex";
  }

  get currentSize() {
    return this.currentTool === "pen" ? this.penSize : this.eraserSize;
  }
} 
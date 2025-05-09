export class Layers {
  constructor(canvas) {
    this.canvas = canvas;
    this.layers = [];
    this.currentLayer = 0;
    this.layerPanel = document.getElementById("layerPanel");
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.getElementById("addLayerBtn").addEventListener("click", () => {
      this.canvas.saveState();
      this.createLayer();
    });
  }

  createLayer() {
    this.layers.push({ strokes: [], visible: true });
    this.currentLayer = this.layers.length - 1;
    this.renderLayersUI();
    this.canvas.drawAll();
  }

  renderLayersUI() {
    const list = document.getElementById("layersList");
    list.innerHTML = "";
    this.layers.forEach((layer, i) => {
      const li = document.createElement("li");
      li.className = "layerItem" + (i === this.currentLayer ? " active" : "");
      li.dataset.index = i;

      const thumb = document.createElement("canvas");
      thumb.width = 52;
      thumb.height = 52;
      thumb.className = "thumbnail";
      const tctx = thumb.getContext("2d");
      tctx.clearRect(0, 0, 52, 52);

      // render thumbnail
      let bounds = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
      };
      layer.strokes.forEach((st) =>
        st.points.forEach((p) => {
          bounds.minX = Math.min(bounds.minX, p[0]);
          bounds.minY = Math.min(bounds.minY, p[1]);
          bounds.maxX = Math.max(bounds.maxX, p[0]);
          bounds.maxY = Math.max(bounds.maxY, p[1]);
        })
      );

      const w = bounds.maxX - bounds.minX || 1,
        h = bounds.maxY - bounds.minY || 1,
        s = Math.min(52 / w, 52 / h);

      layer.strokes.forEach((st) => {
        tctx.beginPath();
        st.points.forEach((p, j) => {
          const x = (p[0] - bounds.minX) * s,
            y = (p[1] - bounds.minY) * s;
          j ? tctx.lineTo(x, y) : tctx.moveTo(x, y);
        });
        tctx.stroke();
      });

      li.appendChild(thumb);

      // visibility & delete
      const vis = document.createElement("button");
      vis.className = "visibilityBtn";
      vis.textContent = "👁";
      vis.style.opacity = layer.visible ? 1 : 0.3;
      vis.addEventListener("click", (e) => {
        e.stopPropagation();
        this.canvas.saveState();
        layer.visible = !layer.visible;
        this.renderLayersUI();
        this.canvas.drawAll();
      });
      li.appendChild(vis);

      if (i === this.currentLayer) {
        const del = document.createElement("button");
        del.className = "deleteBtn";
        del.textContent = "🗑";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          this.canvas.saveState();
          this.layers.splice(i, 1);
          this.currentLayer = Math.max(0, this.currentLayer - 1);
          this.renderLayersUI();
          this.canvas.drawAll();
        });
        li.appendChild(del);
      }

      li.addEventListener("click", () => {
        this.currentLayer = i;
        this.renderLayersUI();
      });

      list.appendChild(li);
    });
  }
} 
let _ne = (t) => document.createElement(t);
let _nes = (t) => document.createElementNS("http://www.w3.org/2000/svg", t);
let _mm = (arr) => {let a = arr.slice(0).sort((a,b)=>a-b); return [a[0], a.pop()];};
class TGraph {
    _id = null;
    _width = 100;
    _height = 100;
    _el = null;
    _svg = null;
    _mainGraph = null;
    _previewGraph = null;
    _yLabels = null;
    _xLabels = null;
    _pheight = 100;
    _aheight = 30;
    _series = null;
    constructor(el, data, preview = true) {
        this._id = Math.round(Math.random() * 1000) + (new Date()).getTime();
        this._el = el;
        let sz = this._el.getBoundingClientRect();
        this._width = sz.width;
        this._height = sz.height - this._pheight;
        this.init();
        this._series = new TSeries(this, data);

        this.draw();
    }

    get _mgHeight() {
        return this._height - this._aheight;
    }

    init() {
        this._svg = _nes('svg');
        this._svg.setAttribute('height', this._height);
        this._el.appendChild(this._svg);

        this._previewGraph = _nes('g');
        let d = _ne('div'), s = _nes('svg');
        d.style['height'] = this._pheight + 'px';
        // d.style['margin-top'] = `10px`;
        d.style['padding-left'] = `10px`;
        d.style['background-color'] = 'rgb(244, 247, 249)';
        s.appendChild(this._previewGraph);
        d.appendChild(s);
        this._el.appendChild(d);

        this._xLabels = _nes('g');
        this._svg.appendChild(this._xLabels);
        this._yLabels = _nes('g');
        this._svg.appendChild(this._yLabels);

        this._mainGraph = _nes('g');
        this._mainGraph.style['transition'] = '0.5s';
        this._svg.appendChild(this._mainGraph);
    }

    draw() {
        let lns = "";
        this._series.lines().map(l => lns += l.toSvg());
        this._mainGraph.innerHTML = lns;
        this._mainGraph.childNodes.forEach(e => e.style['stroke-width'] = 2);
        this._previewGraph.style['transform'] = "scaleY("+(+this._pheight/this._height)+")";
        this._previewGraph.innerHTML = lns;
        this._xLabels.innerHTML = "";
        this._xLabels.appendChild(this._series.xLabels());
        this._yLabels.innerHTML = "";
        this._yLabels.appendChild(this._series.yLabels());
    }

    show(x1, x2) {
        let l = this._series.lines()[0],
            ln = l._data.length,
            st = l._step,
            ttl = this._width / st,
            p0 = st * x1,
            p1 = (x2 ? Math.min(x2, ln) : ln) * st,
            sc = this._width / ((p1-p0) || 1);
        this._mainGraph.style['transform'] = "translateX("+(- p0*sc)+"px) scaleX("+sc+")";
    }
}
class TSeries {
    _graph = null;
    _labelsFormat = 'timestamp:day';
    _labels = [];
    _lines = [];
    _zoom = 1;
    constructor(g, data = {}) {
        this._graph = g;
        if (!TSeries.validateData(data)) return;
        this.load(data);
    };

    yLabels() {
        let g = _nes('g');
        g.innerHTML = '';
        for (let i=this._graph._mgHeight; i >=0; i -= 50) {
            g.innerHTML += `<line x1="0" y1="${i}" x2="${this._graph._width}" y2="${i}" style="stroke:#ddd;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed />`;
        }
        let z = this._lines[0]._zoom;
        for (let i=this._graph._mgHeight - 1, j=0; i >=0; i -= 50, j++) {
            g.innerHTML += `<text x="10" y="${i-10}" style="stroke: #888;stroke-width: 0.1;font-size: 14px;opacity: 0.6;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed>${Math.round(j*50*z)}</text>`;
        }
        return g;
    }

    xLabels() {
        let lw = 80,
            off = 30,
            g = _nes('g'),
            formatter = new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric"
            });
        g.innerHTML = '';
        for (let x=0; x<this._graph._width - 80; x+= lw) {
            let lbl = this._labels[Math.floor(x * this._labels.length / this._graph._width)];
            if (this._labelsFormat === 'timestamp:day') {
                lbl = formatter.format((new Date(+lbl)));
            }
            g.innerHTML += `<text x="${x+off}" y="${this._graph._height - 10}" style="stroke: #888;stroke-width: 0.1;font-size: 14px;opacity: 0.6;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed>${lbl}</text>`;
        }
        return g;
    }

    load(data) {
        let z = 0;
        this._labels = data.columns.find(s => s[0] === data.types.x);
        this._lines = data.columns.filter(s => s[0] !== data.types.x)
            .map((s) => {
                let l = (data.names && data.names[s[0]]) || '',
                    c = (data.colors && data.colors[s[0]]) || 'black',
                    tl = new TLine(this._graph, s[0], l, c, s.slice(1));
                z = z || tl._zoom;
                return tl;
            });
        this._labels.shift();
    }

    lines() {
        return this._lines;
    }

    static validateData(data) {
        if (!data) return false;
        for (let k of ['columns', 'types']) if (!data[k]) return false;
        if (!data.columns.length) return false;
        if (!data.types.x) return false;
        for (let t in data.types) if (!["x", "line"].includes(data.types[t])) return false;

        return true;
    }
}

class TLine {
    _graph;
    _step;
    _name;
    _label;
    _color;
    _data;
    _min;
    _max;
    _zoom = 1;
    constructor(g, n, l, c, d, z = 0) {
        this._graph = g;
        this._name = n; this._label = l; this._color = c;
        [this._min, this._max] = _mm(d);
        this._zoom = z || this._max / this._graph._mgHeight;
        this._data = d.map(e => this._graph._mgHeight - e / this._zoom);
    }

    zoom(z) {
        this._data = d.map(e => this._graph._mgHeight - e * this._zoom / z);
        this._zoom = z;
    }

    toSvg() {
        this._step = this._graph._width / this._data.length;
        let p = [];
        for (let i=1; i < this._data.length; i++) p.push(this._step*(i-1) + "," + this._data[i-1]);
        return `<polyline vector-effect="non-scaling-stroke" points="` + p.join(' ') + `" style="fill:none;stroke:${this._color};stroke-width:1" />`
    }
}
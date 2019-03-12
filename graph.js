let _ne = (t) => document.createElement(t);
let _nes = (t) => document.createElementNS("http://www.w3.org/2000/svg", t);
class TGraph {
    _id = null;
    _width = 100;
    _height = 100;
    _el = null;
    _svg = null;
    _mainGraph = null;
    _series = null;
    constructor(el, data) {
        this._id = Math.round(Math.random() * 1000) + (new Date()).getTime();
        this._el = el;
        let sz = this._el.getBoundingClientRect();
        this._width = sz.width;
        this._height = sz.height;
        this.init();
        this._series = new TSeries(this, data);

        this.draw();
    }

    init() {
        this._svg = _nes('svg');
        this._el.appendChild(this._svg);
        this._mainGraph = _nes('g');
        this._mainGraph.style['transition'] = '0.5s';
        this._svg.appendChild(this._mainGraph);
    }

    draw() {
        this._mainGraph.innerHTML = "";
        this._series.lines().map(l => this._mainGraph.innerHTML += l.toSvg())
    }
    show(x1, x2) {
        let l = this._series.lines()[0],
            ln = l._data.length,
            st = l._step,
            ttl = this._width / st,
            p0 = st * x1,
            p1 = (x2 ? Math.min(x2, ln) : ln) * st,
            sc = this._width / ((p1-p0) || 1);
        this._mainGraph.style['transform'] = "translateX(-"+p0*sc+"px) scaleX("+sc+")";
    }
}
class TSeries {
    _graph = null;
    _lablesFormat = 'timestamp';
    _labels = [];
    _lines = [];
    constructor(g, data = {}) {
        this._graph = g;
        if (!TSeries.validateData(data)) return;
        this.load(data);
    };

    load(data) {
        this._labels = data.columns.find(s => s[0] === data.types.x);
        this._lines = data.columns.filter(s => s[0] !== data.types.x)
            .map((s) => {
                let l = (data.names && data.names[s[0]]) || '',
                    c = (data.colors && data.colors[s[0]]) || 'black';
                return new TLine(this._graph, s[0], l, c, s.slice(1));
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
    constructor(g, n, l, c, d) {
        this._graph = g;
        this._name = n; this._label = l; this._color = c;
        let range = d.slice(0).sort((a,b ) => a-b);
        this._min = range[0];
        this._max = range.pop();
        this._zoom = this._max / this._graph._height;
        this._data = d.map(e => this._graph._height - e / this._zoom);
        console.log(this._data);
    }

    toSvg(step) {
        this._step = step || (this._graph._width / this._data.length);
        let p = [];
        for (let i=1; i < this._data.length; i++) p.push(this._step*(i-1) + "," + this._data[i-1]);
        return `<polyline vector-effect="non-scaling-stroke" points="` + p.join(' ') + `" style="fill:none;stroke:${this._color};stroke-width:1" />`
    }
}
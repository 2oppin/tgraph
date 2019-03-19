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
    _wndL = null;
    _wndR = null;
    _wnd = null;
    _buttons = null;
    _buttonsArr = [];
    _wndBw = 10;
    _wndX = 0;
    _wndW = 100;

    _wndAct = false; // false || [move, left, right]

    constructor(el, data, preview = true) {
        this._id = Math.round(Math.random() * 1000) + (new Date()).getTime();
        this._el = el;
        let sz = this._el.getBoundingClientRect();
        if (!sz.width) return;

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
        s.setAttribute('height', '100');
        d.style['position'] = 'relative';
        d.style['height'] = this._pheight + 'px';
        s.appendChild(this._previewGraph);
        d.appendChild(s);
        this._el.appendChild(d);
        this._wndL = d.cloneNode();
        this._wndL.style['padding-left'] = 0;
        this._wndL.style['position'] = 'absolute';
        this._wndL.style['top'] = '0';
        this._wndL.style['height'] = this._pheight + 'px';
        this._wndL.style['left'] = 0;
        this._wndL.style['width'] = 0;
        this._wndL.style['background-color'] = 'rgba(210, 217, 220, 0.55)';
        d.appendChild(this._wndL);
        this._wndR = this._wndL.cloneNode();
        this._wndR.style['left'] = (this._wndX + this._wndW) + 'px';
        this._wndR.style['width'] = (this._width - this._wndW- this._wndX) + 'px';
        d.appendChild(this._wndR);
        this._wnd = this._wndL.cloneNode();
        this._wnd.style['cursor'] = 'move';
        this._wnd.style['height'] = (this._pheight -6) + 'px';
        this._wnd.style['width'] = this._wndW + 'px';
        this._wnd.style['border'] = 'solid 3px rgba(180, 190, 195, 0.51)';
        this._wnd.style['border-left-width'] = this._wndBw + 'px';
        this._wnd.style['border-right-width'] = this._wndBw + 'px';
        this._wnd.style['border-radius'] = '3px';
        this._wnd.style['background-color'] = 'rgba(227, 237, 243, 0.21)';
        d.appendChild(this._wnd);

        this._mainGraph = _nes('g');
        this._mainGraph.style['transition'] = '0.5s';
        this._svg.appendChild(this._mainGraph);

        this._wndInitEvents();
    }

    draw() {
        let lns = "";
        this._series.lines().map(l => {
            console.log(l.el);
            this._mainGraph.appendChild(l.el);
            this._previewGraph.appendChild(l.el.cloneNode());
            // lns += l.toSvg();
        });
        //this._mainGraph.innerHTML = lns;
        this._mainGraph.childNodes.forEach(e => e.style['stroke-width'] = 2);
        this._previewGraph.style['transform'] = "scaleY("+(+this._pheight/this._height)+")";
        // this._previewGraph.innerHTML = lns;

        this._xLabels = this._series.xLabels();
        this._svg.appendChild(this._xLabels);
        this._yLabels = this._series.yLabels();
        this._svg.appendChild(this._yLabels);

        this._buttons = _ne('div');
        let clk = (l) => (e) => {
            l.toggle();console.log('CLICK ' + l._name);
            e.target.getElementsByTagName('span').item(0).innerHTML = l._enabled ? "&#x2713;" : '';
        };
        for (let l of this._series.lines()) {
            let b = _ne('div');
            b.className = 'btn-graph';
            b.style = 'float: left;padding: 3px;border-radius: 16px;background-color: '+l._color+';margin: 15px;height: 32px;line-height: 32px;text-align: center;min-width: 70px;';
            b.innerHTML = '<span style="pointer-events: none;display:inline-block;width: 22px;height: 22px;font-size:22px;line-height: 22px;background-color: white;border-radius: 11px;margin: 5px;float: left;">&#x2713;</span>' + l._name;
            this._buttons.appendChild(b);
            b.addEventListener('click', clk(l));
        }
        this._el.appendChild(this._buttons);
        /*
        console.log(this._buttons.getElementsByClassName('btn-graph'));
        [].slice.call(this._buttons.getElementsByClassName('btn-graph')).map((el, i) => {
            console.log("Added ~ " + this._series.lines()[i]._name);
            el.addEventListener('click', clk(this._series.lines()[i]));
        });*/
        this.wndUpd(30, 100);
    }


    _wndInitEvents()
    {
        let startPosition    = 0,
            currentPosition  = 0,
            _RAF       = true,
            md = (e) => {
                e.preventDefault();
                currentPosition = this._wndX;
                startPosition   = e.clientX;
                let dx = e.clientX-this._wndX - 2 * this._wndBw;
                this._wnd.style.cursor='col-resize';
                this._wndAct = dx < 0 ? "left" : (dx > (this._wndW) ? "right" : "move");

                this._wnd.style.cursor = this._wndAct === 'move' ? "move" : "col-resize";
            },
            processEvt = (e) => {
                let newPos = (e.clientX - startPosition) + currentPosition;
                if (this._wndAct === 'move') {
                    this._wndX = Math.min(Math.max(0,newPos), this._width - this._wndW - this._wndBw);
                } else if (this._wndAct === 'right') {
                    this._wndW = Math.min(Math.max(0,e.clientX - this._wndX - 2 * this._wndBw), this._width - this._wndBw);
                } else if (this._wndAct === 'left') {
                    this._wndW = Math.min(Math.max(0,this._wndW + (this._wndX - newPos)), this._width - this._wndBw);
                    this._wndX = Math.min(Math.max(0,newPos), this._width - 2 * this._wndBw);
                }
            },
            mm = (e) => {
                e.preventDefault();
                if (_RAF && this._wndAct) {
                    processEvt(e);
                    _RAF =  requestAnimationFrame(() => (_RAF = true) && this.wndUpd()) && false;
                }
            },
            mu = (e) => {
                e.preventDefault();
                this._wnd.style.cursor='pointer';
                this._wndAct = false; // reset mouse is down boolean
            };

        this._wnd.addEventListener("mousedown", md);
        this._wnd.addEventListener('touchstart', md);
        document.addEventListener("mousemove", mm);
        document.addEventListener("mouseup", mu);
        document.addEventListener('touchend', mu);
    }


    wndUpd() {
        //this._wndX = x0;
        //this._wndW = x1 - x0;
        let x1 = this._wndX + this._wndW;
        this._wndL.style['left'] = (0) + 'px';
        this._wndL.style['width'] = this._wndX + this._wndBw + 'px';

        this._wnd.style['left'] = (this._wndX) + 'px';
        this._wnd.style['width'] = (this._wndW ) + 'px';

        this._wndR.style['left'] = (this._wndX + this._wndW + this._wndBw) + 'px';
        this._wndR.style['width'] = (this._width - (this._wndX + this._wndW)) + 'px';
        this.showW(this._wndX + this._wndBw, this._wndW);
    }

    showW(x0, w) {
        let l = this._series.lines()[0],
            ln = l._data.length,
            st = l._step,
            z = ln / this._width;
        let x1 = x0 * z,
            x2 = (x0 + w) * z;
        this.show(x1, x2);
    }

    show(x1, x2) {
        let l = this._series.lines()[0],
            ln = l._data.length,
            st = l._step,
            p0 = st * x1,
            p1 = (x2 ? Math.min(x2, ln) : ln) * st,
            sc = this._width / ((p1-p0) || 1);
        this._mainGraph.style['transform'] = "translateX("+(- p0*sc)+"px) scaleX("+sc+")";
        this.updLabelsX(x1, x2);
    }


    updLabelsX(x0, x1) {
        let minLw = 50,
            normLw = 80,
            l = this._series.lines()[0],
            ln = l._data.length,
            st = l._step,
            p0 = st * x0,
            p1 = (x1 ? Math.min(x1, ln) : ln) * st,
            sc = this._width / ((p1-p0) || 1),
            lw = l._step * sc,
            gX = x0*lw,
            cml = '';
        while(lw * (cml || 1) < minLw || (cml||0)%2) cml = (cml || 1) + 1;
        this._xLabels.style['transform'] = `translateX(${lw-gX}px)`;
        [].slice.call(this._xLabels.getElementsByTagName('text') || [])
            .map((e, i) => {
                e.style['transform'] = `translateX(${lw * i - normLw * i}px)`;
                if (cml && !e.classList.contains('ml' + cml))
                    e.style['opacity'] = 0;
                else
                    e.style['opacity'] = 1;
            })
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
        g.style['transition'] = '0.5s';
        for (let i=this._graph._mgHeight; i >=0; i -= 50) {
            g.innerHTML += `<line x1="0" y1="${i}" x2="${this._graph._width}" y2="${i}" style="stroke:#ddd;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed />`;
        }
        let z = this._lines[0]._zoom;
        for (let i=this._graph._mgHeight - 1, j=0; i >=0; i -= 50, j++) {
            g.innerHTML += `<text x="10" y="${i-10}" style="fill: #888;font-size: 14px;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed>${Math.round(j*50*z)}</text>`;
        }
        return g;
    }

    xLabels() {
        let lw = 80, // this._graph._width *  this._graph._width/ ((this._graph._wndW||1) * this._labels.length),
            off = 30,
            st = this._labels.length / this._graph._width,
            x0 = this._graph._wndX,
            x1 = (this._graph._wndX + this._graph._wndW),
            stl = this._graph._wndW * this._labels.length / (this._graph._width * this._graph._width),
            g = _nes('g'),
            formatter = new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric"
            }),
            oCls = (ln) => {
               let ml = [];
               for(let j=2; j<=ln; j++)
                   if(ln%j === 0) ml.push(j);
               return 'ml' + ml.join(' ml');
            };
        g.style['transition'] = '0.5s';
        for (let x=0; x < this._labels.length; x++) {
            let lbl = this._labels[x], cls = oCls(x);
            if (this._labelsFormat === 'timestamp:day') {
                lbl = formatter.format((new Date(+lbl)));
            }
            g.innerHTML += `<text class="${cls}" text-anchor="middle" x="${x*lw}" y="${this._graph._height - 10}" style="transition: 0.5s;fill: #888;font-size: 14px;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed>${lbl}</text>`;
        }
        /*
        for (let x=0; x<this._graph._width - lw; x+= lw) {
            let xx = x0*st + Math.floor(x * stl);
            console.log(x + " :: " + xx + '/' + this._labels.length);
            let lbl = this._labels[Math.floor(x0*st + x * stl)];
            if (this._labelsFormat === 'timestamp:day') {
                lbl = formatter.format((new Date(+lbl)));
            }
            g.innerHTML += `<text x="${x+off}" y="${this._graph._height - 10}" style="stroke: #888;stroke-width: 0.1;font-size: 14px;opacity: 0.6;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed>${lbl}</text>`;
        }
        */
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
    _el = null;
    _graph;
    _step;
    _name;
    _label;
    _color;
    _data;
    _min;
    _max;
    _enabled = true;
    _zoom = 1;
    _offset = 0;
    constructor(g, n, l, c, d, z = 0) {
        this._graph = g;
        this._name = n; this._label = l; this._color = c;
        [this._min, this._max] = _mm(d);
        this._zoom = z || this._max / this._graph._mgHeight;
        this._data = d.map(e => this._graph._mgHeight - e / this._zoom);
    }

    azoom(x0, x1) {
        let [mn, mx] = _mm(this._data.slice(x0, x1 - x0));
        this._zoom = mx / this._graph._mgHeight;
        this._el.style['transform'] = `translateY(${mn}) scaleY(${1})`;
    }
    zoom(z) {
        let dz = z / this._zoom;
        this._data = d.map(e => this._graph._mgHeight - e * this._zoom / z);
        this._zoom = z;
    }

    toSvg() {
        this._step = this._graph._width / this._data.length;
        let p = [];
        for (let i=0; i < this._data.length; i++) p.push(this._step*i + "," + this._data[i]);
        return `<polyline vector-effect="non-scaling-stroke" points="` + p.join(' ') + `" style="transition: 0.5s;fill:none;stroke:${this._color};stroke-width:1" />`;
    }
    get el() {
        if (this._el) return this._el;

        this._step = this._graph._width / this._data.length;
        let p = [];
        for (let i=0; i < this._data.length; i++) p.push(this._step*i + "," + this._data[i]);
        this._el = _nes('polyline');
        this._el.setAttribute('vector-effect', "non-scaling-stroke");
        this._el.style = `transition: 0.5s;fill:none;stroke:${this._color};stroke-width:1`;
        this._el.setAttribute('points', p.join(' '));
        this._el.style['transform'] = `translateY(${this._min}) scaleY(${this._zoom})`;

        return this._el;// `<polyline vector-effect="non-scaling-stroke" points="` + p.join(' ') + `" style="transition: 0.5s;fill:none;stroke:${this._color};stroke-width:1" />`;
    }


    toggle() {
        this._enabled = !this._enabled;
        this._el.style['opacity'] = this._enabled ? 1 : 0;
    }

}
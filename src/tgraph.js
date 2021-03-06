let _ta = (e) => [].slice.apply(e);
let _et = (e) => e.touches && e.touches.length;
let _ne = (t) => document.createElement(t);
let _nes = (t) => document.createElementNS("http://www.w3.org/2000/svg", t);
let _mm = (arr) => {let a = arr.slice(0).sort((a,b)=>a-b); return [a[0], a.pop()];};
class TGraph {
    constructor(el, data, black = false) {
        this._el = el;
        let sz = this._el.getBoundingClientRect(),
            w = Math.max(sz.width, 200),
            h = Math.max(sz.height, 300);

        this._black = black;
        this._lw = 80;
        this._pheight = 100;
        this._bheight = 100;
        this._aheight = 30;
        this._wndBw = 10;
        this._wndX = -10;
        this._wndW = 100;

        this._showPt = true;
        this._wndAct = false;
        this._el.style.backgroundColor = this._cl[5];
        this._el.style.padding = this._wndBw+"px";
        this._el.style.width = w + "px";
        this._el.style.overflow = 'hidden';
        this._width = w - 2 * this._wndBw;
        this._height = h - this._pheight - this._bheight;
        this._series = new TSeries(this, data);
        this.init();
    }
    setMode(black) {
        this._black = black;
        this._el.style.backgroundColor = this._cl[5];
        [this._wndL, this._wndR].map(e => e.style.backgroundColor = this._cl[0]);
        this._wnd.style.borderColor = this._cl[2];
        this._wnd.style.backgroundColor = this._cl[1];
        this._btDraw();
        this._Pt.style.opacity = 0;
    }
    get _cl() {
        return this._black
            ? ['rgba(85, 92, 101, 0.586)', 'rgba(219, 229, 236, 0.06)', '#ddeaf360', 'rgb(210, 231, 255)', '#e3e3e3', '#242f3e', '#263241', '#fff', '#202b3a', '#304052']
            : ['rgba(221, 230, 243, 0.386)', '#ddeaf329', '#ddeaf3d9', '#9aa6ae', '#e3e3e3', '#fff', '#fff', '#000', '#e3e3e3', '#e7edf1'];
    }
    get _mgHeight() {
        return this._height - this._aheight;
    }

    init() {
        this._svg = _nes('svg');
        this._svg.setAttribute('height', this._height);
        this._svg.setAttribute('width', this._width);
        this._el.appendChild(this._svg);

        this._pvwG = _nes('g');
        let d = _ne('div'), s = _nes('svg');
        s.setAttribute('height', '100');
        d.style['position'] = 'relative';
        d.style['height'] = this._pheight + 'px';
        s.appendChild(this._pvwG);
        d.appendChild(s);
        this._el.appendChild(d);
        this._wndL = d.cloneNode();
        this._wndL.style = `position:absolute;top:0;height:${this._pheight}px;left:0;width:0;background-color:${this._cl[0]};padding-left:0;`;
        d.appendChild(this._wndL);
        this._wndR = this._wndL.cloneNode();
        this._wndR.style['left'] = (this._wndX + this._wndW) + 'px';
        this._wndR.style['width'] = (this._width - this._wndW- this._wndX) + 'px';
        d.appendChild(this._wndR);
        this._wnd = this._wndL.cloneNode();
        this._wnd.style['cursor'] = 'move';
        this._wnd.style['height'] = (this._pheight -6) + 'px';
        this._wnd.style['width'] = this._wndW + 'px';
        this._wnd.style['border'] = 'solid 3px ' + this._cl[2];
        this._wnd.style['background-color'] = this._cl[1];
        this._wnd.style['border-left-width'] = this._wndBw + 'px';
        this._wnd.style['border-right-width'] = this._wndBw + 'px';
        this._wnd.style['border-radius'] = '3px';
        d.appendChild(this._wnd);

        this._G = _nes('g');
        this._G.style['transition'] = '0.5s';

        this._wndInitEvents();

        this._series._lines.map(l => {
            this._G.appendChild(l.el);
            this._pvwG.appendChild(l.el.cloneNode());
        });
        this._G.childNodes.forEach(e => e.style['stroke-width'] = 2);
        this._pvwG.style['transform'] = "scaleY("+(+this._pheight/this._height)+")";

        this._xLabels = this._series.xLabels();
        this._yLabels = this._series.yLabels();

        this._svg.appendChild(this._xLabels);
        this._svg.appendChild(this._yLabels);
        this._svg.appendChild(this._G);

        this._buttons = _ne('div');
        this._btDraw();
        this._el.appendChild(this._buttons);
        this.wndUpd(30, 100);

        if (this._showPt) this._PtDraw();
    }
    _btDraw() {
        this._buttons.innerHTML = "";
        let clk = (l) => (e) => {
            this._Pt.style.opacity = 0;
            l.toggle();
            let s = e.target.getElementsByTagName('span').item(0);
            s.innerHTML = l._enabled ? "&#x2713;" : '';
            s.style.backgroundColor = l._enabled ? l._color : this._cl[5];
            this.wndUpd();
        };
        for (let l of this._series._lines) {
            let b = _ne('div');
            b.className = 'btn-graph';
            b.style = `color:${this._cl[7]};cursor:pointer;float:left;padding:3px;border-radius:17px;border:solid 2px ${this._cl[9]};background-color:${this._cl[6]};margin:15px;height:33px;line-height:33px;text-align:center;min-width:70px;`;
            b.innerHTML = `<span style="pointer-events:none;display:inline-block;width:20px;height:20px;font-size:22px;line-height:22px;background-color:${l._color};border:solid 2px ${l._color};border-radius:11px;color:white;margin:5px;float:left;">&#x2713;</span>${l._label}`;
            this._buttons.appendChild(b);
            b.addEventListener('click', clk(l));
        }
    }


    _PtDraw() {
        this._Pt = _nes("g");
        let ln = _nes("line"),
            grect = _nes("g"),
            rect = _nes("rect"),
            lblX = _nes("text"),
            lblY = [],
            lblYl = [],
            circs = [];
        this._Pt.style.opacity = 0;
        this._Pt.appendChild(ln);
        this._Pt.appendChild(grect);
        this._Pt.appendChild(lblX);
        grect.style = 'transition:0.5s';
        rect.setAttribute("x", "-40px");
        rect.setAttribute("rx", "15px");
        rect.setAttribute("ry", "15px");
        rect.setAttribute("height", "80px");
        rect.setAttribute("vector-effect", "non-scaling-stroke");
        lblX.setAttribute("text-anchor", "middle");
        lblX.setAttribute("y", "25");
        lblX.setAttribute("vector-effect", "non-scaling-stroke");
        lblX.setAttribute("shape-rendering", "optimizeSpeed");
        lblX.innerHTML = "There whould be label";
        grect.appendChild(rect);
        grect.appendChild(lblX);

        ln.style.strokeWidth = "1px";
        ["y1","x1", "x2"].map(a => ln.setAttribute(a,0));
        ln.setAttribute("y2",this._height);
        ln.setAttribute("vector-effect", "non-scaling-stroke");
        this._series._lines.map((l, i) => {
            let c = _nes("circle"),
                lby = _nes("text"),
                [, sc] = this._scp;
            c.setAttribute("r", 4);
            c.setAttribute("vector-effect", "non-scaling-stroke");
            c.style.stroke = l._color;
            this._Pt.appendChild(c);
            circs.push(c);

            lby.setAttribute("x", 80*i);
            lby.setAttribute("y", "45");
            lby.setAttribute("vector-effect", "non-scaling-stroke");
            lby.setAttribute("shape-rendering", "optimizeSpeed");
            lby.setAttribute("text-anchor", "middle");
            lby.setAttribute("dominant-baseline", "middle");
            lby.style = `fill: ${l._color}`;
            grect.appendChild(lby);
            lblY.push(lby);
            let lbyl = lby.cloneNode();
            lbyl.style.fontSize = '12px';
            lbyl.setAttribute("y", "60");
            lbyl.innerHTML = l._label;
            lblYl.push(lbyl);
            grect.appendChild(lbyl);
        });
        let _initC = () => {
            rect.style = `stroke:${this._cl[8]};stroke-width:2px;fill:${this._cl[6]}`;
            ln.style.stroke = this._cl[3];
            lblX.style = `fill:${this._cl[7]}`;
            circs.map(c => c.style.fill = this._cl[5]);
        };
        this._G.appendChild(this._Pt);
        let sp = this._svg.createSVGPoint(),
            _RAF = true,
            pt = (e) => {
                let cli = _et(e) ? e.touches[0] : e;
                sp.x = cli.clientX; sp.y = cli.clientY;
                let [o, z, d] = this._series.ozd,
                    [, sc] = this._scp,
                    p = sp.matrixTransform( this._G.getScreenCTM().inverse()),
                    x = p.x * d,
                    x1 = Math.max(0, Math.floor(x)),
                    x2 = x1 + 1;
                this._Pt.setAttribute("transform", `translate(${p.x} 0) scale(${1/sc} 1)`);
                let ii = 0,
                    Ys = [];
                this._series._lines.map((l, i) => {
                    circs[i].style.opacity = +l._enabled;
                    lblY[i].style.opacity = +l._enabled;
                    lblYl[i].style.opacity = +l._enabled;
                    if (!l._enabled) return;
                    let y1 = l._data[x1],
                        y2 = l._data[x2],
                        y = y1 - (y2 - y1) * (x1 - x),
                        py = this._mgHeight - (y-o)*z;
                        circs[i].setAttribute("cy", py);
                        Ys.push(py);
                    lblY[i].innerHTML = Math.floor(y);
                    lblY[i].setAttribute("x", 80*ii);
                    lblYl[i].setAttribute("x", 80*ii++);
                });
                let rw = Math.max(140, ii * 80);
                let _o = Math.min(this._mgHeight, Ys.reduce((_o,y) => y>_o && y<_o+80 ? (y+50 -y%50) : _o, 0));
                grect.style.transform = `translateY(${_o}px)`;

                rect.setAttribute("width", rw);
                lblX.setAttribute("x", rw / 2 - 40);
                lblX.innerHTML = this._series._lbl(x1, "wmd");
            },
            mm = (e) => {
                e.preventDefault();
                if (_RAF) _RAF =  requestAnimationFrame(() => (_RAF = true) && pt(e)) && false;
            },
            mu = (e) => {
                this._svg.removeEventListener(_et(e) ? "touchmove" : "mousemove", mm);
            },
            md = (e) => {
                pt(e);
                _initC();
                this._Pt.style.opacity = 1;
                this._svg.addEventListener(_et(e) ? "touchmove" : "mousemove", mm);
                this._svg.addEventListener(_et(e) ? "touchend" : "mouseup", mu, {once: true});
            };

        ["touchstart", "mousedown"].map( e => this._svg.addEventListener(e, md));
    }

    _wndInitEvents()
    {
        let startPosition    = 0,
            currentPosition  = 0,
            _RAF       = true,
            processEvt = (e) => {
                let cliX = _et(e) ? e.touches[0].clientX : e.clientX,
                    newPos = (cliX - startPosition) + currentPosition;
                if (this._wndAct === 'move') {
                    this._wndX = Math.min(Math.max(-this._wndBw,newPos), this._width - this._wndW - this._wndBw);
                } else if (this._wndAct === 'right') {
                    this._wndW = Math.min(Math.max(this._wndBw,cliX - this._wndX - 2 * this._wndBw), this._width -this._wndX - this._wndBw);
                } else if (this._wndAct === 'left') {
                    let nx = Math.max(-this._wndBw,newPos),
                        mx = this._wndX + this._wndW - this._wndBw;
                    this._wndW = Math.max(this._wndBw, this._wndW + this._wndX - nx);
                    this._wndX = Math.min(nx, mx);
                }
            },
            mm = (e) => {
                if (!_et(e)) e.preventDefault();
                if (_RAF && this._wndAct) {
                    processEvt(e);
                    _RAF =  requestAnimationFrame(() => (_RAF = true) && this.wndUpd()) && false;
                }
            },
            mu = (e) => {
                e.preventDefault();
                this._wnd.style.cursor='pointer';
                this._wndAct = false; // reset mouse is down boolean
                document.removeEventListener(_et(e) ? 'touchmove' : 'mousemove', mm);
            },
            md = (e) => {
                e.preventDefault();
                if (this._Pt) this._Pt.style.opacity = 0;
                currentPosition = this._wndX;
                startPosition = _et(e) ? e.touches[0].clientX : e.clientX;

                let dx = startPosition - this._wndX - 3*this._wndBw;
                this._wnd.style.cursor='col-resize';
                this._wndAct = dx < 0 ? "left" : (dx > (this._wndW) ? "right" : "move");

                this._wnd.style.cursor = this._wndAct === 'move' ? "move" : "col-resize";

                let evs =  _et(e) ? ['touchmove', 'touchend'] : ['mousemove', 'mouseup'];
                document.addEventListener(evs[0], mm);
                document.addEventListener(evs[1], mu, {once: true});
            };

        this._wnd.addEventListener("mousedown", md, false);
        this._wnd.addEventListener('touchstart', md, false);
    }

    wndUpd() {
        this._wndL.style['left'] = -this._wndBw + 'px';
        this._wndL.style['width'] = this._wndX + this._wndBw + 'px';

        this._wnd.style['left'] = (this._wndX) + 'px';
        this._wnd.style['width'] = (this._wndW ) + 'px';

        this._wndR.style['left'] = (this._wndX + this._wndW + this._wndBw) + 'px';
        this._wndR.style['width'] = (this._width - (this._wndX + this._wndW)) + 'px';
        this.show(this._wndX + this._wndBw, this._wndW);
    }
    get _x1() { return this._wndX + this._wndBw; }
    get _x2() { return this._wndX + this._wndBw + this._wndW; }
    get _scp() {
        let x0 = this._x1,
            w = this._wndW,
            l = this._series._lines[0],
            ln = l._data.length,
            st = l._step,
            z = ln / this._width;
        let x2 = (x0 + w) * z;
        let p0 = st * (x0 * z),
            p1 = (x2 ? Math.min(x2, ln) : ln) * st;
        return [p0, this._width / ((p1-p0) || 1)];
    }

    show() {
        let [o, z, d] = this._series.ozd,
            [p0, sc] = this._scp,
            x1 = this._x1 * d,
            x2 = this._x2 * d;
        this._G.setAttribute('transform', "translate("+(- p0*sc)+" 0) scale("+sc+" 1)");
        this.updLabelsX(x1, x2);
        this._series.rescale(x1, x2);
        this.updLabelsY(o / z, this._mgHeight / z);
    }

    updLabelsY() {
        this._yUpd = (this._yUpd || 0)+1;
        if (this._yUpd > 1) {
            if (this._yUpdt) clearTimeout(this._yUpdt);
            return this._yUpdt = setTimeout(() => {this._yUpd = 0;this.updLabelsY();}, 120);
        }
        let pr = _ta(this._yLabels.getElementsByTagName('text')).map(t=>+t.innerHTML),
            [o] = this._series.ozd,
            mv = (el,o,y,t) => _ta(el.getElementsByTagName('text')).map((e, i) => {
                e.style['transform'] = `translateY(${y(i)}px)`;
                e.style['opacity'] = o;
                if(t) e.style['transition'] = t;
            }),
            nw = this._series.yLabels(),
            nn = _ta(nw.getElementsByTagName('text')).map(t=>+t.innerHTML);
        mv(nw,0.5,(i) => ((n) => n>0 ? 50 : n &&-50 )(pr[i]-nn[i]),'0.5s');
        this._yLabels.innerHTML = '';
        this._yLabels.appendChild(nw);
        setTimeout(() => mv(nw,1,()=>0), 20);
    }

    updLabelsX(x0, x1) {
        let minLw = 50,
            l = this._series._lines[0],
            [,sc] = this._scp,
            lw = l._step * sc,
            gX = x0*lw,
            cml = '';
        while(lw * (cml || 1) < minLw || (cml||0)%2) cml = (cml || 1) + 1;
        this._xLabels.style['transform'] = `translateX(${-gX}px)`;
        [].slice.call(this._xLabels.getElementsByTagName('text') || [])
            .map((e, i) => {
                let dx = this._wndX < 0 && !i ? 30 : lw * i - this._lw * i;
                e.style['transform'] = `translateX(${dx}px)`;
                if (cml && !e.classList.contains('ml' + cml))
                    e.style['opacity'] = 0;
                else
                    e.style['opacity'] = 1;
            })
    }
}
class TSeries {
    constructor(g, data = {}) {
        this._labelsFormat = 'md';
        this._labels = [];
        this._lines = [];
        this._zoom = 1;

        this._graph = g;
        if (!TSeries.validateData(data)) return;
        this.load(data);
    };

    get ozd() {
        let l = this._lines[0];
        return [l._offset, l._zoom, l._data.length / this._graph._width];
    }
    yLabels() {
        let o = this._lines[0]._offset,
            z = this._lines[0]._zoom;
        let g = _nes('g');
        g.style['transition'] = '0.5s';
        for (let i=this._graph._mgHeight; i >=0; i -= 50) {
            g.innerHTML += `<line x1="0" y1="${i}" x2="${this._graph._width}" y2="${i}" style="stroke:${this._graph._cl[3]};opacity:0.5;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed />`;
        }
        if (this._lines.filter(l => l._enabled).length)
            for (let i=this._graph._mgHeight - 1, j=0; i >=0; i -= 50, j++) {
                g.innerHTML += `<text x="10" y="${i-10}" style="fill:${this._graph._cl[3]};font-size:14px;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed>${Math.round(o + j*50/z)}</text>`;
            }
        return g;
    }

    _lbl(i, f = null) {
        f = f || this._labelsFormat;
        let lbl = this._labels[i];
        if (f === 'md') {
            let formatter = new Intl.DateTimeFormat("en", {month: "short", day: "numeric"});
            return formatter.format((new Date(+lbl)));
        }
        if (f === "wmd") return (new Date(+lbl)).toDateString().replace(/(^[^\s]+)(.*)?\s[^\s]+$/, '$1,$2');

        return lbl;
    }
    xLabels() {
        let g = _nes('g'),
            oCls = (ln) => {
               let ml = [];
               for(let j=2; j<=ln; j++)
                   if(ln%j === 0) ml.push(j);
               return 'ml' + ml.join(' ml');
            };
        g.style['transition'] = '0.5s';
        for (let x=0; x < this._labels.length; x++) {
            let lbl = this._lbl(x), cls = oCls(x);
            g.innerHTML += `<text class="${cls}" text-anchor="middle" x="${x*this._graph._lw}" y="${this._graph._height - 10}" style="transition: 0.5s;fill: ${this._graph._cl[3]};font-size: 14px;" vector-effect="non-scaling-stroke" shape-rendering=optimizeSpeed>${lbl}</text>`;
        }
        return g;
    }

    load(data) {
        let z = 0;
        this._labels = data.columns.find(s => s[0] === data.types.x);
        this._lines = data.columns.filter(s => s[0] !== data.types.x)
            .map((s) => {
                let l = (data.names && data.names[s[0]]) || '',
                    c = (data.colors && data.colors[s[0]]) || 'black';
                return new TLine(this._graph, s[0], l, c, s.slice(1));
            });
        this._labels.shift();
        this.rescale();
    }

    rescale(x0 = null, x1 = null) {
        x0 = Math.floor(Math.min(Math.max(x0 || 0, 0), this._labels.length));
        x1 = Math.ceil(Math.max(Math.min(x1 || this._labels.length, this._labels.length), 0));
        let [MN, MX] = this._lines.filter(l => l._enabled).reduce((a,l) => {
            let [mn, mx] = l.mnmx(x0, x1);
            return [Math.min(mn, a[0]),Math.max(mx, a[1])];
        },[1/0,-1/0]);
        let z = this._graph._mgHeight / (MX - MN), o = MN;
        for (let l of this._lines)
            l.rescale(o, z);
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
    constructor(g, n, l, c, d, z = 0) {
        this._el = null;
        this._enabled = true;
        this._zoom = 1;
        this._offset = 0;
        this._graph = g;
        this._name = n; this._label = l; this._color = c;
        [this._min, this._max] = _mm(d);
        this._zoom = z || this._max / this._graph._mgHeight;
        this._data = d;
    }
    mnmx(x0, x1) {
        return _mm(this._data.slice(x0, x1));
    }
    get el() {
        if (this._el) return this._el;

        this._step = this._graph._width / this._data.length;
        let p = [];
        for (let i=0; i < this._data.length; i++) p.push(this._step*i + "," + this._data[i]);
        this._el = _nes('polyline');
        this._el.setAttribute('vector-effect', "non-scaling-stroke");
        this._el.style = `transform-origin: 0 0;transition: 0.5s;fill:none;stroke:${this._color};stroke-width:1`;
        this._el.setAttribute('points', p.join(' '));
        this.rescale(this._offset, this._zoom);

        return this._el;
    }
    rescale(off, z) {
        this._offset = off;
        this._zoom = z;
        if (this._el)
            this._el.setAttribute('transform', `translate(0 ${this._graph._mgHeight + this._offset * this._zoom}) scale(1 -${this._zoom})`);
    }
    toggle() {
        this._enabled = !this._enabled;
        this._el.style['opacity'] = this._enabled ? 1 : 0;
    }
}
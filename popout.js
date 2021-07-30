class SubGraph {
    static get BUFSIZ() {
        return 4800;
    }
    /**
     * @param {string | HTMLElement} containerName 
     */
    constructor(containerName) {
        /** @type {Number[]} */
        this.hist_buffer = [];
        this.millisecondsLeft = 1000000;
        this.frameHandle = 0;

        this.graph_props = {
            lineColor: '#3585ff',
            fillColor: '#50aaff',
            outerWidth: 480,
            outerHeight: 240,
            margin: {
                top: 32,
                bottom: 64
            },
            fontColor: '#000',
            fontStyle: '64px sans-serif'
        };
        /** @type {Window} */
        this.popout = undefined;
        this.container = d3.select(containerName);
        const props = this.graph_props;
        // resizable wrapper
        this.chartWrapper = this.container.append('figure')
            .lower()
            .attr('class','canvas-wrapper');

        // Init canvas
        this.canvasChart = this.chartWrapper.append('canvas')
            .attr('width', props.outerWidth)
            .attr('height', props.outerHeight)
            .attr('class', 'canvas-plot');
        /** @type {CanvasRenderingContext2D} */
        this.context = this.canvasChart.node().getContext('2d');

        // detect when wrapper is resized by user dragging it
        this.debounce = false;
        this.resizeObs = new ResizeObserver((entries => {
            for(let entry of entries) {
                if(entry.target.matches('.canvas-wrapper')) {
                    const cv = this.context.canvas;
                    const newSize = entry.contentRect;
                    if(this.popout === undefined || this.popout.closed){
                        cv.width = newSize.width;
                        cv.height = newSize.height;
                        props.outerWidth = cv.width;
                        props.outerHeight = cv.height;
                        this.xgen();
                        this.ygen();
                        if(this.previousStamp === undefined){
                            this.startLine();
                            this.hist_buffer.forEach((point, index) => this.drawLine(index, point));
                            this.endLine();
                            this.drawTime();
                        }
                    } else {
                        // compute browser border because resizeTo only allows us to control outer size
                        const popout = this.popout;
                        let xborder = popout.outerWidth - popout.innerWidth;
                        let yborder = popout.outerHeight - popout.innerHeight;
                        this.popout.resizeTo(newSize.width + xborder, newSize.height + yborder);
                        // and the resize handler should handle the rest
                    }
                    this.debounce = true;
                    break;
                }
            }
        }).bind(this));
        this.chartWrapper.on('pointerdown',(e => {
            if(e.isPrimary)
                this.resizeObs.observe(e.target);
        }).bind(this));
        this.chartWrapper.on('pointerup', (e => {
            if(e.isPrimary) {
                this.resizeObs.disconnect();
                this.debounce = false;
            }
        }).bind(this));

        // Init Scales
        this.x = d3.scaleLinear()
            .domain([0, SubGraph.BUFSIZ]);
        this.y = d3.scaleLinear();
        this.previousStamp = undefined;

        // callback to retrieve time
        /** @type {function():string} */
        this.onRequestTime = () => '00:00:00';

        // fill history with random values to make previewing easier
        for (let iter = 0, data = 0; iter < SubGraph.BUFSIZ; iter++) {
            if(iter % 100 == 0)
                data = Math.random() * this.millisecondsLeft;
            this.hist_buffer.push(data);
        }
        // generate preview
        this.xgen();
        this.ygen();
        this.doFrame(0);
        this.suspendAnimate();
    }
    xgen() {
        this.x.range([0, this.graph_props.outerWidth]);
    }
    ygen() {
        const props = this.graph_props;
        this.y
            .domain(d3.extent(this.hist_buffer))
            .range([props.outerHeight - props.margin.bottom, props.margin.top]);
    }
    startLine() {
        const context = this.context;
        const props = this.graph_props;
        context.clearRect(0, 0, props.outerWidth, props.outerHeight);
        context.beginPath();
        context.strokeStyle = props.lineColor;
        context.lineWidth = 8;
        context.fillStyle = props.fillColor;
        context.moveTo(0, props.outerHeight + 4);
    }
    drawLine(index, toHeight) {
        this.context.lineTo(this.x(index), this.y(toHeight));
    }
    endLine() {
        const context = this.context;
        const props = this.graph_props;
        context.lineTo(props.outerWidth, props.outerHeight + 4);
        context.closePath();
        context.stroke();
        context.fill();
    }
    drawTime() {
        const context = this.context;
        const props = this.graph_props;
        context.fillStyle = props.fontColor;
        context.font = props.fontStyle;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(
            this.onRequestTime(),
            props.outerWidth / 2,
            props.outerHeight / 2
        );
    }
    doFrame(msTimestamp) {
        if(this.previousStamp !== undefined) {
            const elapsed = msTimestamp - this.previousStamp;
            this.millisecondsLeft -= elapsed;
            this.hist_buffer.shift();
            this.hist_buffer.push(this.millisecondsLeft);
            this.ygen();
        }
        this.startLine();
        this.hist_buffer.forEach((point, index) => this.drawLine(index, point));
        this.endLine();
        this.drawTime();
        this.previousStamp = msTimestamp;
        this.frameHandle = requestAnimationFrame(this.doFrame.bind(this));
    }
    beginAnimate() {
        this.frameHandle = requestAnimationFrame(this.doFrame.bind(this));
    }
    suspendAnimate() {
        cancelAnimationFrame(this.frameHandle);
        this.previousStamp = undefined;
    }
    /**
     * @param {Number} milliseconds 
     */
    setTimeMS(milliseconds) {
        this.millisecondsLeft = milliseconds;
    }
    flattenGraph() {
        this.hist_buffer.fill(this.millisecondsLeft);
    }
    /**
     * @param {Window} popout 
     */
    createMirrorCanvas(popout) {
        const props = this.graph_props;
        let popoutCanvas = popout.document.createElement('canvas');
        popout.document.body.appendChild(popoutCanvas);
        popoutCanvas.width = props.outerWidth;
        popoutCanvas.height = props.outerHeight;

        popout.onresize = (() => {
            props.outerHeight = popout.innerHeight;
            props.outerWidth = popout.innerWidth;
            /** @type {HTMLCanvasElement} */
            let cv = this.canvasChart.node();
            cv.width = props.outerWidth;
            cv.height = props.outerHeight;
            popoutCanvas.width = props.outerWidth;
            popoutCanvas.height = props.outerHeight;
            if(!this.debounce){
                this.chartWrapper.style('width','');
                this.chartWrapper.style('height','');
            }
            this.xgen();
            this.ygen();
            if(this.previousStamp === undefined){
                this.startLine();
                this.hist_buffer.forEach((point, index) => this.drawLine(index, point));
                this.endLine();
                this.drawTime();
            }
        }).bind(this);

        const popoutCtx = popoutCanvas.getContext('2d');
        const copyCanvas = msTimestamp => {
            popoutCtx.clearRect(0, 0, props.outerWidth, props.outerHeight);
            popoutCtx.drawImage(this.canvasChart.node(), 0, 0);
            requestAnimationFrame(copyCanvas);
        };
        requestAnimationFrame(copyCanvas.bind(this));
        this.popout = popout;
        return popoutCtx;
    }
}

class SubGraph {
    static get BUFSIZ() {
        return 4800;
    }
    /**
     * @param {string} containerName 
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
            }
        };
        this.container = d3.select(containerName);
        const props = this.graph_props;
        // Init canvas
        this.canvasChart = this.container.append('canvas')
            .attr('width', props.outerWidth)
            .attr('height', props.outerHeight)
            .attr('class', 'canvas-plot');
        /** @type {CanvasRenderingContext2D} */
        this.context = this.canvasChart.node().getContext('2d');

        // Init Scales
        this.x = d3.scaleLinear()
            .domain([0, SubGraph.BUFSIZ])
            .range([0, props.outerWidth]);
        this.y = d3.scaleLinear()
            .domain(d3.extent(this.hist_buffer))
            .range([props.outerHeight - props.margin.bottom, props.margin.top]);
        this.previousStamp = undefined;
    }
    ygen() {
        this.y.domain(d3.extent(this.hist_buffer));
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
        if(this.hist_buffer.length == 0) {
            for (let iter = 0; iter < SubGraph.BUFSIZ; iter++) {
                this.hist_buffer.push(this.millisecondsLeft);
            }
        }
    }
}

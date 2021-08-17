/** Formatting editor dialog */
class FormatBox {
    static get Fonts() {
        return [];
    }
    /**
     * @param {string | HTMLElement} containerName 
     */
    constructor(containerName) {
        this.container = d3.select(containerName);
        this.form = this.container.append('form')
            .on('submit', this.handleSubmitBtn.bind(this));
        this.inputs = {};
        this.onFormatChange = (formatting) => {};
        this.render();
    }
    render() {
        const form = this.form;
        this.inputs = {
            fontFamily: form.append('input')
                .attr('name', 'fontFamily')
                .attr('value', 'sans-serif'),
            fontSize: form.append('input')
                .attr('type', 'number')
                .attr('name', 'fontSize')
                .attr('min', '1')
                .attr('value', '64')
                .on('change', this.artificialSubmit.bind(this)),
            boldBtn: this.createFormattingToggle(
                'bold','B', { 'font-weight': 'bold' }
            ),
            italicBtn: this.createFormattingToggle(
                'italic', 'I', { 'font-style': 'italic' }
            ),
            // underlineBtn: this.createFormattingToggle(
            //     'underline', 'U', { 'text-decoration': 'underline' }
            // ),
            colorBtn: form.append('input')
                .attr('type', 'color')
                .attr('name', 'color')
                .attr('value', '#000')
                .on('change', this.artificialSubmit.bind(this)),
            confirmBtn: form.append('input')
                .attr('type', 'submit')
                .style('visibility','hidden')
        };
    }
    /**
     * 
     * @param {Event} event
     */
    handleSubmitBtn(event) {
        event.preventDefault();
        this.dispatchFormattingData();
    }
    artificialSubmit() {
        if(this.form.node().reportValidity())
            this.dispatchFormattingData();
    }
    createFormattingToggle(name, symbol, styles={}) {
        let label = this.form.append('label')
            .attr('class', 'toggleBox');
        let btn = label.append('input')
            .attr('type', 'checkbox')
            .attr('name', name)
            .on('change', this.artificialSubmit.bind(this));
            // .style('visibility','hidden');
        let labeltext = label.append('span')
            .text(symbol);
        Object.keys(styles).forEach(
            k => labeltext.style(k, styles[k])
        );
        return btn;
    }
    dispatchFormattingData() {
        /** @type {HTMLFormElement} */
        const form = this.form.node();
        const data = new FormData(form);
        let formatting = {};
        for(let pair of data.entries()) {
            formatting[pair[0]] = pair[1];
        }
        this.onFormatChange(formatting);
    }
}

class CanvasFormat extends FormatBox {
    /**
     * @param {string | HTMLElement} containerName 
     */
    constructor(containerName) {
        super(containerName);
    }
    render() {
        const form = this.form;
        let lineLbl = form.append('label');
        lineLbl.append('span')
            .text('Line Color ');
        let fillLbl = form.append('label');
        fillLbl.append('span')
            .text('Fill Color ');
        this.inputs = {
            lineColorBtn: lineLbl.append('input')
                .attr('type', 'color')
                .attr('name', 'lineColor')
                .attr('value', '#3585ff')
                .on('change', this.artificialSubmit.bind(this)),
            fillColorBtn: fillLbl.append('input')
                .attr('type', 'color')
                .attr('name', 'fillColor')
                .attr('value', '#50aaff')
                .on('change', this.artificialSubmit.bind(this)),
            confirmBtn: form.append('input')
                .attr('type', 'submit')
                .style('display','none')
        };
    }
}

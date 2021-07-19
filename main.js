const token = 'insert token here';
const username = 'insert username here';

var channel = 'channel to track';

const { chat } = new window.TwitchJs({ username, token });

var secondsLeft = 0;

var subCount = 0;
function countASub(msg) {
    const checkbox_mapping = {
        'SUBSCRIPTION': 'sub',
        'RESUBSCRIPTION': 'resub',
        'SUBSCRIPTION_GIFT': 'giftsub',
        'SUBSCRIPTION_GIFT_COMMUNITY': 'giftsub_com'
    };
    /** @type {HTMLInputElement} */
    let checkbox = document.getElementById(checkbox_mapping[msg.event]);
    if(checkbox.checked){
        let logsize = parseInt(document.getElementById('logsize').value);
        let logbox = document.getElementById('log');
        let newlog = document.createElement('p');
        newlog.textContent = "Maybe a sub? Sub no. "+(++subCount)+" "+msg.systemMessage;
        logbox.appendChild(newlog);
        if(logbox.childElementCount > logsize) {
            logbox.firstElementChild.remove();
        }

        secondsLeft += 60;
    }
}

chat.connect().then(() => {
    chat.join(channel).then(() => {
        chat.on('USERNOTICE/SUBSCRIPTION', countASub);
        chat.on('USERNOTICE/RESUBSCRIPTION', countASub);
        chat.on('USERNOTICE/SUBSCRIPTION_GIFT', countASub);
        chat.on('USERNOTICE/SUBSCRIPTION_GIFT_COMMUNITY', countASub);
    });
});

// chart code
function subGraphSetup(initSeconds) {
    let updateHandlePromise = new Promise((resolve, reject) => {
        // Create the chart
        Highcharts.stockChart('graphbox', {
            chart: {
                events: {
                    load: function () {
                        // set up the updating of the chart each second
                        var series = this.series[0];
                        // return the graph update handle when it is ready
                        resolve(
                            setInterval(function () {
                                var x = (new Date()).getTime(), // current time
                                    y = secondsLeft;
                                series.addPoint([x, y], true, true);
                            }, 1000)
                        );
                    }
                }
            },

            time: {
                useUTC: false
            },

            rangeSelector: {
                buttons: [{
                    count: 1,
                    type: 'minute',
                    text: '1M'
                }, {
                    count: 5,
                    type: 'minute',
                    text: '5M'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                inputEnabled: false,
                selected: 0
            },

            title: {
                text: 'Countdown History'
            },

            exporting: {
                enabled: false
            },

            series: [{
                name: 'Seconds Remaining',
                data: (function () {
                    // generate an array of random data
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -300; i <= 0; i += 1) {
                        data.push([
                            time + i * 1000,
                            initSeconds
                        ]);
                    }
                    return data;
                }())
            }]
        });
    });
    return updateHandlePromise;
}

window.onload = () => {
    /** @type {HTMLInputElement} */
    const h = document.getElementById("hours");
    /** @type {HTMLInputElement} */
    const m = document.getElementById("minutes");
    /** @type {HTMLInputElement} */
    const s = document.getElementById("seconds");
    /** @type {HTMLInputElement} */
    const start = document.getElementById("start");
    /** @type {HTMLInputElement} */
    const stop = document.getElementById("stop");
    /** @type {HTMLInputElement} */
    const subCountBox = document.getElementById("subcount");
    stop.disabled = true;

    let timeUpdateHandle = 0,
        graphUpdateHandle = 0;

    function updateCounter() {
        if(--secondsLeft <= 0){
            s.value = "0";
            clearInterval(timeUpdateHandle);
        }
        else{
            let timeConverter = new Date(null);
            timeConverter.setSeconds(secondsLeft);
            let timeString = timeConverter.toISOString();
            h.value = timeString.substr(11,2);
            m.value = timeString.substr(14,2);
            s.value = timeString.substr(17,2);

            subCountBox.value = subCount;
        }
    }

    start.onclick = () => {
        secondsLeft = parseInt(h.value * 60 * 60) + parseInt(m.value * 60) + parseInt(s.value);
        console.log("1970 "+secondsLeft);
        subCount = parseInt(subCountBox.value);
        subCountBox.disabled = true;
        timeUpdateHandle = setInterval(updateCounter, 1000);
        subGraphSetup(secondsLeft).then(handle => {
            graphUpdateHandle = handle;
        });
        start.disabled = true;
        stop.disabled = false;

        h.disabled = true;
        m.disabled = true;
        s.disabled = true;
    };
    stop.onclick = () => {
        clearInterval(timeUpdateHandle);
        clearInterval(graphUpdateHandle);
        start.disabled = false;
        stop.disabled = true;
        subCountBox.disabled = false;

        h.disabled = false;
        m.disabled = false;
        s.disabled = false;
    };

    /** @type {HTMLInputElement} */
    const logsize = document.getElementById('logsize');
    const logbox = document.getElementById('log');
    logsize.onblur = () => {
        let logsize_val = parseInt(logsize.value);
        if(isFinite(logsize_val)) {
            while (logbox.childElementCount > logsize_val) {
                logbox.firstElementChild.remove();
            }
        }
    };
};
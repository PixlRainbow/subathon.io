// subathon.io public client ID
const clientId = 'ft8ue4hxidti4b5hxsuaxr05fb12x1';

// var channel = 'channel to track';

// const { chat } = new window.TwitchJs({ username, token });

/** @type {SubGraph} */
let graph;

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
        graph.setTimeMS(secondsLeft * 1000);
    }
}

function connectTwitch(chat, channel) {
    chat.connect().then(() => {
        chat.join(channel).then(() => {
            chat.on('USERNOTICE/SUBSCRIPTION', countASub);
            chat.on('USERNOTICE/RESUBSCRIPTION', countASub);
            chat.on('USERNOTICE/SUBSCRIPTION_GIFT', countASub);
            chat.on('USERNOTICE/SUBSCRIPTION_GIFT_COMMUNITY', countASub);
        }).catch(err => alert(err.message));
    }).catch(err => alert(err.message));
}

function constructAuthURL() {
    let parentURL = window.location.href;
    if(parentURL.substr(-1) !== '/')
        parentURL += '/';
    let authURL = "https://id.twitch.tv/oauth2/authorize?response_type=token&client_id="
                + clientId
                + "&redirect_uri="
                + parentURL + "login.html"
                + "&scope=chat:read+channel:read:subscriptions";
    return authURL;
}

// chart code (DEPRECATED)
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

    graph = new SubGraph("#graphbox");
    graph.onRequestTime = () => `${h.value}:${m.value}:${s.value}`;

    document.querySelectorAll('input[name=fps]')
        .forEach(fpsOption => fpsOption.addEventListener('change',
            ev => graph.setFPS(parseInt(ev.target.value))
        ));

    let token = localStorage.getItem("token");
    let username = localStorage.getItem("username");
    let twitchConnection = null;

    const loginButton = document.getElementById("login");
    loginButton.onclick = () => {
            if(token === null || username === null) {
                window.open(
                    constructAuthURL()
                );
            } else if(confirm("Really Log Out?")) {
                token = null;
                username = null;
                localStorage.removeItem("token");
                localStorage.removeItem("username");
                twitchConnection.disconnect();
                loginButton.textContent = "Login";
            }
    };
    window.addEventListener('message', async (ev) => {
        if(ev.origin !== window.location.origin)
            return;
        if(typeof ev.data === "string") {
            token = ev.data;
            let {api} = new window.TwitchJs({ clientId, token });
            username = await api.get("users").then(
                response => response.data[0].login
            );
            localStorage.setItem("token",token);
            localStorage.setItem("username",username);
            // for some reason, attempting to use the chat created previously above in let{api} cannot stay connnected
            // as a workaround, have to create a brand new chat
            twitchConnection = new window.TwitchJs({username, token}).chat;
            // assume that you always want to look at your own channel (username passed as channel parameter)
            connectTwitch(twitchConnection, username);
            loginButton.textContent = username;
            // window.location.reload();
        }
    }, false);
    if(token !== null && username !== null) {
        twitchConnection = new window.TwitchJs({ username, token }).chat;
        // assume that you always want to look at your own channel (username passed as channel parameter)
        connectTwitch(twitchConnection, username);
        loginButton.textContent = username;
    }

    let timeUpdateHandle = 0,
        graphUpdateHandle = 0;

    function updateCounter() {
        if(--secondsLeft <= 0){
            s.value = "00";
            clearInterval(timeUpdateHandle);
            graph.suspendAnimate();
        }
        else{
            let timeConverter = new Date(secondsLeft * 1000);
            let day = timeConverter.getUTCDate() - 1;
            h.value = (timeConverter.getUTCHours() + (day * 24)).toString().padStart(2,"0");
            m.value = timeConverter.getUTCMinutes().toString().padStart(2,"0");
            s.value = timeConverter.getUTCSeconds().toString().padStart(2,"0");

            subCountBox.value = subCount;
        }
    }    

    // if this is the first click of the start button, start from a flat graph
    let firstStart = true;
    start.onclick = () => {
        // Epoch (or the zeroth second by computer time) is 1970 January 1, 00:00:00.000
        secondsLeft = Date.UTC(70, 0, 1, h.value, m.value, s.value) / 1000;
        console.log("1970 "+secondsLeft);
        subCount = parseInt(subCountBox.value);
        subCountBox.disabled = true;
        timeUpdateHandle = setInterval(updateCounter, 1000);
        // subGraphSetup(secondsLeft).then(handle => {
        //     graphUpdateHandle = handle;
        // });
        graph.setTimeMS(secondsLeft * 1000);
        if(firstStart) {
            graph.flattenGraph();
            firstStart = false;
        }
        graph.beginAnimate();
        start.disabled = true;
        stop.disabled = false;

        h.disabled = true;
        m.disabled = true;
        s.disabled = true;
    };
    stop.onclick = () => {
        clearInterval(timeUpdateHandle);
        // clearInterval(graphUpdateHandle);
        graph.suspendAnimate();
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
    
    /** @type {HTMLInputElement} */
    const popoutBtn = document.getElementById('popout');
    /** @type {Window} */
    let popout = undefined;
    /** @type {CanvasRenderingContext2D} */
    let popoutCtx = undefined;
    popoutBtn.onclick = () => {
        const props = graph.graph_props;
        if(popout === undefined || popout.closed) {
            popout = window.open('', '_blank', `width=${props.outerWidth},height=${props.outerHeight}`);
            popout.document.body.style.margin = '0';
            popoutCtx = graph.createMirrorCanvas(popout);
            popout.onclose = () => {
                popoutCtx = undefined;
            };
        } else {
            popout.focus();
        }
    };
};

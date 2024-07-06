function daysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getPeriod(period) {
    const startPeriod = new Date();
    const endPeriod = new Date();
    let periodLength;
    let barWidth;
    let timeFrame;
    if (period === "Month") {
        periodLength = daysInMonth(startPeriod);
        barWidth = 5;
        timeFrame = "weekly";
        startPeriod.setDate(1);
        endPeriod.setMonth(endPeriod.getMonth() + 1, 0);
    } else if (period === "Year") {
        periodLength = 52;
        barWidth = 3;
        timeFrame = "monthly";
        startPeriod.setFullYear(startPeriod.getFullYear(), 0, 1);
        endPeriod.setFullYear(endPeriod.getFullYear(), 11, 31);
    } else {
        periodLength = 7;
        barWidth = 10;
        timeFrame = "daily";
        startPeriod.setDate(startPeriod.getDate() - (startPeriod.getDay() % 7));
        endPeriod.setDate(startPeriod.getDate() + 7);
    }

    startPeriod.setHours(0, 0, 0, 0);
    endPeriod.setHours(23, 59, 59, 999);
    return { startPeriod, endPeriod, periodLength, barWidth, timeFrame };
}

function getPeriodName() {
    return document.querySelector(".timebtn.active").textContent;
}

function setPeriod(active) {
    document.querySelectorAll(".timebtn").forEach(btn => {
        btn.textContent === active ? btn.classList.add("active") : btn.classList.remove("active");
    });
}

function convertTime(s) {
    if (s < 60) {
        return "0m";
    } else {
        s = Math.floor(s / 60);
        let h = Math.floor(s / 60);
        let m = s % 60;
        return (h > 0 ? h + "h " : "") + m + "m";
    }
}

function formatWithLocale(hour) {
    const time = (new Date());
    time.setHours(hour);
    return time.toLocaleString("en-US", { hour: "numeric", hour12: true });
}

function loadTopGenres(genres, watchtime) {
    const gKeys = Object.keys(genres);
    gKeys.sort((a, b) => genres[b] - genres[a]);

    const colors = ["bar-1", "bar-2", "bar-3", "bar-4", "bar-5"];
    let chart = "linear-gradient(90deg, ";
    let i = 0;
    let totalP = 0;
    let other = false;
    document.getElementById("topgkey").textContent = "";
    gKeys.forEach(genre => {
        if (other === true) return;
        let p;
        let color;
        if (i > 3) {
            color = "bar-other";
            p = (100 - totalP).toFixed(1);
            other = true;
            genre = "Other";
        } else {
            color = colors[i];
            p = (100 * (genres[genre] / watchtime)).toFixed(1); 5
        }
        chart += (i > 0 ? "," : "") + "var(--" + color + ") " + totalP + "%" + " " + (totalP += parseFloat(p)) + "%";
        document.getElementById("topgkey").innerHTML += `<div style="display:flex;gap:5px;align-items:center;font-size:16px;justify-content:space-between;"><div style="display:flex;align-items:center;gap:5px;"><div style="height:16px;width:16px;border-radius:4px;background:var(--${color})"></div><p style="font-size:14px;margin:0;color:var(--text);">${genre}</p></div><span class="topg-key-p">${p}%</span></div>`;
        i++;
    });
    chart += ")";
    if (gKeys.length < 2) {
        chart = "gray";
    }
    document.getElementById("topgpi").style.backgroundImage = chart;
}

function loadTopChannels(channels) {
    const target = document.getElementById("topc");
    target.textContent = "";
    let toptotal = 0;
    let sorted = Object.keys(channels).sort((a, b) => channels[b] - channels[a]);
    const numChannels = Math.min(sorted.length, 5);
    for (let i = 0; i < numChannels; i++) {
        toptotal += channels[sorted[i]];
    }
    for (let i = 0; i < numChannels; i++) {
        const name = sorted[i];
        const ratio = (channels[sorted[i]] / toptotal) * 66;
        target.innerHTML += `<span class="topc-duration">${convertTime(channels[sorted[i]])}</span><div style="position:relative"><span class="topc-name" style="position:relative;z-index:1;">${name}</span><span style="z-index:0;opacity:.5;width: ${ratio}%;background:linear-gradient(160deg, #c0ffb1, #b7f4ff);position:absolute;right:0;top:4px;height:50%;border-radius:6px;"></span></div>`;
    }
    return sorted.length;
}

function loadAverageWatchtime(watchtime) {
    const period = getPeriodName();
    const now = new Date();
    let avg, timeframe;
    if (period === "Year") {
        avg = watchtime / (now.getMonth() + 1);
        timeframe = "Monthly";
    } else if (period === "Month") {
        avg = watchtime / (now.getDate() / 7);
        timeframe = "Weekly";
    } else {
        avg = watchtime / (now.getDay() + 1);
        timeframe = "Daily";
    }
    document.getElementById("watchtime-average").textContent = convertTime(avg);
    document.getElementById("watchtime-average-period").textContent = timeframe + " average";
}

function loadActivityFlower(points) {
    const target = document.getElementById("dates");
    const maxTime = Math.max(...points);
    const maxTimeIndex = points.indexOf(maxTime);
    document.getElementById("most-activity").textContent = formatWithLocale(maxTimeIndex);
    target.textContent = "";
    const degs = 360 / points.length;
    const innerRadius = 32;
    for (let i = 0; i < points.length; i++) {
        const bar = document.createElement("div");
        bar.className = "activity-bar";
        bar.style = `transform: rotate(${-180 + (i * degs)}deg) translate(${0}px, ${innerRadius}px);height:calc(50% - ${innerRadius + 20}px);`;
        bar.innerHTML = `<div style="border-radius:8px 8px 8px 8px;margin-top: ${0}px;height:${(points[i] / maxTime) * 100}%;width:100%;background:linear-gradient(160deg, #c0ffb1, #b7f4ff);"></div>`;
        target.appendChild(bar);
        bar.addEventListener("mouseenter", () => {
            document.getElementById("activity").style.opacity = "1";
            document.getElementById("activity-duration").textContent = convertTime(points[i]);
            document.getElementById("activity-time").textContent = formatWithLocale(i);
            bar.classList.add("hover");
        });
        bar.addEventListener("mouseleave", () => {
            document.getElementById("activity").style.opacity = "0";
            bar.classList.remove("hover");
        });
    }
}

function loadCurrentVideo(video) {
    const target = document.getElementById("current-vid");

    if (video === null) {
        target.style.display = "none";
        return;
    }

    target.style.display = "flex";
    if (video.thumbnailUrl) target.style.backgroundImage = `linear-gradient(#000000eb, #00000094), url(${video.thumbnailUrl[0]})`;
    if (video.name) target.querySelector("#current-vid-title").textContent = video.name;

    const transaction = database.transaction(["videos"]);
    const objectStore = transaction.objectStore("videos");
    const get = objectStore.get(video.vid);

    get.onsuccess = () => {
        if (get.result === undefined) {
            target.querySelector("#current-vid-replay").textContent = "Replayed 0 times";
            return;
        }
        let replays = get.result.ts.reduce((acc, val) => acc + (Math.ceil(val.s / video.max)), 0);
        target.querySelector("#current-vid-replay").textContent = "Replayed " + replays + " times";
    }

}

function loadWatchtimeGraph(subPeriods, barWidth) {
    const target = document.getElementById("watch-graph");
    const period = getPeriodName();
    const maxDay = Math.max(...subPeriods);
    let labels = [];
    if (period === "Month") {
        for (let i = 0; i < subPeriods.length; i++) {
            labels.push((i % 2 === 0 ? i + 1 : ""));
        }
    } else if (period === "Year") {
        let prev = 0;
        for (let i = 0; i < subPeriods.length; i++) {
            let month = Math.floor(i / 4.33) + 1;
            if (month !== prev) {
                prev = month;
                labels.push(month);
            } else {
                labels.push("");
            }
        }
    } else {
        labels = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
    }

    target.textContent = "";
    for (let i = 0; i < subPeriods.length; i++) {
        let percentage = 100 * (subPeriods[i] / maxDay);
        const div = document.createElement("div");
        div.className = "graph-bar";
        div.style = "height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center";
        div.innerHTML += `<div style="display:flex;align-items:flex-end;height:100%"><div class="graph-section" style="height:${percentage}%;min-height:3%;width:${barWidth}px;"></div></div><p class="graph-day">${labels[i]}</p>`;
        div.addEventListener("mouseenter", () => {
            document.getElementById("watchtime-byday").style.opacity = "1";
            document.getElementById("watchtime-byday").textContent = convertTime(subPeriods[i]);
            div.classList.add("hover");
        });
        div.addEventListener("mouseleave", () => {
            document.getElementById("watchtime-byday").style.opacity = "0";
            div.classList.remove("hover");
        });
        target.appendChild(div);
    }
}

function display() {

    const transaction = database.transaction(["videos"]);
    const objectStore = transaction.objectStore("videos");
    const get = objectStore.getAll();
    get.onsuccess = () => {
        chrome.storage.local.get(["channels", "genres", "timestart", "timePeriod"], storage => {
            const videos = get.result;
            const period = storage["timePeriod"];
            const { startPeriod, endPeriod, periodLength, barWidth, timeFrame } = getPeriod(period);
            const cutoffBegin = startPeriod.getTime();
            const cutoffEnd = endPeriod.getTime();
            const subPeriods = [];
            for (let i = 0; i < periodLength; i++) subPeriods.push(0);

            let watchtime = 0;
            let ads = 0;
            let videoCount = 0;
            let channels = {};
            let genres = {};
            let times = new Array(24).fill(0);

            setPeriod(period);

            videos.forEach(video => {
                let total = 0;
                let videoCounted = false;
                const channel = storage["channels"][video.c];
                const genre = storage["genres"][video.g];

                video.ts.forEach(session => {
                    if (session.t < cutoffBegin || session.t > cutoffEnd) return;

                    if (videoCounted === false) {
                        videoCount++;
                        videoCounted = true;
                    }
                    total += session.s;
                    watchtime += session.s;
                    ads += session.a;
                    const timestamp = new Date(session.t);
                    times[timestamp.getHours()] += session.s;

                    // calculating the subperiod the session belongs to
                    let pos;
                    if (period === "Month") {
                        pos = timestamp.getDate() - 1;
                    } else if (period === "Year") {
                        let elapsed = timestamp.getTime() - startPeriod.getTime();
                        pos = Math.floor((elapsed / 86400000) / 7);
                    } else {
                        pos = timestamp.getDay();
                    }
                    subPeriods[pos] += session.s;
                    channels[channel] = session.s + (channels[channel] || 0);
                    genres[genre] = session.s + (genres[genre] || 0)
                });
            });

            loadWatchtimeGraph(subPeriods, barWidth);
            loadAverageWatchtime(watchtime);
            loadTopGenres(genres, watchtime);
            loadActivityFlower(times);
            loadTopChannels(channels);
            document.getElementById("channel-count").textContent = Object.keys(channels).length;
            document.getElementById("watchtime-normal").textContent = convertTime(watchtime);
            document.getElementById("watchtime-ads").textContent = convertTime(ads);
            document.getElementById("video-count").textContent = videoCount;
            document.getElementById("most-watchtime").textContent = convertTime(Math.max(...subPeriods));
            document.getElementById("most-watchtime-caption").textContent = "Highest " + timeFrame + " watchtime";

        });
    }
}

document.querySelectorAll(".timebtn").forEach(btn => {
    btn.addEventListener("click", () => {
        chrome.storage.local.set({ "timePeriod": btn.textContent }).then(() => {
            display();
        });
    });
});

chrome.storage.local.onChanged.addListener(() => {
    display();
});

// initial load
let database = null;
const request = indexedDB.open('tubetime', 3);
request.onsuccess = (event) => {
    database = event.target.result;
    display();
    chrome.tabs.query({ url: "*://*.youtube.com/*" }).then((tabs, onError) => {
        if (tabs.length === 0) {
            loadCurrentVideo(null);
            return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { "type": "getCurrentVideo" }, response => {
            loadCurrentVideo(response);
        });
    });
}
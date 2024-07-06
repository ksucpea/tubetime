let run = null;
let allow = false;
let vids = null;
let adSeconds = 0;

function record() {

    const player = document.querySelector(".html5-video-player");
    const isAdvert = player.classList.contains("ad-interrupting");
    const playButton = document.querySelector(".ytp-play-button.ytp-button");

    if (playButton.dataset["titleNoTooltip"] === "Pause") {
        if (isAdvert) {
            vids["adSeconds"] += 1;
        } else {
            vids["seconds"] += 1;
        }
    }
    console.log(vids);
}

function reload() {

    // upload previous video data if any
    chrome.runtime.sendMessage({ type: "upload", data: { "vids": vids } });

    let match = window.location.search.match(/\?v=(?<id>[A-Za-z0-9_]*)/);
    const vid = match.groups.id;
    if (!match) return;

    const info = document.querySelector("#microformat script");
    if (!info) return;

    const json = JSON.parse(info.textContent);
    const uploadDate = new Date(json.uploadDate).getTime();
    vids = {
        "id": vid,
        "uploadDate": uploadDate,
        "channel": json.author,
        "genre": json.genre,
        "seconds": 0,
        "adSeconds": 0,
        "start": new Date().getTime()
    };

    clearInterval(run);
    run = setInterval(record, 1000);
}

function getCurrentVideo(respond) {
    const info = document.querySelector("#microformat script");
    if (!info) {
        respond(null);
        return;
    }
    const json = JSON.parse(info.textContent);
    json["vid"] = getVid();
    json["max"] = parseInt(document.querySelector(".ytp-progress-bar").getAttribute("aria-valuemax"));
    respond(json);
}

function getVid() {
    let match = window.location.search.match(/\?v=(?<id>[A-Za-z0-9_]*)/);
    if (!match) return null;
    return match.groups.id;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "getCurrentVideo") {
        getCurrentVideo(sendResponse);
    } else {
        sendResponse(null);
    }
    return true;
});

window.addEventListener('beforeunload', function (event) {
    chrome.runtime.sendMessage({ type: "upload", data: { "vids": vids } });
});

const callback = (mutationList, observer) => {
    const target = document.querySelector(".PlayerMicroformatRendererHost script");
    for (const mutation of mutationList) {
        if (mutation.type === "childList" && mutation.target === target && mutation.addedNodes.length > 0) {
            reload();
        }
    }
};

const observer = new MutationObserver(callback);
observer.observe(document.body, { childList: true, subtree: true });
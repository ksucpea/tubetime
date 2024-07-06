let database = null;

chrome.runtime.onInstalled.addListener(() => {

    const genres = [
        "Film & Animation",
        "Autos & Vehicles",
        "Music",
        "Pets & Animals",
        "Sports",
        "Travel & Events",
        "Gaming",
        "People & Blogs",
        "Comedy",
        "Entertainment",
        "News & Politics",
        "How-to & Style",
        "Education",
        "Science & Technology",
        "Nonprofits & Activism"
    ]

    chrome.storage.local.get(null, storage => {
        let updates = {};
        if (!storage["genres"]) {
            updates["genres"] = genres;
        }
        if (!storage["channels"]) {
            updates["channels"] = [];
        }
        if (!storage["timestart"]) {
            updates["timestart"] = (new Date()).getTime();
        }
        if (!storage["timePeriod"]) {
            updates["timePeriod"] = "Week";
        }

        chrome.storage.local.set(updates);

        const request = indexedDB.open('tubetime', 3);

        request.onsuccess = (event) => {
            database = event.target.result;
        };

        request.onupgradeneeded = (event) => {
            database = event.target.result;
            if (database.objectStoreNames.contains("videos")) return;

            // v = vid, g = genre, c = channel, t = sessions
            const objectStore = database.createObjectStore("videos", { keyPath: "v" });
            objectStore.createIndex("g", "g", { unique: false });
            objectStore.createIndex("c", "c", { unique: false });
            objectStore.createIndex("t", "t", { unique: false });

        };

    });


});

function processVidData(data) {
    if (data === null || data.vids === null) return;

    chrome.storage.local.get(["genres", "channels"], storage => {
        const request = indexedDB.open('tubetime', 3);
        request.onsuccess = () => {
            const store = request.result.transaction(["videos"], "readwrite").objectStore("videos");
            const vid = store.get(data.vids.id);

            vid.onsuccess = () => {

                const record = vid.result;
                const video = data.vids;
                const insert = {
                    "a": video["adSeconds"] === 0 ? 0 : Math.max(5, video["adSeconds"]),
                    "s": video["seconds"],
                    "t": video["start"]
                };

                if (record) {
                    record.ts.push(insert);
                    record.u = video.uploadDate;
                    store.put(record);
                } else {
                    let channel = storage["channels"].indexOf(video["channel"]);
                    if (channel === -1) {
                        channel = storage["channels"].length;
                        chrome.storage.local.set({ "channels": [...storage["channels"], video["channel"]] });
                    }
                    const genre = storage["genres"].indexOf(video["genre"]);
                    store.add({ "v": video.id, "c": channel, "g": genre, "u": video.uploadDate, "ts": [insert] });
                }
            }
        }
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "upload") {
        processVidData(message.data);
    }
});
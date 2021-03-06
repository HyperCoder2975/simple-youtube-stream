const request = require("superagent");
const url = require("url");
const Util = require("./util/Util");
const Constants = require("./util/Constants");

class YouTube {
    parseVideoID(input) {
        return new Promise((resolve, reject) => {
            let expr = /^[a-zA-Z0-9-_]{11}$/;
            if (expr.test(input)) return resolve(input);

            let parsedUrl = url.parse(input);
            let id = parsedUrl.query.v;
            if (!Constants.HOSTNAMES.includes(parsedUrl.hostname) && !id) {
                let split = parsedUrl.pathname.split("/");
                id = split[split.length - 1];
            }

            if (!id) return reject(Util.buildError(0));
            if (!expr.test(id)) return reject(Util.buildError(1));

            return resolve(id);
        });
    }

    fetchInfo(url, options = {}) {
        return new Promise((resolve, reject) => {
            this.parseVideoID(url).then(videoID => {
                let videoUrl = `${Constants.BASES.video}${videoID}`;

                request.get(videoUrl).end((err, res) => {
                    if (err) return reject(err);

                    let body = res.text;

                    let unavailableAlert = Util.fetchIn(body, "<div id=\"player-unavailable\"", ">");
                    if (!/\bhid\b/.test(Util.fetchIn(unavailableAlert, "class=\"", "\""))) {
                        unavailableAlert = Util.fetchIn(body, "<h1 id=\"unavailable-message\" class=\"message\">", "</h1>").trim();
                        if (unavailableAlert !== "Content Warning") return reject(Util.buildError(2, unavailableAlert));
                    }

                    return resolve(body); // This is just to use for something to return.
                });
            }).catch(reject);
        });
    }
}

module.exports = YouTube;

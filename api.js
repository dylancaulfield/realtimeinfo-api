var router = require("express").Router();
var axios = require("axios");
var xml2js = require("xml2js-es6-promise");


// /api
router.get("/irishrail/:station", async (req, res) => {

    try {
        var response = await axios.get("http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=" + req.params.station);
    } catch (e) {
        return res.sendStatus(500);
    }

    try {
        var js = await xml2js(response.data);
    } catch (e) {
        return res.sendStatus(500);
    }

    var results = js.ArrayOfObjStationData.objStationData;

    if (!results) {
        return res.json([]);
    }

    var getTrainType = (e) => {
        switch (e.Traincode[0].charAt(0)) {
            case "A":
                return "Intercity"
            case "D":
            case "P":
                return "Commuter"
            case "E":
                return "Dart"
            case "B":
                return "Bus"
            default:
                return ""
        }
    }

    var data = results.map(e => {
        return {
            due: parseInt(e.Duein[0]),
            destination: e.Destination[0],
            location: e.Lastlocation[0],
            type: getTrainType(e),
            late: parseInt(e.Late[0])
        }
    });

    res.json(data);

});

router.get("/bus/:stopid", async (req, res) => {

    try {
        var response = await axios.get("https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?format=json&stopid=" + req.params.stopid);
    } catch (e) {
        return res.sendStatus(500);
    }

    return res.json(response.data.results.map(e => {
        return {
            service: e.route,
            due: e.duetime,
            destination: e.destination
        }
    }));
});

router.get("/luas/:code", async (req, res) => {

    try {
        var response = await axios.get("https://luasforecasts.rpa.ie/xml/get.ashx?action=forecast&encrypt=false&stop=" + req.params.code);
    } catch (e) {
        return res.sendStatus(500);
    }

    try {
        var js = await xml2js(response.data);
    } catch (e) {
        return res.sendStatus(500);
    }

    var results = js.stopInfo.direction;

    var map = e => {
        return {
            due: e.$.dueMins === "DUE" ? 0 : parseInt(e.$.dueMins),
            destination: e.$.destination
        }
    }

    var filter = e => {
        return e.destination !== "No trams forecast" && due !== null;
    }

    var sort = (a, b) => {
        return a.due - b.due;
    }

    var inbound = results[0].tram.map(map).filter(filter);
    var outbound = results[1].tram.map(map).filter(filter);

    res.json(inbound.concat(outbound).sort(sort));

});

module.exports = router;
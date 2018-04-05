var express = require("express");
var app = new express();

// api
app.use("/", require("./api"));

var argv = require("minimist")(process.argv.slice(2));


app.listen(argv.port || argv.p || process.env.PORT);

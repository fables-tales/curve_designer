"use strict";
var nComponents = 18;

var nPoints = 100;
var baseCurve = makeBaseCurve();
var points;

function makeComponent(amplitude, frequency) {
    return {
        amplitude: amplitude,
        frequency: frequency
    }
}

function setupCanvas() {
    var cc = document.getElementsByClassName("canvas-container")[0];
    var rect = cc.getBoundingClientRect();
    var width = rect.width;
    var height = rect.height;

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.id = "canvas-actual";

    cc.appendChild(canvas);
    return canvas;
}

function makeBaseCurve() {
    var build = [];

    build.push(makeComponent(1, 1));

    while (build.length < nComponents) {
        build.push(makeComponent(0,0));
    }

    return build;
}

function evaluate(curve, x) {
    var build = 0.0;
    for (var i = 0; i < curve.length; i++) {
        var component = curve[i];
        build += component.amplitude*Math.sin(component.frequency*x);
    }

    return build;

}

var periodWidth = 2*Math.PI

function xPeriodToPixels(width, xPeriod) {
    var widthActual = width*0.9;
    return (xPeriod+1.0*Math.PI)/(2.0*Math.PI)*widthActual+(width-widthActual)/2.0;
}

function xPixelsToPeriod(width, xPixels) {
    var widthActual = width*0.9;
    var offset = (width-widthActual)/2
    var alongness = (xPixels-offset)/widthActual;
    var range = 2*Math.PI;
    var offset = -1.0*Math.PI;
    return (alongness * range) + offset;
}

function iterateXPeriod(cb) {
    var xPeriod = -1.0*Math.PI;
    while (xPeriod < 1.0*Math.PI) {
        cb(xPeriod);
        xPeriod += 2.0/nPoints;
    }
}

function computePoints(width, height, curve) {
    var build = [];
    iterateXPeriod(function(xPeriod) {
        var yPeriod = evaluate(curve, xPeriod);
        var xPixels = xPeriodToPixels(width, xPeriod);
        var yPixels = (-yPeriod+1.0)/(2.0)*height;
        build.push([xPixels, yPixels]);
    });

    return build;
}

function plotCurve(canvas, color, curve) {
    var points = computePoints(canvas.width, canvas.height, curve);
    plotPoints(canvas, color, points);
}

function plotPoints(canvas, color, points) {
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(points[0][0],points[0][1]);
    for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0],points[i][1]);
    }
    ctx.stroke();
}

function plotAxes(canvas) {
    var ctx = canvas.getContext("2d");
    var xCentre = canvas.width/2;
    var yCentre = canvas.height/2;

    // y axis line
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(xCentre, 0);
    ctx.lineTo(xCentre, canvas.height);
    ctx.stroke();

    // x axis line
    ctx.strokeStyle = "#000000";
    ctx.beginPath();
    ctx.moveTo(0, yCentre);
    ctx.lineTo(canvas.width, yCentre);
    ctx.stroke();

    var i = 0;
    iterateXPeriod(function(xPeriod) {
        var xPixels = xPeriodToPixels(canvas.width, xPeriod);
        if ((i+2) % 10 === 0) {
            ctx.strokeStyle = "#eeeeee";
            ctx.beginPath();
            ctx.moveTo(xPixels, 0);
            ctx.lineTo(xPixels, canvas.height);
            ctx.stroke();
        }
        i += 1;
    });
}

function setupHandlers(canvas) {
    var clicking = false;
    var lastMoved = null;

    canvas.addEventListener("mousedown", function(e) {
        clicking = true
    });

    canvas.addEventListener("mouseup", function(e) {
        clicking = false;
        lastMoved = null;
    });

    canvas.addEventListener("mouseleave", function(e) {
        clicking = false;
        lastMoved = null;
    });

    canvas.addEventListener("mousemove", function(e) {
        if (!clicking) {
            return;
        }

        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;

        var widthActual = canvas.width*0.9;
        var edge = (canvas.width-widthActual)/2.0;
        if ((x < edge) || x > (canvas.width-edge)) {
            return;
        }

        var pointOfLeastDistance = null;
        var bestDistance = 100000000000;
        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            var dx = (point[0]-x);
            var distance = Math.abs(dx);
            if (distance < bestDistance) {
                pointOfLeastDistance = i;
                bestDistance = distance;
            }
        }

        points[pointOfLeastDistance] = [x,y];

        if (lastMoved !== null) {
            var yLast = points[lastMoved][1];
            var start,stop;
            if (lastMoved < pointOfLeastDistance) {
                start = lastMoved;
                stop = pointOfLeastDistance;
            } else {
                start  = pointOfLeastDistance;
                stop = lastMoved;
            }

            for (var i=start; i < stop; i++) {
                points[i][1] = y+(y-yLast)/(stop-start);
            }
        }

        lastMoved = pointOfLeastDistance;

        if (pointOfLeastDistance === 0) {
            points[points.length-1][1] = points[0][1];
        }

        if (pointOfLeastDistance === points.length -1) {

        }
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        plotAxes(canvas);
        plotPoints(canvas, "#FF0000", points);
    });
}

function main() {
    var canvas = setupCanvas();
    points = computePoints(canvas.width, canvas.height, baseCurve);
    setupHandlers(canvas);
    plotAxes(canvas);
    plotPoints(canvas, "#FF0000", points);


    document.getElementById("tf-approximate").addEventListener("click", function() {
        var width = canvas.width;
        var height = canvas.height;
        var periodPoints = [];
        for (var i = 0; i < points.length; i++) {
            var xPixels = points[i][0];
            var yPixels = points[i][1];

            var xPeriod = xPixelsToPeriod(width, xPixels);
            var alongness = yPixels/height;
            var range = 2;
            var offset = -1
            var yPeriod = -1*(alongness*range+offset);
            periodPoints.push([xPeriod, yPeriod]);
        }


        var curvePoints = approximator(
            periodPoints,
            function(params) {
                var build = [];
                for (var i = 0; i < params.length; i++) {
                    build.push(makeComponent(params[i][0], params[i][1]));
                }
                var ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                plotAxes(canvas);
                plotPoints(canvas, "#ff0000", points);
                console.log("===========");
                plotCurve(canvas, "#0000ff", build)
            }
        );
    });
}

if (document.readyState === "interactive") {
    main();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        main();
    });
}

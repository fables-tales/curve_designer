function compareArrays(a1, a2) {
    if (a1.length != a2.length) {
        return false;
    }

    var equal = true;
    for (var i = 0; i < a1.length; i++) {
        equal = equal & a1[i] == a2[i];
    }

    return equal;
}
function computeOscillator(params, x) {
    if (!compareArrays(params.shape, [nComponents, 2])) {
        throw "nope"
    }

    x = tf.reshape(x, [-1, 1, 1])

    return tf.tidy(function() {
        var build = tf.zeros([1]);
        for (var i = 0; i < nComponents; i++) {
            build = tf.add(build,
                tf.mul(
                    tf.slice2d(params,[i,0], [1,1]),
                    tf.sin(
                        tf.mul(
                            tf.add(1.0, tf.slice2d(params, [i, 1], [1,1])),
                            x
                        )
                    )
                )
            )
        }
        return build;
    });
}

window.approximator = function(points, draw) {
    var params = tf.tensor2d([
        [1.0,0.0],
        [0.25,2],
        [0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0],
        [0.0,0.0]
    ]);
    //var params = tf.randomUniform([18,2],0,0.1);

    var draw = draw;

    var tfParams = tf.variable(params);
    console.log(tfParams.shape);

    var xActual = [];
    var yActual = [];
    for (var i = 0; i < points.length; i++) {
        xActual.push(points[i][0]);
        yActual.push(points[i][1]);
    }

    var optimizer = tf.train.rmsprop(0.001);

    var yActualTensor = tf.reshape(tf.tensor(yActual), [-1, 1, 1]);

    var singlePass = function() {
        var yPred = computeOscillator(tfParams, xActual);
        var loss = tf.sum(tf.abs(tf.sub(yPred, yActualTensor)));
        loss.print();
        tfParams.data().then(function(data) {
            tfParams.print();
            var build = [];
            for (var i = 1; i < data.length; i += 2) {
                build.push([data[i-1],data[i]+1]);
            }
            draw(build);
        });
        return loss;
    }

    singlePass();


    var i = 0;
    var c = 300;
    var interval = setInterval(function() {
        console.log(i);
        i += 1;
        if (i == c) {
            clearInterval(interval);
        }
        optimizer.minimize(function() {
            return singlePass();
        }, false, [tfParams]);
    }, 1);

    //console.log(tfParams.print());
}

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
    if (!compareArrays(params.shape, [nComponents, 3])) {
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
                        tf.add(
                            tf.mul(
                                tf.add(1.0, tf.slice2d(params, [i, 1], [1,1])),
                                x
                            ),
                            tf.slice2d(params, [i, 2], [1,1])
                        )
                    )
                )
            )
        }
        return build;
    });
}

window.approximator = function(points, draw) {
    //var params = tf.tensor2d([
    //    [1.0  , 0.0,Math.PI] ,
    //    [0.0 , 2.0,0.0]   ,
    //    [0    , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0] ,
    //    [0.0  , 0.0,0.0]
    //]);

    var params = tf.randomUniform([nComponents, 3],-Math.PI, Math.PI);

    var draw = draw;

    var tfParams = tf.variable(params);
    console.log(tfParams.shape);

    var xActual = [];
    var yActual = [];
    for (var i = 0; i < points.length; i++) {
        xActual.push(points[i][0]);
        yActual.push(points[i][1]);
    }

    var optimizer = tf.train.adam(0.01);

    var yActualTensor = tf.reshape(tf.tensor(yActual), [-1, 1, 1]);

    var singlePass = function() {
        var yPred = computeOscillator(tfParams, xActual);
        var loss = tf.sum(tf.abs(tf.sub(yPred, yActualTensor)));
        loss.print();
        tfParams.data().then(function(data) {
            var build = [];
            for (var i = 2; i < data.length; i += 3) {
                build.push([data[i-2],data[i-1]+1,data[i]]);
            }
            draw(build);
        });
        return loss;
    }

    singlePass();

    var i = 0;
    var c1 = 300;
    var c2 = 1000;
    var c3 = 1000;
    var optimizer = tf.train.adam(0.01);
    var optimizer2 = tf.train.adam(0.0005);
    var optimizer3 = tf.train.adam(0.0001);
    var interval = setInterval(function() {
        console.log(i);
        console.log(optimizer);
        i += 1;
        if (i == c1) {
            optimizer = optimizer2;
        }
        if (i == c1+c2) {
            optimizer = optimizer3;
        }
        if (i == c1+c2+c3) {
            clearInterval(interval);
        }
        optimizer.minimize(function() {
            return singlePass();
        }, false, [tfParams]);
    }, 1);


    //console.log(tfParams.print());
}

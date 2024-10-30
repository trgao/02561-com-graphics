/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

window.onload = function init() {
    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var numSubdivs = 5;
    // 4 points of tetrahedron
    var va = vec4(0.0, 0.0, 1.0, 1.0);
    var vb = vec4(0.0, 0.942809, -0.333333, 1.0);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1.0);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1.0);

    var lightPos = vec4(0.0, 0.0, -1.0, 0.0);
    var lightIntensity = vec4(1.0, 1.0, 1.0, 1.0);
    var le = 0.0;
    var la = vec4(0.5, 0.5, 0.5, 1.0);
    var kd = vec4(0.5, 0.5, 0.5, 1.0);
    var ks = vec4(0.5, 0.5, 0.5, 1.0);
    var s = 500.0;

    gl.uniform4fv(gl.getUniformLocation(program, "lightPos"), flatten(lightPos));
    gl.uniform4fv(gl.getUniformLocation(program, "lightIntensity"), flatten(lightIntensity));
    gl.uniform1f(gl.getUniformLocation(program, "le"), le);
    gl.uniform4fv(gl.getUniformLocation(program, "la"), flatten(la));
    gl.uniform4fv(gl.getUniformLocation(program, "kd"), flatten(kd));
    gl.uniform4fv(gl.getUniformLocation(program, "ks"), flatten(ks));
    gl.uniform1f(gl.getUniformLocation(program, "s"), s);

    var pointsArray = [];
    var normalsArray = [];
    var theta = 0;

    var quadVertices = [
        vec4(-1.0, -1.0, 0.999, 1.0),
        vec4(1.0, -1.0, 0.999, 1.0),
        vec4(1.0,  1.0, 0.999, 1.0),
        vec4(-1.0, -1.0, 0.999, 1.0),
        vec4(1.0,  1.0, 0.999, 1.0),
        vec4(-1.0,  1.0, 0.999, 1.0)
    ];
    for (var i = 0; i < 6; ++i) {
        pointsArray.push(quadVertices[i]);
    }

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
    var vNormal = gl.getAttribLocation(program, "a_Normal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var g_tex_ready = 0;
    function initTexture() {
        var cubemap = [
            '../textures/cm_left.png', // POSITIVE_X
            '../textures/cm_right.png', // NEGATIVE_X
            '../textures/cm_top.png', // POSITIVE_Y
            '../textures/cm_bottom.png', // NEGATIVE_Y
            '../textures/cm_back.png', // POSITIVE_Z
            '../textures/cm_front.png' // NEGATIVE_Z
        ];

        gl.activeTexture(gl.TEXTURE0);
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        for(var i = 0; i < 6; ++i) {
            var image = document.createElement('img');
            image.crossorigin = 'anonymous';
            image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;
            image.onload = function(event) {
                var image = event.target;
                gl.activeTexture(gl.TEXTURE0);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
                ++g_tex_ready;
            };
            image.src = cubemap[i];
        }
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
    }

    var texMatrixLoc = gl.getUniformLocation(program, "texMatrix");
    var modelViewLoc = gl.getUniformLocation(program, "modelView");
    var projectionLoc = gl.getUniformLocation(program, "projection");
    var fov = 45;
    var aspect = canvas.width / canvas.height;
    var near = 1;
    var far = 10;

    function tetrahedron(a, b, c, d, n) {
        divideTriangle(a, b, c, n);
        divideTriangle(d, c, b, n);
        divideTriangle(a, d, b, n);
        divideTriangle(a, c, d, n);
    }

    function divideTriangle(a, b, c, count) {
        if (count > 0) {
            var ab = normalize(mix(a, b, 0.5), true);
            var ac = normalize(mix(a, c, 0.5), true);
            var bc = normalize(mix(b, c, 0.5), true);
            divideTriangle(a, ab, ac, count - 1);
            divideTriangle(ab, b, bc, count - 1);
            divideTriangle(bc, c, ac, count - 1);
            divideTriangle(ab, bc, ac, count - 1);
        } else {
            triangle(a, b, c);
        }
    }

    function triangle(a, b, c){
        pointsArray.push(a);
        pointsArray.push(b);
        pointsArray.push(c);
        normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
        normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
        normalsArray.push(vec4(c[0], c[1], c[2], 0.0));
    }

    function initSphere(gl, numSubdivs) {
        tetrahedron(va, vb, vc, vd, numSubdivs);
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    }
    
    function render() {
        if (g_tex_ready < 6) {
            requestAnimationFrame(render);
            return;
        }
        gl.clear(gl.COLOR_BUFFER_BIT | gl.GL_DEPTH_BUFFER_BIT);
        theta += 0.02;
        var eye = vec3(5.0 * Math.sin(theta), 0.0, 5.0 * Math.cos(theta));
        var at  = vec3(0.0, 0.0, 0.0);
        var up  = vec3(0.0, 1.0, 0.0);
        var modelView = lookAt(eye, at, up);
        var projection = perspective(fov, aspect, near, far);
        eyeLoc = gl.getUniformLocation(program, "eyePos");
		gl.uniform3fv(eyeLoc, flatten(eye));
        reflectiveLoc = gl.getUniformLocation(program, "reflective");
        gl.uniform1i(reflectiveLoc, false);
        gl.uniformMatrix4fv(modelViewLoc, false, flatten(mat4()));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(mat4()));
        gl.uniformMatrix4fv(texMatrixLoc, false, flatten(mult(inverse4(modelView), inverse4(projection))));
        gl.drawArrays(gl.TRIANGLES, 0, quadVertices.length);
        gl.uniform1i(reflectiveLoc, true);
        gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        gl.uniformMatrix4fv(texMatrixLoc, false, flatten(mat4()));
        gl.drawArrays(gl.TRIANGLES, quadVertices.length, pointsArray.length - quadVertices.length - 10);
        requestAnimationFrame(render);
    }
    initTexture();
    initSphere(gl, numSubdivs);
    render();
}

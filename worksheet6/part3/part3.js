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

    var image = document.createElement('img');
    image.crossorigin = 'anonymous';
    image.onload = function () {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = 'earth.jpg';
    gl.uniform1i(gl.getUniformLocation(program, 'texMap'), 0);

    var modelViewLoc = gl.getUniformLocation(program, "modelView");
    var projectionLoc = gl.getUniformLocation(program, "projection");
    var fov = 45;
    var aspect = canvas.width / canvas.height;
    var near = 1;
    var far = 100;

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
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        initSphere(gl, numSubdivs);
        theta += 0.02;
        var eye = vec3(5.0 * Math.sin(theta), 0.0, 5.0 * Math.cos(theta));
        var at = vec3(0.0, 0.0, 0.0);
        var up = vec3(0.0, 1.0, 0.0);
        var modelView = lookAt(eye, at, up);
        var projection = perspective(fov, aspect, near, far);
        gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
        requestAnimationFrame(render);
    }

    render();
}

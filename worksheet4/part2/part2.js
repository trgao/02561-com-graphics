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

    var numSubdivs = 0;
    // 4 points of tetrahedron
    var va = vec4(0.0, 0.0, 1.0, 1.0);
    var vb = vec4(0.0, 0.942809, -0.333333, 1.0);
    var vc = vec4(-0.816497, -0.471405, -0.333333, 1.0);
    var vd = vec4(0.816497, -0.471405, -0.333333, 1.0);
    
    var pointsArray = [];

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var modelLoc = gl.getUniformLocation(program, "model");
    var viewLoc = gl.getUniformLocation(program, "view");
    var projectionLoc = gl.getUniformLocation(program, "projection");
    var fov = 45;
    var aspect = canvas.width / canvas.height;
    var near = -100;
    var far = 1;

    var eye = vec3(0.0, 0.0, 5.0);
    var at  = vec3(0.0, 0.0, 0.0);
    var up  = vec3(0.0, 1.0, 0.0);
    var model = mat4();
    var view = lookAt(eye, at, up);
    var projection = perspective(fov, aspect, near, far);
    gl.uniformMatrix4fv(modelLoc, false, flatten(model));
    gl.uniformMatrix4fv(viewLoc, false, flatten(view));
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));

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
    }

    function initSphere(gl, numSubdivs) {
        tetrahedron(va, vb, vc, vd, numSubdivs);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    }
    
    function render(numSubdivs) {
        initSphere(gl, numSubdivs);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.GL_DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
    }

    var increment = document.getElementById("increment");
    var decrement = document.getElementById("decrement");

    increment.addEventListener("click", function() {
        numSubdivs++;
        pointsArray = [];
        render(numSubdivs);
    });

    decrement.addEventListener("click", function() {
        if (numSubdivs > 0) numSubdivs--;
        pointsArray = [];
        render(numSubdivs);
    });

    render(numSubdivs);
}

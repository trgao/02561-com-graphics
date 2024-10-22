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
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    var vertices = [vec2(0, 0)];
    for (var i = 0; i <= 1000; ++i) {
        vertices.push(vec2(
            0.4 * Math.sin(2 * Math.PI * i / 1000),
            0.4 * Math.cos(2 * Math.PI * i / 1000)));
    }
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var displacement = 0.0;
    var goingUp = false;
    var displacementLoc = gl.getUniformLocation(program, "displacement");
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (displacement >= 0.5) {
            goingUp = false;
        } else if (displacement <= -0.5) {
            goingUp = true;
        }
        if (goingUp) {
            displacement += 0.01;
        } else {
            displacement -= 0.01;
        }
        gl.uniform1f(displacementLoc, displacement);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length);
        requestAnimationFrame(render);
    }
    
    render();
}

/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

window.onload = function init() {
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, numPoints);
    }

    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    var vBuffer = gl.createBuffer();
    var maxVert = 1000;
    var index = 0;
    var numPoints = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxVert * sizeof["vec2"], gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var colors = [
        vec4(0, 0, 0, 1),
        vec4(1, 0, 0, 1),
        vec4(1, 1, 0, 1),
        vec4(0, 1, 0, 1),
        vec4(0, 0, 1, 1),
        vec4(1, 0, 1, 1),
        vec4(0, 1, 1, 1),
        vec4(0.604, 0.808, 0.922, 1)
    ];
    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, maxVert * sizeof["vec4"], gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
    render();

    var colorMenu = document.getElementById("colorMenu");
    canvas.addEventListener("click", function(ev) {
        var bbox = ev.target.getBoundingClientRect();
        var mousePos = vec2(2 * (ev.clientX - bbox.left) / canvas.width - 1, 2 * (canvas.height - ev.clientY + bbox.top - 1) / canvas.height - 1);
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof["vec2"], flatten(mousePos));
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof["vec4"], flatten(colors[colorMenu.selectedIndex]));
        numPoints = Math.max(numPoints, ++index);
        index %= maxVert;
        render();
    });

    var clearButton = document.getElementById("button");
    var clearMenu = document.getElementById("clearMenu");
    clearButton.addEventListener("click", function() {
        var color = colors[clearMenu.selectedIndex];
        gl.clearColor(color[0], color[1], color[2], color[3]);
        numPoints = 0;
        index = 0;
        render();
    });
}

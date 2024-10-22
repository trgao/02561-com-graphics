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
    var drawMode = "point";

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    var vBuffer = gl.createBuffer();
    var maxVert = 10000;
    var index = 0;
    var numPoints = 0;
    var triPoints = [];
    var triColors = [];
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

    var colorMenu = document.getElementById("colorMenu");
    canvas.addEventListener("click", function(ev) {
        var bbox = ev.target.getBoundingClientRect();
        var mousePos = vec2(2 * (ev.clientX - bbox.left) / canvas.width - 1, 2 * (canvas.height - ev.clientY + bbox.top - 1) / canvas.height - 1);
        var currColor = colors[colorMenu.selectedIndex];
        var points = [];
        var pointColors = [];
        const offset = 0.04;
        if (drawMode == "point") {
            points = [vec2(mousePos[0] - offset, mousePos[1] - offset), vec2(mousePos[0] + offset, mousePos[1] - offset),
                      vec2(mousePos[0] - offset, mousePos[1] + offset), vec2(mousePos[0] - offset, mousePos[1] + offset),
                      vec2(mousePos[0] + offset, mousePos[1] - offset), vec2(mousePos[0] + offset, mousePos[1] + offset)];
            for (var i = 0; i < 6; ++i) {
                pointColors.push(currColor);
            }
        } else if (drawMode == "triangle") {
            if (triPoints.length == 2) {
                index -= 12;
                numPoints -= 12;
                triPoints.push(mousePos);
                triColors.push(currColor);
                points = triPoints;
                pointColors = triColors;
                triPoints = [];
                triColors = [];
            } else {
                points = [vec2(mousePos[0] - offset, mousePos[1] - offset), vec2(mousePos[0] + offset, mousePos[1] - offset),
                        vec2(mousePos[0] - offset, mousePos[1] + offset), vec2(mousePos[0] - offset, mousePos[1] + offset),
                        vec2(mousePos[0] + offset, mousePos[1] - offset), vec2(mousePos[0] + offset, mousePos[1] + offset)];
                for (var i = 0; i < 6; ++i) {
                    pointColors.push(currColor);
                }
                triPoints.push(mousePos);
                triColors.push(currColor);
            }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof["vec2"], flatten(points));
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, index * sizeof["vec4"], flatten(pointColors));
        index += points.length;
        numPoints += points.length;
        index %= maxVert;
        render();
    });

    var clearButton = document.getElementById("clearButton");
    var clearMenu = document.getElementById("clearMenu");
    clearButton.addEventListener("click", function() {
        var color = colors[clearMenu.selectedIndex];
        gl.clearColor(color[0], color[1], color[2], color[3]);
        numPoints = 0;
        index = 0;
        render();
    });

    var pointButton = document.getElementById("pointButton");
    pointButton.addEventListener("click", function() {
        drawMode = "point";
    });

    var triangleButton = document.getElementById("triangleButton");
    triangleButton.addEventListener("click", function() {
        triPoints = [];
        triColors = [];
        drawMode = "triangle";
    });

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, numPoints);
    }

    render();
}

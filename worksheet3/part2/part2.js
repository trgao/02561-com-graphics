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
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    
    var ext = gl.getExtension("OES_element_index_uint");
    if (!ext) {
        console.log("Warning: Unable to use an extension");
    }

    var wire_indices = new Uint32Array([
        0, 1, 1, 2, 2, 3, 3, 0, // front
        2, 3, 3, 7, 7, 6, 6, 2, // right
        0, 3, 3, 7, 7, 4, 4, 0, // down
        1, 2, 2, 6, 6, 5, 5, 1, // up
        4, 5, 5, 6, 6, 7, 7, 4, // back
        0, 1, 1, 5, 5, 4, 4, 0  // left
    ]);

    var vertices = [
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0),
    ];

    var iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(wire_indices), gl.STATIC_DRAW);
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    function render() {
        var modelLoc = gl.getUniformLocation(program, "model");
        var viewLoc = gl.getUniformLocation(program, "view");
        var projectionLoc = gl.getUniformLocation(program, "projection");
        var fov = 45;
        var aspect = canvas.width / canvas.height;
        var near = -100;
        var far = 1;

        var eye = vec3(0.0, 0.0, 10.0);
        var at  = vec3(0.0, 0.0, 0.0);
        var up  = vec3(0.0, 1.0, 0.0);
        var model = translate(-3.0, -0.5, 0.0);
        model = mult(rotateY(-15), model);
        var view = lookAt(eye, at, up);
        var projection = perspective(fov, aspect, near, far);
        gl.uniformMatrix4fv(modelLoc, false, flatten(model));
        gl.uniformMatrix4fv(viewLoc, false, flatten(view));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        gl.clear(gl.COLOR_BUFFER_BIT | gl.GL_DEPTH_BUFFER_BIT);
        gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);

        model = translate(0.0, -0.5, 0.0);
        model = mult(rotateY(45), model);
        model = mult(rotateX(34), model);
        gl.uniformMatrix4fv(modelLoc, false, flatten(model));
        gl.uniformMatrix4fv(viewLoc, false, flatten(view));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);

        model = translate(3.0, -0.5, 0.0);
        model = mult(rotateY(57), model);
        gl.uniformMatrix4fv(modelLoc, false, flatten(model));
        gl.uniformMatrix4fv(viewLoc, false, flatten(view));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        gl.drawElements(gl.LINES, wire_indices.length, gl.UNSIGNED_INT, 0);
    }

    render();
}

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

    var circulation = true;
    var theta = 0;
    
    var vertices = [
        vec3(-2.0, -1.0, -1.0),
        vec3(2.0, -1.0, -1.0),
        vec3(2.0, -1.0, -5.0),
        vec3(-2.0, -1.0, -5.0),
        vec3(0.25, -0.5, -1.25),
        vec3(0.75, -0.5, -1.25),
        vec3(0.75, -0.5, -1.75),
        vec3(0.25, -0.5, -1.75),
        vec3(-1.0, -1.0, -2.5),
        vec3(-1.0, 0.0, -2.5),
        vec3(-1.0, 0.0, -3),
        vec3(-1.0, -1.0, -3)
    ];

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var texCoords = [
        vec2(-1.0, -1.0),
        vec2(-1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, -1.0),
        vec2(-1.0, -1.0),
        vec2(-1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, -1.0),
        vec2(-1.0, -1.0),
        vec2(-1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, -1.0)
    ];

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
    var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    var modelLoc = gl.getUniformLocation(program, "model");
    var viewLoc = gl.getUniformLocation(program, "view");
    var projectionLoc = gl.getUniformLocation(program, "projection");
    var fov = 90;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 100;

    var model = mat4();
    var view = mat4();
    var projection = perspective(fov, aspect, near, far);
    gl.uniformMatrix4fv(modelLoc, false, flatten(model));
    gl.uniformMatrix4fv(viewLoc, false, flatten(view));
    gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));

    var texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    var img = document.createElement('img');
    img.crossorigin = 'anonymous';
    img.onload = function(event) {
        var image = event.target;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    img.src = '../xamp23.png';

    var texture2 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    var mp = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, -1.0 / (2.0 + 1.0 + 0.001), 0.0, 0.0
    );

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (circulation) theta += 0.02;
        var indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11];
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
        gl.uniformMatrix4fv(modelLoc, false, flatten(model));
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
        gl.uniform1i(gl.getUniformLocation(program, "visibility"), 1);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
        gl.depthFunc(gl.GREATER);
        var shadowModel = mult(translate(2 * Math.sin(theta), 2, -2 + 2 * Math.cos(theta)), mult(mp, translate(-2 * Math.sin(theta), -2, -(-2 + 2 * Math.cos(theta)))));
        gl.uniformMatrix4fv(modelLoc, false, flatten(shadowModel));
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
        gl.uniform1i(gl.getUniformLocation(program, "visibility"), 0);
        gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6);
        gl.depthFunc(gl.LESS);
        gl.uniformMatrix4fv(modelLoc, false, flatten(model));
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 1);
        gl.uniform1i(gl.getUniformLocation(program, "visibility"), 1);
        gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6);
        if (circulation) requestAnimationFrame(render);
    }

    var circulationButton = document.getElementById("circulation");
    circulationButton.addEventListener("click", function() {
        circulation = !circulation;
        if (circulation) requestAnimationFrame(render);
    });
    
    render();
}

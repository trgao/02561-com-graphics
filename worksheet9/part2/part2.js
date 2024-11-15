/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

window.onload = async function init() {
    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    var circulation = true;
    var bob = true;
    var theta = 0;
    var alpha = 0;
    
    // Load ground
    var groundProgram = initShaders(gl, "vertex-shader-ground", "fragment-shader-ground");
    gl.useProgram(groundProgram);

    var vertices = [
        vec3(-2.0, -1.0, -1.0),
        vec3(2.0, -1.0, -1.0),
        vec3(2.0, -1.0, -5.0),
        vec3(-2.0, -1.0, -5.0)
    ];
    var texCoords = [
        vec2(-1.0, -1.0),
        vec2(-1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(1.0, -1.0)
    ];
    var indices = [0, 1, 2, 0, 2, 3];

    var gvBuffer = gl.createBuffer();
    var gtBuffer = gl.createBuffer();
    var gindexBuffer = gl.createBuffer();

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

    // Load teapot
    var teapotProgram = initShaders(gl, "vertex-shader-teapot", "fragment-shader-teapot");
    gl.useProgram(teapotProgram);

    var tvBuffer = gl.createBuffer();
    var tcBuffer = gl.createBuffer();
    var tindexBuffer = gl.createBuffer();
    
    var drawingInfo = await readOBJFile("../teapot/teapot.obj", 0.25, true);

    var fov = 90;
    var aspect = canvas.width / canvas.height;
    var near = 0.1;
    var far = 20;

    var model = mat4();
    var view = mat4();
    var projection = perspective(fov, aspect, near, far);
    
    var mp = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, -1.0 / (2.0 + 1.0 + 0.001), 0.0, 0.0
    );

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (circulation) theta += 0.02;
        if (bob) alpha += 0.02;

        // Render ground
        gl.useProgram(groundProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, gvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        var vPosition = gl.getAttribLocation(groundProgram, "a_Position");
        gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, gtBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
        var vTexCoord = gl.getAttribLocation(groundProgram, "vTexCoord");
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vTexCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gindexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

        var modelLoc = gl.getUniformLocation(groundProgram, "model");
        var viewLoc = gl.getUniformLocation(groundProgram, "view");
        var projectionLoc = gl.getUniformLocation(groundProgram, "projection");
        gl.uniformMatrix4fv(modelLoc, false, flatten(model));
        gl.uniformMatrix4fv(viewLoc, false, flatten(view));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        gl.uniform1i(gl.getUniformLocation(groundProgram, "texMap"), 0);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);

        // Render teapot
        if (drawingInfo) {
            gl.useProgram(teapotProgram);
            gl.depthFunc(gl.GREATER);

            gl.bindBuffer(gl.ARRAY_BUFFER, tvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
            var vPosition = gl.getAttribLocation(teapotProgram, "a_Position");
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            gl.bindBuffer(gl.ARRAY_BUFFER, tcBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
            var vColor = gl.getAttribLocation(teapotProgram, "a_Color");
            gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tindexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

            var modelViewLoc = gl.getUniformLocation(teapotProgram, "modelView");
            var projectionLoc = gl.getUniformLocation(teapotProgram, "projection");
            var modelView = translate(0, -0.25 - 0.75 * Math.sin(alpha), -3);
            var shadowModel = [
                translate(2 * Math.sin(theta), 2, -2 + 2 * Math.cos(theta)), 
                mp,
                translate(-2 * Math.sin(theta), -2, -(-2 + 2 * Math.cos(theta))),
                modelView
            ].reduce(mult);
            gl.uniformMatrix4fv(modelViewLoc, false, flatten(shadowModel));
            gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
            gl.uniform1i(gl.getUniformLocation(teapotProgram, "visibility"), 0);
            gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
            gl.depthFunc(gl.LESS);
            gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
            gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
            gl.uniform1i(gl.getUniformLocation(teapotProgram, "visibility"), 1);
            gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
        }
        requestAnimationFrame(render);
    }

    var circulationButton = document.getElementById("circulation");
    circulationButton.addEventListener("click", function() {
        circulation = !circulation;
    });

    var bobButton = document.getElementById("bob");
    bobButton.addEventListener("click", function() {
        bob = !bob;
    });
    
    render();
}

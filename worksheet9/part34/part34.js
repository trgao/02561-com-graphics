/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

function initFramebufferObject(gl, width, height) {
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    var shadowMap = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shadowMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    framebuffer.texture = shadowMap;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Framebuffer object is incomplete: ' + status.toString());
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    framebuffer.width = width;
    framebuffer.height = height;
    return framebuffer;
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
        vec4(-2.0, -1.0, -1.0, 1.0),
        vec4(2.0, -1.0, -1.0, 1.0),
        vec4(2.0, -1.0, -5.0, 1.0),
        vec4(-2.0, -1.0, -5.0, 1.0)
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
    var tnBuffer = gl.createBuffer();
    var tcBuffer = gl.createBuffer();
    var tindexBuffer = gl.createBuffer();
    
    var drawingInfo = await readOBJFile("../teapot/teapot.obj", 0.25, true);

    // Load shadow
    var shadowProgram = initShaders(gl, "vertex-shader-shadow", "fragment-shader-shadow");
    gl.useProgram(shadowProgram);

    var fbo = initFramebufferObject(gl, 1024, 1024);

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (circulation) theta += 0.02;
        if (bob) alpha += 0.02;

        // Camera model view projection
        var fov = 90;
        var aspect = canvas.width / canvas.height;
        var near = 0.1;
        var far = 20;

        var projection = perspective(fov, aspect, near, far);

        // Light model view
        var eye = vec3(2 * Math.sin(theta), 2, -2 + 2 * Math.cos(theta));
        var at = vec3(0.0, -0.25 - 0.75 * Math.sin(alpha), -3.0);
        var up = vec3(0.0, 1.0, 0.0);
        var lightModelView = lookAt(eye, at, up);

        // Light projection
        var fov = 90;
        var aspect = canvas.width / canvas.height;
        var near = 1;
        var far = 20;

        var lightProjection = perspective(fov, aspect, near, far);

        // Render teapot
        if (drawingInfo) {
            var modelView = translate(0, -0.25 - 0.75 * Math.sin(alpha), -3);

            // Render teapot shadow mapping
            gl.useProgram(shadowProgram);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.viewport(0, 0, fbo.width, fbo.height);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.bindBuffer(gl.ARRAY_BUFFER, tvBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
            var vPosition = gl.getAttribLocation(shadowProgram, "a_Position");
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tindexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

            var modelViewLoc = gl.getUniformLocation(shadowProgram, "modelView");
            var projectionLoc = gl.getUniformLocation(shadowProgram, "projection");
            gl.uniformMatrix4fv(modelViewLoc, false, flatten(mult(lightModelView, modelView)));
            gl.uniformMatrix4fv(projectionLoc, false, flatten(lightProjection));
            gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);

            // Render teapot
            gl.useProgram(teapotProgram);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
            var lightModelViewLoc = gl.getUniformLocation(teapotProgram, "lightModelView");
            var lightProjectionLoc = gl.getUniformLocation(teapotProgram, "lightProjection");
            gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
            gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
            gl.uniformMatrix4fv(lightModelViewLoc, false, flatten(mult(lightModelView, modelView)));
            gl.uniformMatrix4fv(lightProjectionLoc, false, flatten(lightProjection));
            gl.uniform1i(gl.getUniformLocation(teapotProgram, "shadow"), 1);
            gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
        }
        
        // Render ground
        gl.useProgram(groundProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, gvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
        var vPosition = gl.getAttribLocation(groundProgram, "a_Position");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, gtBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);
        var vTexCoord = gl.getAttribLocation(groundProgram, "vTexCoord");
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vTexCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gindexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

        var modelViewLoc = gl.getUniformLocation(groundProgram, "modelView");
        var projectionLoc = gl.getUniformLocation(groundProgram, "projection");
        var lightModelViewLoc = gl.getUniformLocation(groundProgram, "lightModelView");
        var lightProjectionLoc = gl.getUniformLocation(groundProgram, "lightProjection");
        gl.uniformMatrix4fv(modelViewLoc, false, flatten(mat4()));
        gl.uniformMatrix4fv(lightModelViewLoc, false, flatten(lightModelView));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        gl.uniformMatrix4fv(lightProjectionLoc, false, flatten(lightProjection));
        gl.uniform1i(gl.getUniformLocation(groundProgram, "texMap"), 0);
        gl.uniform1i(gl.getUniformLocation(groundProgram, "shadow"), 1);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
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

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
    
    var vertices = [
        vec3(-4.0, -1.0, -1.0),
        vec3(4.0, -1.0, -1.0),
        vec3(4.0, -1.0, -21.0),
        vec3(-4.0, -1.0, -21.0),
    ];

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, "a_Position");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var texCoords = [
        vec2(-1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(-1.5, 10.0)
    ];
    var texSize = 64;
    var numRows = 8;
    var numCols = 8;
    var myTexels = new Uint8Array(4 * texSize * texSize); // 4 for RGBA image, texSize is the resolution
    for (var i = 0; i < texSize; ++i){
        for(var j = 0; j < texSize; ++j){
            var patchx = Math.floor(i/(texSize/numRows));
            var patchy = Math.floor(j/(texSize/numCols));
            var c = (patchx%2 !== patchy%2 ? 255 : 0);
            var idx = 4*(i*texSize + j);
            myTexels[idx] = myTexels[idx + 1] = myTexels[idx + 2] = c;
            myTexels[idx + 3] = 255
        }
    }

    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

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
    
    var indices = [0, 1, 2, 0, 2, 3];
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    function render() {
        gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    }

    var repeat = document.getElementById("repeat");
    var clampToEdge = document.getElementById("clamp-to-edge");
    var nearestMag = document.getElementById("nearest-mag");
    var linearMag = document.getElementById("linear-mag");
    var nearestMin = document.getElementById("nearest-min");
    var linearMin = document.getElementById("linear-min");
    var nearestMipmapNearest = document.getElementById("nearest-mipmap-nearest");
    var linearMipmapNearest = document.getElementById("linear-mipmap-nearest");
    var nearestMipmapLinear = document.getElementById("nearest-mipmap-linear");
    var linearMipmapLinear = document.getElementById("linear-mipmap-linear");

    repeat.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        render();
    });

    clampToEdge.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        render();
    });

    nearestMag.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        render();
    });

    linearMag.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        render();
    });

    nearestMin.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        render();
    });

    linearMin.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        render();
    });

    nearestMipmapNearest.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
        render();
    });

    linearMipmapNearest.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        render();
    });

    nearestMipmapLinear.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        render();
    });

    linearMipmapLinear.addEventListener("click", function() {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        render();
    });

    render();
}

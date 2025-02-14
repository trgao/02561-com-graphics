/**
* @param {Element} canvas. The canvas element to create a context from.
* @return {WebGLRenderingContext} The created context.
*/
function setupWebGL(canvas) {
    return WebGLUtils.setupWebGL(canvas);
}

// Create a buffer object and perform the initial configuration
function initVertexBuffers(gl) {
    var o = new Object();
    o.vertexBuffer = createEmptyArrayBuffer(gl, gl.program.a_Position, 4, gl.FLOAT);
    o.normalBuffer = createEmptyArrayBuffer(gl, gl.program.a_Normal, 4, gl.FLOAT);
    o.colorBuffer = createEmptyArrayBuffer(gl, gl.program.a_Color, 4, gl.FLOAT);
    o.indexBuffer = gl.createBuffer();

    return o;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    var buffer =  gl.createBuffer();  // Create a buffer object

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

    return buffer;
}

window.onload = async function init() {
    var canvas = document.getElementById("c");
    gl = setupWebGL(canvas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    var ext = gl.getExtension('OES_element_index_uint');
    if (!ext) {
        console.log('Warning: Unable to use an extension');
    }

    var lightPos = vec4(0.0, 0.0, -1.0, 0.0);
    var le = vec3(1.0, 1.0, 1.0);
    var ka = 0.5;
    var kd = 0.5;
    var ks = 0.5;
    var s = 10.0;

    gl.uniform4fv(gl.getUniformLocation(gl.program, "lightPos"), flatten(lightPos));
    gl.uniform3fv(gl.getUniformLocation(gl.program, "le"), le);
    gl.uniform1f(gl.getUniformLocation(gl.program, "ka"), ka);
    gl.uniform1f(gl.getUniformLocation(gl.program, "kd"), kd);
    gl.uniform1f(gl.getUniformLocation(gl.program, "ks"), ks);
    gl.uniform1f(gl.getUniformLocation(gl.program, "s"), s);

    // Get the storage locations of attribute and uniform variables
    gl.program.a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.program.a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    gl.program.a_Color = gl.getAttribLocation(gl.program, 'a_Color');

    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl, gl.program);
    
    // Start reading the OBJ file
    var drawingInfo = await readOBJFile("../suzanne/suzanne.obj", 1, true);

    var theta = 0;
    var orbit = true;

    var modelViewLoc = gl.getUniformLocation(gl.program, "modelView");
    var projectionLoc = gl.getUniformLocation(gl.program, "projection");
    var fov = 45;
    var aspect = canvas.width / canvas.height;
    var near = 1;
    var far = 20;
    
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (orbit) theta += 0.02;
        var eye = vec3(7.0 * Math.sin(theta), 0.0, 7.0 * Math.cos(theta));
        var at = vec3(0.0, 0.0, 0.0);
        var up = vec3(0.0, 1.0, 0.0);
        var modelView = lookAt(eye, at, up);
        var projection = perspective(fov, aspect, near, far);
        gl.uniformMatrix4fv(modelViewLoc, false, flatten(modelView));
        gl.uniformMatrix4fv(projectionLoc, false, flatten(projection));
        if (drawingInfo) {
            gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);
            gl.drawElements(gl.TRIANGLES, drawingInfo.indices.length, gl.UNSIGNED_INT, 0);
        }
        requestAnimationFrame(render);
    }

    var orbitButton = document.getElementById("orbit");
    orbitButton.addEventListener("click", function() {
        orbit = !orbit;
    });

    var leslide = document.getElementById("le");
    var kaslide = document.getElementById("ka");
    var kdslide = document.getElementById("kd");
    var ksslide = document.getElementById("ks");
    var sslide = document.getElementById("s");

    leslide.addEventListener("input", function(event) {
        le = vec3(event.target.value, event.target.value, event.target.value);
        gl.uniform3fv(gl.getUniformLocation(gl.program, "le"), le);
        if (!orbit) render();
    });
    kaslide.addEventListener("input", function(event) {
        ka = event.target.value;
        gl.uniform1f(gl.getUniformLocation(gl.program, "ka"), ka);
        if (!orbit) render();
    });
    kdslide.addEventListener("input", function(event) {
        kd = event.target.value;
        gl.uniform1f(gl.getUniformLocation(gl.program, "kd"), kd);
        if (!orbit) render();
    });
    ksslide.addEventListener("input", function(event) {
        ks = event.target.value;
        gl.uniform1f(gl.getUniformLocation(gl.program, "ks"), ks);
        if (!orbit) render();
    });
    sslide.addEventListener("input", function(event) {
        s = event.target.value;
        gl.uniform1f(gl.getUniformLocation(gl.program, "s"), s);
        if (!orbit) render();
    });

    render();
}

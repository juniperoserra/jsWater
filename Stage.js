/**
 * jsWater pressure-based fluid simulation
 * http://www.upfork.com/
 * Simon Greenwold
 *
 * Some code taken from  KineticJS 2d JavaScript Library v1.0.3
 * http://www.kineticjs.com/
 * Copyright 2011, Eric Rowell
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: November 3 2011
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


var Stage = function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.drawStage = undefined;

    // desktop flags
    this.mousePos = null;

    // mobile flags
    this.touchPos = null;

    // Animation
    this.t = 0;
    this.timeInterval = 0;
    this.startTime = 0;
    this.lastTime = 0;
    this.frame = 0;
    this.animating = false;

    // provided by Paul Irish says Eric Rowell
    window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    })();
};

// ======================================= GENERAL
// =======================================

Stage.prototype.getContext = function() {
    return this.context;
};

Stage.prototype.getCanvas = function() {
    return this.canvas;
};

Stage.prototype.clear = function() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

Stage.prototype.getCanvasPos = function() {
    var obj = this.getCanvas();
    var top = 0;
    var left = 0;
    while(obj.tagName != "BODY") {
        top += obj.offsetTop;
        left += obj.offsetLeft;
        obj = obj.offsetParent;
    }
    return {
        top : top,
        left : left
    };
};

Stage.prototype._drawStage = function() {
    if(this.drawStage !== undefined) {
        this.drawStage();
    }
};

Stage.prototype.setDrawStage = function(func) {
    var that = this;
    this.drawStage = func;
    this.canvas.addEventListener("mousemove", function(evt) {
        that.setMousePosition(evt);
    }, false);
    this.canvas.addEventListener("touchmove", function(evt) {
        evt.preventDefault();
        that.setTouchPosition(evt);
    }, false);
};

Stage.prototype.getMousePos = function(evt) {
    return this.mousePos;
};

Stage.prototype.getTouchPos = function(evt) {
    return this.touchPos;
};

Stage.prototype.setMousePosition = function(evt) {
    var mouseX = evt.clientX - this.getCanvasPos().left + window.pageXOffset;
    var mouseY = evt.clientY - this.getCanvasPos().top + window.pageYOffset;
    this.mousePos = {
        x : mouseX,
        y : mouseY
    };
};

Stage.prototype.setTouchPosition = function(evt) {
    if(evt.touches !== undefined && evt.touches.length == 1) { // Only deal with
        // one finger
        var touch = evt.touches[0];
        // Get the information for finger #1
        var touchX = touch.pageX - this.getCanvasPos().left + window.pageXOffset;
        var touchY = touch.pageY - this.getCanvasPos().top + window.pageYOffset;

        this.touchPos = {
            x : touchX,
            y : touchY
        };
    }
};


// ======================================= ANIMATION
// =======================================

Stage.prototype.isAnimating = function() {
    return this.animating;
};

Stage.prototype.getFrame = function() {
    return this.frame;
};

Stage.prototype.startAnimation = function() {
    this.animating = true;
    var date = new Date();
    this.startTime = date.getTime();
    this.lastTime = this.startTime;

    this._drawStage();

    this.animationLoop();
};

Stage.prototype.stopAnimation = function() {
    this.animating = false;
};

Stage.prototype.getTimeInterval = function() {
    return this.timeInterval;
};

Stage.prototype.getTime = function() {
    return this.t;
};

Stage.prototype.getFps = function() {
    return this.timeInterval > 0 ? 1000 / this.timeInterval : 0;
};

Stage.prototype.animationLoop = function() {
    var that = this;

    this.frame++;
    var date = new Date();
    var thisTime = date.getTime();
    this.timeInterval = thisTime - this.lastTime;
    this.t += this.timeInterval;
    this.lastTime = thisTime;

    this._drawStage();

    if(this.animating) {
        requestAnimFrame(function() {
            that.animationLoop();
        });

    }
};
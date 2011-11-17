/**
 * mouseDragTracker v0.01
 * http://www.upfork.com/
 * Copyright 2011, Simon Greenwold
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: November 16 2011
 *
 * Copyright (C) 2011 by Simon Greenwold
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
 
 var create_drag_tracker = function (elementId) {
  var dragTracker = {};
  var element = document.getElementById(elementId);
  var buttonState = [];
  var mousePressedInElement = [];
  var dragStateChangedFunction = undefined;
  
  function getButtonState( buttonNumber )
  {
    // Takes care of the case where the array index hasn't been assigned yet
    return ( buttonState[buttonNumber] === true );
  }
  
  function getMousePressedInElement( buttonNumber )
  {
    // Takes care of the case where the array index hasn't been assigned yet
    return ( mousePressedInElement[buttonNumber] === true );
  }
  
  function whichButton(evt)
  {
    return evt.which;
  }
  
  function makeStateChangeAnnouncerWrapper( wrappedFunc )
  {
    var stateChangeAnnouncerWrapper = function( evt )
    {
      var previousDragState = dragTracker.isDragging(whichButton(evt));
      
      wrappedFunc(evt);
      
      if (dragStateChangedFunction != undefined && previousDragState != dragTracker.isDragging(whichButton(evt))) {
        dragStateChangedFunction( dragTracker, whichButton(evt) );
      }
    }
    return stateChangeAnnouncerWrapper;
  }
  
  document.addEventListener("mouseup", makeStateChangeAnnouncerWrapper( function(evt) {
      buttonState[whichButton(evt)] = false;
      mousePressedInElement[whichButton(evt)] = false;
  } ), false);
  
  document.addEventListener("mousedown", makeStateChangeAnnouncerWrapper( function(evt) {
    buttonState[whichButton(evt)] = true;
  } ), false);
    
  element.addEventListener("mousedown", makeStateChangeAnnouncerWrapper( function(evt) {
    mousePressedInElement[whichButton(evt)] = true;
  } ), false);
  
  element.addEventListener("contextmenu", function(evt) {
    if (dragTracker.contextMenuEnabled)
    {
      return true;
    }
    else
    {
      if (evt.preventDefault)
        evt.preventDefault();
      else
        evt.returnValue= false;
    }  
    return false;
  }, false );
  
  
  // public API  
  dragTracker.isDragging = function ( buttonNumber )
  {
    return getButtonState(buttonNumber) && getMousePressedInElement( buttonNumber );
  };
  
  dragTracker.isDraggingLeftButton = function ()
  {
    return getButtonState(1) && getMousePressedInElement(1);
  };
  
  dragTracker.setDragStateChangedFunction = function ( func )
  {
    dragStateChangedFunction = func;
  }
  
  // Not recommended to set this to true. Can result in stuck drags.
  dragTracker.contextMenuEnabled = false;
  
  return dragTracker;
};
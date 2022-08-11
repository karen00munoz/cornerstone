import React, { useState } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import { CineDialog } from 'react-viewerbase';
import OHIF from '@ohif/core';
import dicomParser from "dicom-parser";
// import cloneDeep from 'lodash.clonedeep';
// import fs from 'fs';
// import * as fs from 'fs';
// import { ConnectedCineDialog } from "./components/Cine";
// import file from './404.dcm';

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneTools.external.Hammer = Hammer;

// const fs = require('fs');
// const dicomFileAsBuffer = fs.readFileSync('404.dcm', {
//   encoding: 'utf8',
// });
// cornerstoneWADOImageLoader.wadouri.fileManager.add(dicomFileAsBuffer)

const url = window.location.origin;
const imageId = `dicomweb:${url}/404.dcm`;

const divStyle = {
  width: "512px",
  height: "512px",
  position: "relative",
  color: "white"
};

const bottomLeftStyle = {
  bottom: "5px",
  left: "5px",
  position: "absolute",
  color: "white"
};

const bottomRightStyle = {
  bottom: "5px",
  right: "5px",
  position: "absolute",
  color: "white"
};

class CornerstoneElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      stack: props.stack,
      viewport: cornerstone.getDefaultViewport(null, undefined),
      imageId: props.stack.imageIds[0],
      initialViewport: {},
    };

    this.onImageRendered = this.onImageRendered.bind(this);
    this.onNewImage = this.onNewImage.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
  }

  render() {
    return (
      <div>
        <div
          className="viewportElement"
          style={divStyle}
          ref={input => {
            this.element = input;
            element = input;
          }}
        >
          <canvas className="cornerstone-canvas" />
          <div style={bottomLeftStyle}>Zoom: {this.state.viewport.scale}</div>
          <div style={bottomRightStyle}>
            WW/WC: {this.state.viewport.voi.windowWidth} /{" "}
            {this.state.viewport.voi.windowCenter}
          </div>
        </div>
      </div>
    );
  }

  onWindowResize() {
    console.log("onWindowResize");
    cornerstone.resize(this.element);
  }

  onImageRendered() {
    const viewport = cornerstone.getViewport(this.element);
    console.log(viewport);

    this.setState({
      viewport
    });

    console.log(this.state.viewport);
  }

  onNewImage() {
    const enabledElement = cornerstone.getEnabledElement(this.element);

    this.setState({
      imageId: enabledElement.image.imageId
    });
  }

  componentDidMount() {
    const element = this.element;

    // Enable the DOM Element for use with Cornerstone
    cornerstone.enable(element);

    // Load the first image in the stack
    cornerstone.loadImage(this.state.imageId).then(image => {
      function metaDataProvider(type, imageId) {
      if (type === 'cineModule') {
        if (imageId === image.imageId) {
            return {
                frameOfReferenceUID: "1.3.6.1.4.1.5962.99.1.2237260787.1662717184.1234892907507.1411.0",
                rows: 512,
                columns: 512,
                rowCosines: {
                    x: 1,
                    y: 0,
                    z: 0
                },
                columnCosines: {
                    x: 0,
                    y: 1,
                    z: 0
                },
                imagePositionPatient: {
                    x: -250,
                    y: -250,
                    z: -399.100006
                },
                rowPixelSpacing: 0.976562,
                columnPixelSpacing: 0.976562
            };
        }
      }
    }
    // Register this provider with CornerstoneJS
      cornerstone.metaData.addProvider(metaDataProvider);
      const cine = cornerstone.metaData.get('cineModule',image.imageId);
      console.log(cine)

      console.log("react-cs: loadAndCacheImage imgframeRate:",this.state,this.initialViewport);
      cornerstone.displayImage(this.element, image, this.initialViewport);
//          if (cine.frameTime) {
      if (true) {
        let imageIds = [];
        for(let i=0; i < cine.numFrames; i++) {
            let frameurl = imageId + "?frame="+i;
            imageIds.push(frameurl);
        }
        let stack = {
          currentImageIdIndex : 0,
          imageIds: imageIds
        };
        cornerstoneTools.addStackStateManager(this.element, ['stack', 'playClip']);
        cornerstoneTools.addToolState(this.element, 'stack', stack);

        const data = { frameRate: 1000.0 / cine.cineFrameRate, isPlaying:true, shouldStart:true };
        console.log("react-cs: loadAndCacheImage setState:",data);
        console.log("react-cs: playClip:",data.frameRate);
        debugger;
        cornerstoneTools.playClip(this.element, data.frameRate);;
      }

      cornerstoneTools.mouseInput.enable(element);
      cornerstoneTools.mouseWheelInput.enable(element);
      cornerstoneTools.wwwc.activate(element, 1); // ww/wc is the default tool for left mouse button
      cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
      cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
      cornerstoneTools.zoomWheel.activate(element); // zoom is the default tool for middle mouse wheel

      cornerstoneTools.touchInput.enable(element);
      cornerstoneTools.panTouchDrag.activate(element);
      cornerstoneTools.zoomTouchPinch.activate(element);

      element.addEventListener(
        "cornerstoneimagerendered",
        this.onImageRendered
      );
      element.addEventListener("cornerstonenewimage", this.onNewImage);
      window.addEventListener("resize", this.onWindowResize);
    });
  }

  componentWillUnmount() {
    const element = this.element;
    element.removeEventListener(
      "cornerstoneimagerendered",
      this.onImageRendered
    );

    element.removeEventListener("cornerstonenewimage", this.onNewImage);

    window.removeEventListener("resize", this.onWindowResize);

    cornerstone.disable(element);
  }

  componentDidUpdate(prevProps, prevState) {
    const stackData = cornerstoneTools.getToolState(this.element, "stack");
    const stack = stackData.data[0];
    stack.currentImageIdIndex = this.state.stack.currentImageIdIndex;
    stack.imageIds = this.state.stack.imageIds;
    cornerstoneTools.addToolState(this.element, "stack", stack);

    //const imageId = stack.imageIds[stack.currentImageIdIndex];
    //cornerstoneTools.scrollToIndex(this.element, stack.currentImageIdIndex);
  }
}

let element;
let isPlaying = false;
  // element = document.querySelectorAll(".viewportElement");
  // console.log(element);
  // for (let i = 0; i < element.length; i++) {
  //   cornerstone.enable(element[i]);
  // }
const setPlayClip = (e) => {
    cornerstoneTools.playClip(element, 1);
    isPlaying = true;
  console.log(cornerstoneTools.playClip(element, 1));
};

const setStopClip = (e) => {
    cornerstoneTools.stopClip(element);
    isPlaying = false;
};

const stack = {
  imageIds: [imageId],
  currentImageIdIndex: 0
};

const App = () => {
  const [state, setState] = useState({
    "isPlaying": true,
    "cineFrameRate": 30,
    "isLoopEnabled": true,
    "lastChange": ""
  });

const { setViewportSpecificData } = OHIF.redux.actions;

const onPlayPauseChanged = (isPlaying) => {
  function metaDataProvider(type, imageId) {
    if (type === 'cineModule') {
      if (imageId === stack.imageId) {
          return {
              frameOfReferenceUID: "1.3.6.1.4.1.5962.99.1.2237260787.1662717184.1234892907507.1411.0",
              rows: 512,
              columns: 512,
              rowCosines: {
                  x: 1,
                  y: 0,
                  z: 0
              },
              columnCosines: {
                  x: 0,
                  y: 1,
                  z: 0
              },
              imagePositionPatient: {
                  x: -250,
                  y: -250,
                  z: -399.100006
              },
              rowPixelSpacing: 0.976562,
              columnPixelSpacing: 0.976562
          };
      }
    }
  }
// Register this provider with CornerstoneJS
  cornerstone.metaData.addProvider(metaDataProvider);
  const cine = cornerstone.metaData.get('cineModule', stack.imageId);
  cine.isPlaying = isPlaying;
  console.log(cine);

  cornerstoneTools.playClip(element, state.cineFrameRate);

  // propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, {
  //   cine,
  // });
    setViewportSpecificData(stack.currentImageIdIndex, {
      cine,
    });
};

const onFrameRateChanged = (frameRate) => {
  function metaDataProvider(type, imageId) {
    if (type === 'cineModule') {
      if (imageId === stack.imageId) {
          return {
              frameOfReferenceUID: "1.3.6.1.4.1.5962.99.1.2237260787.1662717184.1234892907507.1411.0",
              rows: 512,
              columns: 512,
              rowCosines: {
                  x: 1,
                  y: 0,
                  z: 0
              },
              columnCosines: {
                  x: 0,
                  y: 1,
                  z: 0
              },
              imagePositionPatient: {
                  x: -250,
                  y: -250,
                  z: -399.100006
              },
              rowPixelSpacing: 0.976562,
              columnPixelSpacing: 0.976562
          };
      }
    }
  }
// Register this provider with CornerstoneJS
  cornerstone.metaData.addProvider(metaDataProvider);
  const cine = cornerstone.metaData.get('cineModule', stack.imageId);
  cine.cineFrameRate = frameRate;
  console.log(cine.cineFrameRate);

  // propsFromDispatch.dispatchSetViewportSpecificData(activeViewportIndex, {
  //   cine,
  // });
    setViewportSpecificData(stack.currentImageIdIndex, {
    cine,
  });
};
  return (
    <div>
      <h2>Cornerstone React Component Example</h2>
      <button onClick={() => setPlayClip()} style={{ marginLeft: "10px" }}>
        Play
      </button>
      <button onClick={() => setStopClip()} style={{ marginLeft: "10px" }}>
        Stop
      </button>
      <CineDialog
        {...state}
        onClickSkipToStart={() => setState({ lastChange: 'Clicked SkipToStart' })}
        onClickSkipToEnd={() => setState({ lastChange: 'Clicked SkipToEnd' })}
        onClickNextButton={() => setState({ lastChange: 'Clicked Next' })}
        onClickBackButton={() => setState({ lastChange: 'Clicked Back' })}
        onLoopChanged={(value) => setState({ isLoopEnabled: value })}
        onFrameRateChanged={(value) => {
          onFrameRateChanged(value);
          setState({ cineFrameRate: value })
        }}
        onPlayPauseChanged={() => {
          onPlayPauseChanged(isPlaying);
          setState({ isPlaying: !state.isPlaying });
        }}
      />
      <CornerstoneElement stack={{ ...stack }} />
    </div>
  );
};

  export default App;

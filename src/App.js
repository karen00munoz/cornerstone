import React, { useState } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import { CineDialog } from 'react-viewerbase';
import dicomParser from "dicom-parser";

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneWADOImageLoader.webWorkerManager.initialize({
  maxWebWorkers: navigator.hardwareConcurrency || 1,
  startWebWorkersOnDemand: true,
  taskConfiguration: {
    decodeTask: {
      initializeCodecsOnStartup: false,
      usePDFJS: false,
      strict: false,
    },
  },
});
cornerstoneTools.external.Hammer = Hammer;

cornerstoneWADOImageLoader.configure({
  beforeSend: function(xhr) {
      // Add custom headers here (e.g. auth tokens)
      //xhr.setRequestHeader('x-auth-token', 'my auth token');
  }
});

const divStyle = {
  width: "412px",
  height: "312px",
  position: "relative",
  color: "white"
};

const topLeftStyle = {
  top: "5px",
  left: "5px",
  position: "absolute",
  color: "white"
};


const topRightStyle = {
  top: "5px",
  right: "5px",
  position: "absolute",
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

let element;

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
        <div
          className="viewportElement"
          style={divStyle}
          ref={input => {
            this.element = input;
            if (input !== undefined && input !== null) {
              element = input;
            }
          }}
        >
          <canvas className="cornerstone-canvas" />
          <div style={topLeftStyle}>
            <span>Num Of Frames: </span><span id="numberOfFrames"></span><br></br>
          </div>
          <div style={topRightStyle}>
            <span>Byte Length: </span><span id="fragments"></span><br />
          </div>
          <div style={bottomLeftStyle}>Zoom: {this.state.viewport.scale}</div>
          <div style={bottomRightStyle}>
            WW/WC: {this.state.viewport.voi.windowWidth} /{" "}
            {this.state.viewport.voi.windowCenter}
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
    console.log(Stack);

    // Enable the DOM Element for use with Cornerstone
    cornerstone.enable(element);

      console.log("react-cs: loadAndCacheImage imgframeRate:",this.state,this.initialViewport);

      const loc = window.location.origin;
      const url = `${loc}/0002.DCM`;
      
      console.log(url);
      // since this is a multi-frame example, we need to load the DICOM SOP Instance into memory and parse it
      // so we know the number of frames it has so we can create the stack.  Calling load() will increment the reference
      // count so it will stay in memory until unload() is explicitly called and all other reference counts
      // held by the cornerstone cache are gone.  See below for more info
      cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.load(url, cornerstoneWADOImageLoader.internal.xhrRequest).then(function(dataSet) {
          // dataset is now loaded, get the # of frames so we can build the array of imageIds
          var numFrames = dataSet.intString('x00280008');
          var FrameRate = State.frameRate;
          if(!numFrames) {
              alert('Missing element NumberOfFrames (0028,0008)');
              return;
          }
  
          var imageIds = [];
          var imageIdRoot = 'wadouri:' + url;
  
          for(var i=0; i < numFrames; i++) {
              var imageId = imageIdRoot + "?frame="+i;
              State.imageIds.push(imageId);
              imageIds.push(imageId);
          }
  
          var stack = {
              currentImageIdIndex : 0,
              imageIds: imageIds
          };

          Stack = stack;
          // for(let i = 0; i < stack.ImageIds.length; i++) {
          // }
          cornerstone.loadAndCacheImage(imageIds[0]).then(function(image) {
              console.log(image);
              cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.unload(imageId);
                  cornerstoneTools.wwwc.activate(element, 1); // ww/wc is the default tool for left mouse button
                  // Set the stack as tool state
                  cornerstoneTools.addStackStateManager(element, ['stack', 'playClip', 'stopClip']);
                  cornerstoneTools.addToolState(element, 'stack', stack);
                  // Start playing the clip
                  cornerstoneTools.playClip(element, FrameRate);
              cornerstone.displayImage(element, image);
              setTimeout(() => {
                const det = document.querySelectorAll('#numberOfFrames');
                const det2 = document.querySelectorAll('#fragments');
                for(let i = 0; i < det.length; i++) {
                  det[i].textContent = image.data.string('x00280008');
                }
                for(let i = 0; i < det2.length; i++) {
                  det2[i].textContent = image.data.byteArray.byteLength;
                  console.log(image.data.byteArray.byteLength)
                }
              }, 1500);
          }, function(err) {
              alert(err);
          });

      console.log("react-cs: loadAndCacheImage imgframeRate:",this.state,this.state.initialViewport);

      cornerstoneTools.mouseInput.enable(element);
      cornerstoneTools.mouseWheelInput.enable(element);
      cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
      cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
      cornerstoneTools.zoomWheel.activate(element); // zoom is the default tool for middle mouse wheel


      cornerstoneTools.touchInput.enable(element);
      cornerstoneTools.panTouchDrag.activate(element);
      cornerstoneTools.zoomTouchPinch.activate(element);

      cornerstoneTools.stackScrollWheel.activate(element);
      cornerstoneTools.stackPrefetch.setConfiguration({
        maxImagesToPrefetch: Infinity,
        preserveExistingPool: false,
      });

      cornerstoneTools.stackPrefetch.enable(element);
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

  componentDidUpdate() {
    const stackData = cornerstoneTools.getToolState(this.element, "stack");
    const stack = stackData.data[0];
    stack.currentImageIdIndex = this.state.stack.currentImageIdIndex;
    stack.imageIds = this.state.stack.imageIds;
    cornerstoneTools.addToolState(this.element, "stack", stack);

    // const imageId = stack.imageIds[stack.currentImageIdIndex];
    cornerstoneTools.scrollToIndex(this.element, stack.currentImageIdIndex);
  }
}

let Stack = {
  imageIds: ['dicomweb:http://localhost:3000/403.dcm'],
  currentImageIdIndex: 0
};

let State = {
  activeViewportIndex: 2,
  viewports: [0, 1, 2, 3],
  tools: [
    // Mouse
    {
      name: 'Wwwc',
      mode: 'active',
      modeOptions: { mouseButtonMask: 1 },
    },
    {
      name: 'Zoom',
      mode: 'active',
      modeOptions: { mouseButtonMask: 2 },
    },
    {
      name: 'Pan',
      mode: 'active',
      modeOptions: { mouseButtonMask: 4 },
    },
    'Length',
    'Angle',
    'Bidirectional',
    'FreehandRoi',
    'Eraser',
    // Scroll
    { name: 'StackScrollMouseWheel', mode: 'active' },
    // Touch
    { name: 'PanMultiTouch', mode: 'active' },
    { name: 'ZoomTouchPinch', mode: 'active' },
    { name: 'StackScrollMultiTouch', mode: 'active' },
  ],
  imageIds: [
    Stack.imageIds[0],
    Stack.imageIds[0],
    Stack.imageIds[0],
    Stack.imageIds[0],
  ],
  // FORM
  activeTool: 'Wwwc',
  imageIdIndex: 0,
  isPlaying: true,
  frameRate: 30,
};

const App = () => {
  const [state, setState] = useState({
    isPlaying: true,
    cineFrameRate: State.frameRate,
    isLoopEnabled: true,
    lastChange: "",
  });

  // const { setViewportSpecificData } = OHIF.redux.actions;

  function metaDataProvider(type, imageId) {
    if (type === 'cineModule') {
      if (imageId === Stack.imageId) {
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

    const setPlayClip = () => {
      state.isPlaying = true;
      cornerstone.metaData.addProvider(metaDataProvider);
      const cine = cornerstone.metaData.get('cineModule', Stack.imageId);
      cine.isPlaying = !state.isPlaying;
      cornerstoneTools.playClip(element, state.cineFrameRate)
    };

    const setStopClip = () => {
      state.isPlaying = false;
      cornerstone.metaData.addProvider(metaDataProvider);
      const cine = cornerstone.metaData.get('cineModule', Stack.imageId);
      cine.isPlaying = !state.isPlaying;
      console.log(element);
      cornerstoneTools.stopClip(element);
      // loaded = false;
    };

    const onPlayPauseChanged = () => {
      cornerstone.metaData.addProvider(metaDataProvider);
      const cine = cornerstone.metaData.get('cineModule', Stack.imageId);
      cine.isPlaying = state.isPlaying;
      console.log(cine);
        if (state.isPlaying) {
          cornerstoneTools.playClip(element, cine.cineFrameRate)
        } else {
          cornerstoneTools.stopClip(element);
        }
    };

  const onFrameRateChanged = () => {
  // Register this provider with CornerstoneJS
    cornerstone.metaData.addProvider(metaDataProvider);
    const cine = cornerstone.metaData.get('cineModule', Stack.imageId);
    cine.cineFrameRate = State.frameRate;
    console.log(cine);
  };

  return (
    <div>
      <h2>Cornerstone React Component Example</h2>
      <button onClick={() => {
        setPlayClip();
        }}
        style={{ marginLeft: "10px" }}
      >
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
          State.frameRate = value;
          state.cineFrameRate = value;
          onFrameRateChanged();
        }}
        onPlayPauseChanged={() => {
          state.isPlaying = !state.isPlaying;
          state.isLoopEnabled = !state.isLoopEnabled;
          console.log(state.isPlaying)
          onPlayPauseChanged();
        }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 33%)', width: '100vw', rowGap: '15px' }}>
      {State.viewports.map(viewportIndex => (
        <CornerstoneElement
          key={viewportIndex}
          style={{ minWidth: '50%', height: '256px', flex: '1' }}
          tools={State.tools}
          imageIds={Stack.imageIds}
          imageIdIndex={State.imageIdIndex}
          isPlaying={State.isPlaying}
          frameRate={State.frameRate}
          stack={{ ...Stack }}
          className={State.activeViewportIndex === viewportIndex ? 'active' : ''}
          activeTool={State.activeTool}
          setViewportActive={() => {
              State.activeViewportIndex = viewportIndex;
          }}
        />
      ))}
    </div>
    </div>
  );
};

  export default App;
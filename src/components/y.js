import React, { useEffect, useState } from "react";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import CineDialog from "./CineDialog";

import "./App.css";

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

cornerstoneTools.init({
  mouseEnabled: true,
  touchEnabled: true,
  globalToolSyncEnabled: false,
  showSVGCursors: false
});
const fontFamily =
  "Work Sans, Roboto, OpenSans, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif";

cornerstoneTools.textStyle.setFont(`16px ${fontFamily}`);

// Set the tool width
cornerstoneTools.toolStyle.setToolWidth(2);

// Set color for inactive tools
cornerstoneTools.toolColors.setToolColor("rgb(255, 255, 0)");

// Set color for active tools
cornerstoneTools.toolColors.setActiveColor("rgb(0, 255, 0)");

const App = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imageIds, setImageIds] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  let element;

  const loadAndViewImage = (imageId) => {
    const element = document.getElementById("dicomImage");
    const start = new Date().getTime();
    cornerstone.loadImage(imageId).then(
      function (image) {
        console.log(image);
        const viewport = cornerstone.getDefaultViewportForImage(element, image);
        cornerstone.displayImage(element, image, viewport);
      },
      function (err) {
        alert(err);
      }
    );
  };

  useEffect(() => {
    element = document.getElementById("dicomImage");
    cornerstone.enable(element);
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(files);
    const imageIds = files.map((file) => {
      return cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    });
    setImageIds(imageIds);
    const StackScrollMouseWheelTool =
      cornerstoneTools.StackScrollMouseWheelTool;

    const stack = {
      currentImageIdIndex: 0,
      imageIds
    };
    cornerstone.loadImage(imageIds[0]).then((image) => {
      cornerstone.displayImage(element, image);
      cornerstoneTools.addStackStateManager(element, ["stack"]);
      cornerstoneTools.addToolState(element, "stack", stack);
    });
    setTimeout(() => {
      imageIds.forEach((imageId) => {
        const thumbnailElement = document.getElementById(imageId);
        cornerstone.enable(thumbnailElement);
        cornerstone.loadImage(imageId).then((image) => {
          cornerstone.displayImage(thumbnailElement, image);
          cornerstoneTools.addStackStateManager(element, ["stack"]);
          cornerstoneTools.addToolState(element, "stack", stack);
        });
      });
    }, 1000);
    cornerstoneTools.addTool(StackScrollMouseWheelTool);
    cornerstoneTools.setToolActive("StackScrollMouseWheel", {});
  };

  const setZoomActive = (e) => {
    const ZoomMouseWheelTool = cornerstoneTools.ZoomMouseWheelTool;

    cornerstoneTools.addTool(ZoomMouseWheelTool);
    cornerstoneTools.setToolActive("ZoomMouseWheel", { mouseButtonMask: 1 });
    const PanTool = cornerstoneTools.PanTool;

    cornerstoneTools.addTool(PanTool);
    cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 });
  };

  const setMouseWheelActive = (e) => {
    const StackScrollMouseWheelTool =
      cornerstoneTools.StackScrollMouseWheelTool;
    cornerstoneTools.addTool(StackScrollMouseWheelTool);
    cornerstoneTools.setToolActive("StackScrollMouseWheel", {});
  };

  const setLengthActive = (e) => {
    const LengthTool = cornerstoneTools.LengthTool;
    cornerstoneTools.addTool(LengthTool);
    cornerstoneTools.setToolActive("Length", { mouseButtonMask: 1 });
  };

  const setWwwcActive = (e) => {
    const WwwcTool = cornerstoneTools.WwwcTool;
    cornerstoneTools.addTool(WwwcTool);
    cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 1 });
  };

  const setEraserActive = (e) => {
    const EraserTool = cornerstoneTools.EraserTool;
    cornerstoneTools.addTool(EraserTool);
    cornerstoneTools.setToolActive("Eraser", { mouseButtonMask: 1 });
  };

  const setPlayClip = (e) => {
    cornerstoneTools.playClip(element, 1);
    setIsPlaying(true);
  };

  const setStopClip = (e) => {
    cornerstoneTools.stopClip(element);
    setIsPlaying(false);
  };

  return (
    <div>
      <h2>DICOM viewer demo</h2>
      <input type="file" onChange={handleFileChange} multiple />
      <button onClick={setZoomActive}>Zoom/Pan</button>
      <button onClick={setMouseWheelActive} style={{ marginLeft: "10px" }}>
        Scroll
      </button>
      <button onClick={setLengthActive} style={{ marginLeft: "10px" }}>
        Length
      </button>
      <button onClick={setWwwcActive} style={{ marginLeft: "10px" }}>
        WWWC
      </button>
      <button onClick={setEraserActive} style={{ marginLeft: "10px" }}>
        Eraser
      </button>
      <button onClick={setPlayClip} style={{ marginLeft: "10px" }}>
        Play
      </button>
      <button onClick={setStopClip} style={{ marginLeft: "10px" }}>
        Stop
      </button>
      <CineDialog
        isPlaying={isPlaying}
        onClickSkipToStart={() => console.log("skip pressed")}
        onClickSkipToEnd={() => console.log("skip to end pressed")}
        onClickNextButton={() => console.log("next pressed")}
        onClickBackButton={() => console.log("back pressed")}
        onLoopChanged={(value) => console.log("loop changed")}
        onFrameRateChanged={(value) => console.log("frame rate changed")}
        onPlayPauseChanged={() => console.log("play pause pressed")}
      />
      <div className="dicom-wrapper">
        <div className="thumbnail-selector">
          <div className="thumbnail-list" id="thumbnail-list">
            {imageIds.map((imageId) => {
              return (
                <a
                  key={imageId}
                  onContextMenu={() => false}
                  unselectable="on"
                  onMouseDown={() => false}
                  onSelect={() => false}
                >
                  <div
                    id={imageId}
                    className="thumbnail-item"
                    onContextMenu={() => false}
                    unselectable="on"
                    onMouseDown={() => false}
                    onSelect={() => false}
                  />
                </a>
              );
            })}
          </div>
        </div>
        <div
          onContextMenu={() => false}
          className="dicom-viewer"
          unselectable="on"
        >
          <div id="dicomImage"></div>
        </div>
      </div>
    </div>
  );
};

export default App;

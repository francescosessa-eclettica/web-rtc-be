import { getServerConfig, getRTCConfiguration } from "../../js/config.js";
import { createDisplayStringArray } from "../../js/stats.js";
import { VideoPlayer } from "../../js/videoplayer.js?v.03";
import { RenderStreaming } from "../../module/renderstreaming.js";
import { Signaling, WebSocketSignaling } from "../../module/signaling.js";
import {
  registerGamepadEvents,
  registerKeyboardEvents,
  registerMouseEvents,
  sendClickEvent,
  sendColor,
  sendThickness,
  sendText,
} from "./register-events.js";

/** @type {Element} */
let playButton;
/** @type {RenderStreaming} */
let renderstreaming;
/** @type {boolean} */
let useWebSocket;

const codecPreferences = document.getElementById("codecPreferences");
const supportsSetCodecPreferences =
  window.RTCRtpTransceiver &&
  "setCodecPreferences" in window.RTCRtpTransceiver.prototype;
const messageDiv = document.getElementById("message");
messageDiv.style.display = "none";

const playerDiv = document.getElementById("player");
const lockMouseCheck = document.getElementById("lockMouseCheck");
const videoPlayer = new VideoPlayer();

setup();

function setupPlayerEvents(vp, vpElement) {
  // const videoPlayer = new VideoPlayer(elements);
  // await videoPlayer.setupConnection(useWebSocket);

  videoPlayer.ondisconnect = onDisconnect;
  registerGamepadEvents(vp);
  registerKeyboardEvents(vp);
  registerMouseEvents(vp, vpElement);

  // return videoPlayer;
}

window.document.oncontextmenu = function () {
  return false; // cancel default menu
};

window.addEventListener(
  "resize",
  function () {
    videoPlayer.resizeVideo();
  },
  true
);

window.addEventListener(
  "beforeunload",
  async () => {
    if (!renderstreaming) return;
    await renderstreaming.stop();
  },
  true
);

async function setup() {
  const res = await getServerConfig();
  useWebSocket = res.useWebSocket;
  showWarningIfNeeded(res.startupMode);
  showCodecSelect();
  showPlayButton();
}

function showWarningIfNeeded(startupMode) {
  const warningDiv = document.getElementById("warning");
  if (startupMode == "private") {
    warningDiv.innerHTML =
      "<h4>Warning</h4> This sample is not working on Private Mode.";
    warningDiv.hidden = false;
  }
}

function showPlayButton() {
  if (!document.getElementById("playButton")) {
    const elementPlayButton = document.createElement("img");
    elementPlayButton.id = "playButton";
    elementPlayButton.src = "../../images/Play.png";
    elementPlayButton.alt = "Start Streaming";
    playButton = document
      .getElementById("player")
      .appendChild(elementPlayButton);
    playButton.addEventListener("click", onClickPlayButton);
  }
}

var unityCanasInit = false;

function onClickPlayButton() {
  if (!unityCanasInit) {
    unityCanasInit = true;

    var unityCanvas = document.getElementById("unity-canvas");
    if (unityCanvas != null) unityCanvas.style.display = "block";
  }

  playButton.style.display = "none";

  // add video player
  videoPlayer.createPlayer(playerDiv, lockMouseCheck);

  // alexandros
  console.log("before setupPlayerEvents");
  var elementVideo = document.getElementById("Video");
  setupPlayerEvents(videoPlayer, elementVideo);
  console.log("after setupPlayerEvents");

  setupRenderStreaming();

  controlsSetup();
}

const ButtonsEnum = {
  FreeHand: 1,
  Rectangle: 2,
  Circle: 3,
  Arrow: 4,
  Clear: 5,
};

const MaxTextLength = 256;

function controlsSetup() {
  // add free hand button
  const freeHandButton = document.createElement("button");
  freeHandButton.id = "blueButton";
  freeHandButton.innerHTML = "Free Hand";
  playerDiv.appendChild(freeHandButton);
  freeHandButton.addEventListener("click", function () {
    sendClickEvent(videoPlayer, ButtonsEnum.FreeHand);
  });

  // add rectangle button
  const rectangleButton = document.createElement("button");
  rectangleButton.id = "greenButton";
  rectangleButton.innerHTML = "Rectangle";
  playerDiv.appendChild(rectangleButton);
  rectangleButton.addEventListener("click", function () {
    sendClickEvent(videoPlayer, ButtonsEnum.Rectangle);
  });

  // add circle button
  const circleButton = document.createElement("button");
  circleButton.id = "orangeButton";
  circleButton.innerHTML = "Circle";
  playerDiv.appendChild(circleButton);
  circleButton.addEventListener("click", function () {
    sendClickEvent(videoPlayer, ButtonsEnum.Circle);
  });

  // add arrow button
  const elementPurpleButton = document.createElement("button");
  elementPurpleButton.id = "purpleButton";
  elementPurpleButton.innerHTML = "Arrow";
  playerDiv.appendChild(elementPurpleButton);
  elementPurpleButton.addEventListener("click", function () {
    sendClickEvent(videoPlayer, ButtonsEnum.Arrow);
  });

  // add clear button
  const elementYellowButton = document.createElement("button");
  elementYellowButton.id = "yellowButton";
  elementYellowButton.innerHTML = "Clear";
  playerDiv.appendChild(elementYellowButton);
  elementYellowButton.addEventListener("click", function () {
    sendClickEvent(videoPlayer, ButtonsEnum.Clear);
  });

  // Creating the input element of type "color"
  var colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.id = "html5colorpicker";
  colorPicker.addEventListener("change", function () {
    sendColor(videoPlayer, colorPicker.value);
  });
  colorPicker.value = "#ff0000";
  playerDiv.appendChild(colorPicker);

  // Creating the label element
  var thicknessLabel = document.createElement("label");
  thicknessLabel.setAttribute("for", "thickness");
  thicknessLabel.textContent = "Thickness (between 1 and 10):";

  // Creating the input element
  var thicknessInput = document.createElement("input");
  thicknessInput.type = "number";
  thicknessInput.id = "thickness";
  thicknessInput.name = "thickness";
  thicknessInput.min = "1";
  thicknessInput.max = "10";
  thicknessInput.value = "3";
  thicknessInput.addEventListener("change", function (event) {
    var newValue = event.target.value;
    console.log("New quantity value:", newValue);
    // You can add your logic here to handle the changed value
    sendThickness(videoPlayer, thicknessInput.value);
  });

  // Getting the container element in the DOM
  var thicknessContainer = document.createElement("div");
  thicknessContainer.id = "thicknessContainer";
  thicknessContainer.appendChild(thicknessLabel);
  thicknessContainer.appendChild(thicknessInput);
  playerDiv.appendChild(thicknessContainer);

  // create send text text-area
  const textAreaContainer = document.createElement("div");
  textAreaContainer.id = "textareaContainer";

  const textarea = document.createElement("textarea");
  textarea.style.zIndex = 100;
  textarea.id = "textInput";
  textarea.rows = 6;
  textarea.cols = 50;
  textarea.contentEditable = true;
  textarea.oninput = handleTextAreaInput;
  textAreaContainer.style.zIndex = 100;

  //create send text button
  var sendTextButton = document.createElement("button");
  sendTextButton.id = "sendTextButton";
  //    sendTextButton.style.height = "60px";
  sendTextButton.textContent = "INVIA";
  sendTextButton.addEventListener("click", function () {
    const textInput = document.getElementById("textInput");
    const content = textInput.value;

    sendText(videoPlayer, content, MaxTextLength * 2);
    // alert("Contenuto inviato: " + content);

    textInput.value = "";
    handleTextAreaInput();

    // sendTextButtonSubmit(videoPlayer);
  });

  var charCounter = document.createElement("p");
  charCounter.id = "charCounter";
  charCounter.style.color = "white";
  charCounter.textContent = "0/256";

  textAreaContainer.appendChild(textarea);
  textAreaContainer.appendChild(charCounter);
  textAreaContainer.appendChild(sendTextButton);

  playerDiv.appendChild(textAreaContainer);
}

function handleTextAreaInput() {
  const textInput = document.getElementById("textInput");
  const charCount = document.getElementById("charCounter");

  const text = textInput.value;
  const textLength = text.length;

  // console.log(text + " - " + textLength);

  if (textLength > MaxTextLength) {
    textInput.value = text.slice(0, MaxTextLength);
  }

  charCount.textContent = textInput.value.length + "/" + MaxTextLength;
}

async function setupRenderStreaming() {
  codecPreferences.disabled = true;

  const signaling = useWebSocket ? new WebSocketSignaling() : new Signaling();
  const config = getRTCConfiguration();
  renderstreaming = new RenderStreaming(signaling, config);
  renderstreaming.onConnect = onConnect;
  renderstreaming.onDisconnect = onDisconnect;
  renderstreaming.onTrackEvent = (data) => videoPlayer.addTrack(data.track);
  renderstreaming.onGotOffer = setCodecPreferences;

  await renderstreaming.start();
  await renderstreaming.createConnection("1234test");
}

function onConnect() {
  const channel = renderstreaming.createDataChannel("input");
  videoPlayer.setupInput(channel);
  showStatsMessage();
}

async function onDisconnect(connectionId) {
  clearStatsMessage();
  messageDiv.style.display = "block";
  messageDiv.innerText = `Disconnect peer on ${connectionId}.`;

  await renderstreaming.stop();
  renderstreaming = null;
  videoPlayer.deletePlayer();
  if (supportsSetCodecPreferences) {
    codecPreferences.disabled = false;
  }
  showPlayButton();

  try {
    onClickPlayButton();
  } catch (error) {
    console.log("on disconnect exception " + error);
  }
}

function setCodecPreferences() {
  /** @type {RTCRtpCodecCapability[] | null} */
  let selectedCodecs = null;
  if (supportsSetCodecPreferences) {
    const preferredCodec =
      codecPreferences.options[codecPreferences.selectedIndex];
    if (preferredCodec.value !== "") {
      const [mimeType, sdpFmtpLine] = preferredCodec.value.split(" ");
      const { codecs } = RTCRtpSender.getCapabilities("video");
      const selectedCodecIndex = codecs.findIndex(
        (c) => c.mimeType === mimeType && c.sdpFmtpLine === sdpFmtpLine
      );
      const selectCodec = codecs[selectedCodecIndex];
      selectedCodecs = [selectCodec];
    }
  }

  if (selectedCodecs == null) {
    return;
  }
  const transceivers = renderstreaming
    .getTransceivers()
    .filter((t) => t.receiver.track.kind == "video");
  if (transceivers && transceivers.length > 0) {
    transceivers.forEach((t) => t.setCodecPreferences(selectedCodecs));
  }
}

function showCodecSelect() {
  if (!supportsSetCodecPreferences) {
    messageDiv.style.display = "block";
    messageDiv.innerHTML = `Current Browser does not support <a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver/setCodecPreferences">RTCRtpTransceiver.setCodecPreferences</a>.`;
    return;
  }

  const codecs = RTCRtpSender.getCapabilities("video").codecs;
  codecs.forEach((codec) => {
    if (["video/red", "video/ulpfec", "video/rtx"].includes(codec.mimeType)) {
      return;
    }
    const option = document.createElement("option");
    option.value = (codec.mimeType + " " + (codec.sdpFmtpLine || "")).trim();
    option.innerText = option.value;
    codecPreferences.appendChild(option);
  });
  codecPreferences.disabled = false;
}

/** @type {RTCStatsReport} */
let lastStats;
/** @type {number} */
let intervalId;

function showStatsMessage() {
  intervalId = setInterval(async () => {
    if (renderstreaming == null) {
      return;
    }

    const stats = await renderstreaming.getStats();
    if (stats == null) {
      return;
    }

    const array = createDisplayStringArray(stats, lastStats);
    if (array.length) {
      messageDiv.style.display = "block";
      messageDiv.innerHTML = array.join("<br>");
    }
    lastStats = stats;
  }, 1000);
}

function clearStatsMessage() {
  if (intervalId) {
    clearInterval(intervalId);
  }
  lastStats = null;
  intervalId = null;
  messageDiv.style.display = "none";
  messageDiv.innerHTML = "";
}

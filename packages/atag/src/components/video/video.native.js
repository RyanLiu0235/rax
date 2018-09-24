import { PolymerElement } from '@polymer/polymer';

const ua = navigator.userAgent;
const isAndroid = /android/i.test(ua);
const isIOS = /(iPhone|iPad|iPod)/.test(ua);

let videoInstanceCount = 0;
export default class VideoElement extends PolymerElement {
  static get is() {
    return 'a-video';
  }

  static get properties() {
    return {
      src: {
        type: String,
        notify: true
      },
      poster: {
        type: String,
        notify: true
      },
      width: {
        type: String
      },
      height: {
        type: String
      },
      loop: {
        type: Boolean
      },
      autoplay: {
        type: Boolean,
        value: false
      },
      controls: {
        type: Boolean,
        value: true
      },
      muted: {
        type: Boolean,
        value: false,
      },
      objectFit: {
        type: String,
        value: 'contain',
      }
    };
  }

  constructor(...args) {
    super(...args);

    document.addEventListener('WVEmbed.Ready', this._nativeReady);
    this.uniqueId = String(++videoInstanceCount);
  }

  connectedCallback() {
    super.connectedCallback();

    const container = this.container = document.createElement('object');
    container.setAttribute('type', 'application/view');
    container.className = 'atag-native-video';

    const type = VideoElement.createParamTag('viewType', 'wmlVideo');
    const url = VideoElement.createParamTag('url', this.src);

    const controls = this._controlsParamEl = VideoElement.createParamTag(
      'controls',
      this.controls ? 'true' : 'false'
    );
    // 1:playing  0：paused
    const playStatus = this._playStatusParamsEl = VideoElement.createParamTag(
      'playStatus',
      '0'
    );

    // 1:enterFullscreen; 0：exitFullscreen；-1: do nothing
    const fullScreenStatus = this._fullscreenParamEl = VideoElement.createParamTag(
      'fullScreenStatus',
      '-1'
    );

    const loop = this._loopParamEl = VideoElement.createParamTag(
      'loop',
      this.loop
    );

    // number(1为静音，0为不静音)
    const muted = this._mutedParamEl = VideoElement.createParamTag(
      'muted',
      this.muted ? 1 : 0
    );

    // String（contain：包含，fill：填充，cover：覆盖）
    const objectFit = this._objectFitParamEl = VideoElement.createParamTag(
      'objectFit',
      this.objectFit
    );

    const bridgeId = VideoElement.createParamTag(
      'bridgeId',
      this.getBridgeId()
    );
    container.appendChild(type);
    container.appendChild(url);
    container.appendChild(controls);
    container.appendChild(playStatus);
    container.appendChild(fullScreenStatus);
    container.appendChild(loop);
    container.appendChild(muted);
    container.appendChild(objectFit);
    container.appendChild(bridgeId);

    this.setStyle(this.getAttribute('style'));

    // for native hack
    // all events triggered at object tag proxyed to this
    container.$$id = this.$$id;

    this.appendChild(container);

    if (this.autoplay) {
      this.play();
    }
  }

  attributeChangedCallback(key, oldVal, newVal) {
    super.attributeChangedCallback(key, oldVal, newVal);
    if (oldVal !== newVal) {
      switch (key) {
        case 'controls': {
          newVal ? this.showControls() : this.hideControls();
          break;
        }
        case 'muted': {
          this.mute(newVal);
          break;
        }
        case 'objectFit': {
          this.changeObjectFit(newVal);
          break;
        }
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('WVEmbed.Ready', this._nativeReady);
  }

  setStyle(style) {
    if (typeof style === 'string') {
      this.container.style.cssText = style;
    }
  }

  getBridgeId() {
    return this.uniqueId;
  }

  showControls() {
    if (isIOS && this._controlsParamEl) {
      this._controlsParamEl.setAttribute('value', 'true');
    } else if (isAndroid) {
      this.callNativeControl('changeControllerStatus', {
        status: '1'
      });
    } else {
      console.warn('Controls status params el not exists');
    }
  }

  hideControls() {
    if (isIOS && this._controlsParamEl) {
      this._controlsParamEl.setAttribute('value', 'false');
    } else if (isAndroid) {
      this.callNativeControl('changeControllerStatus', {
        status: '0'
      });
    } else {
      console.warn('Controls status params el not exists');
    }
  }

  /**
   * interface play for videoEl
   */
  play() {
    if (isIOS && this._playStatusParamsEl) {
      this._playStatusParamsEl.setAttribute('value', '1');
    } else if (isAndroid) {
      this.callNativeControl('play', {
        videoUrl: this.src,
        isLoop: this.loop,
        objectFit: this.objectFit
      });
    } else {
      console.warn('Play status params el not exists');
    }
  }

  /**
   * interface pause for videoEl
   */
  pause() {
    if (isIOS && this._playStatusParamsEl) {
      this._playStatusParamsEl.setAttribute('value', '0');
    } else if (isAndroid) {
      this.callNativeControl('pause', {});
    } else {
      console.warn('Play status params el not exists');
    }
  }

  mute(isMute) {
    if (isIOS && this._mutedParamEl) {
      // status(1为静音，0为不静音)
      this._mutedParamEl.setAttribute('value', isMute ? '1' : '0');
    } else if (isAndroid) {
      this.callNativeControl('muted', { status: isMute ? '1' : '0' });
    } else {
      console.warn('Muted status params el not exists');
    }
  }

  changeObjectFit(objectFit) {
    if (isIOS && this._objectFitParamEl) {
      this._objectFitParamEl.setAttribute('value', objectFit);
    } else if (isAndroid) {
      this.callNativeControl('play', {
        videoUrl: this.src,
        isLoop: this.loop,
        objectFit
      });
    }
  }

  /**
   * stop video play
   */
  stop() {
    if (isIOS && this._playStatusParamsEl) {
      this._playStatusParamsEl.setAttribute('value', '2');
    } else if (isAndroid) {
      this.callNativeControl('stop', {});
    } else {
      console.warn('Play status params el not exists');
    }
  }

  /**
   * interface of entering fullscreen
   */
  requestFullScreen() {
    if (isIOS && this._fullscreenParamEl) {
      this._fullscreenParamEl.setAttribute('value', '1');
    } else if (isAndroid) {
      this.callNativeControl('enterFullScreen', {});
    } else {
      console.warn('Fullscreen status params el not exists');
    }
  }

  /**
   * interface of exiting fullscreen
   */
  exitFullScreen() {
    if (isIOS && this._fullscreenParamEl) {
      this._fullscreenParamEl.setAttribute('value', '0');
    } else if (isAndroid) {
      this.callNativeControl('exitFullScreen', {});
    } else {
      console.warn('Fullscreen status params el not exists');
    }
  }

  enableLoop() {
    if (isIOS && this._loopParamEl) {
      this._loopParamEl.setAttribute('value', 'true');
    } else if (isAndroid) {
      this.loop = true;
    }
  }
  disableLoop() {
    if (isIOS && this._loopParamEl) {
      this._loopParamEl.setAttribute('value', 'false');
    } else if (isAndroid) {
      this.loop = false;
    }
  }

  isNativeReady = false;
  nativeReadyCallbacks = [];

  callNativeControl(method, params) {
    const execute = () => {
      window.WindVane.call('WVEmbedView_' + this.getBridgeId(), method, params);
    };
    if (this.isNativeReady) {
      execute();
    } else {
      this.nativeReadyCallbacks.push(execute);
    }
  }

  _nativeReady = evt => {
    this.isNativeReady = true;
    let fn;
    while (fn = this.nativeReadyCallbacks.shift()) {
      fn();
    }
  };

  static createParamTag(key, value) {
    const param = document.createElement('param');
    param.setAttribute('name', key);
    param.setAttribute('value', value);
    return param;
  }
}

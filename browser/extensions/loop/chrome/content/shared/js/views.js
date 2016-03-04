var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var loop = loop || {};
loop.shared = loop.shared || {};
loop.shared.views = function (_, mozL10n) {
  "use strict";

  var sharedActions = loop.shared.actions;
  var sharedMixins = loop.shared.mixins;

  /**
   * Hang-up control button.
   *
   * Required props:
   * - {Function} action  Function to be executed on click.
   * - {String}   title   Tooltip functionality.
   */
  var HangUpControlButton = React.createClass({
    displayName: "HangUpControlButton",

    mixins: [React.addons.PureRenderMixin],

    propTypes: {
      action: React.PropTypes.func.isRequired,
      title: React.PropTypes.string
    },

    handleClick: function () {
      this.props.action();
    },

    render: function () {
      return React.createElement("button", { className: "btn btn-hangup",
        onClick: this.handleClick,
        title: this.props.title });
    }
  });

  /**
   * Media control button.
   *
   * Required props:
   * - {String}   scope   Media scope, can be "local" or "remote".
   * - {String}   type    Media type, can be "audio" or "video".
   * - {Function} action  Function to be executed on click.
   * - {Enabled}  enabled Stream activation status (default: true).
   */
  var MediaControlButton = React.createClass({
    displayName: "MediaControlButton",

    propTypes: {
      action: React.PropTypes.func.isRequired,
      enabled: React.PropTypes.bool.isRequired,
      scope: React.PropTypes.string.isRequired,
      title: React.PropTypes.string,
      type: React.PropTypes.string.isRequired,
      visible: React.PropTypes.bool.isRequired
    },

    getDefaultProps: function () {
      return { enabled: true, visible: true };
    },

    handleClick: function () {
      this.props.action();
    },

    _getClasses: function () {
      var cx = classNames;
      // classes
      var classesObj = {
        "btn": true,
        "media-control": true,
        "transparent-button": true,
        "local-media": this.props.scope === "local",
        "muted": !this.props.enabled,
        "hide": !this.props.visible
      };
      classesObj["btn-mute-" + this.props.type] = true;
      return cx(classesObj);
    },

    _getTitle: function () {
      if (this.props.title) {
        return this.props.title;
      }

      var prefix = this.props.enabled ? "mute" : "unmute";
      var suffix = this.props.type === "video" ? "button_title2" : "button_title";
      var msgId = [prefix, this.props.scope, this.props.type, suffix].join("_");
      return mozL10n.get(msgId);
    },

    render: function () {
      return React.createElement("button", { className: this._getClasses(),
        onClick: this.handleClick,
        title: this._getTitle() });
    }
  });

  /**
   * Conversation controls.
   */
  var ConversationToolbar = React.createClass({
    displayName: "ConversationToolbar",

    getDefaultProps: function () {
      return {
        video: { enabled: true, visible: true },
        audio: { enabled: true, visible: true },
        showHangup: true
      };
    },

    getInitialState: function () {
      return {
        idle: false
      };
    },

    propTypes: {
      audio: React.PropTypes.object.isRequired,
      dispatcher: React.PropTypes.instanceOf(loop.Dispatcher).isRequired,
      hangup: React.PropTypes.func.isRequired,
      publishStream: React.PropTypes.func.isRequired,
      showHangup: React.PropTypes.bool,
      video: React.PropTypes.object.isRequired
    },

    handleClickHangup: function () {
      this.props.hangup();
    },

    handleToggleVideo: function () {
      this.props.publishStream("video", !this.props.video.enabled);
    },

    handleToggleAudio: function () {
      this.props.publishStream("audio", !this.props.audio.enabled);
    },

    componentDidMount: function () {
      this.userActivity = false;
      this.startIdleCountDown();
      document.body.addEventListener("mousemove", this._onBodyMouseMove);
    },

    componentWillUnmount: function () {
      clearTimeout(this.inactivityTimeout);
      clearInterval(this.inactivityPollInterval);
      document.body.removeEventListener("mousemove", this._onBodyMouseMove);
    },

    /**
     * If the conversation toolbar is idle, update its state and initialize the countdown
     * to return of the idle state. If the toolbar is active, only it's updated the userActivity flag.
     */
    _onBodyMouseMove: function () {
      if (this.state.idle) {
        this.setState({ idle: false });
        this.startIdleCountDown();
      } else {
        this.userActivity = true;
      }
    },

    /**
     * Instead of resetting the timeout for every mousemove (this event is called to many times,
     * when the mouse is moving, we check the flat userActivity every 4 seconds. If the flag is activated,
     * the user is still active, and we can restart the countdown for the idle state
     */
    checkUserActivity: function () {
      this.inactivityPollInterval = setInterval(function () {
        if (this.userActivity) {
          this.userActivity = false;
          this.restartIdleCountDown();
        }
      }.bind(this), 4000);
    },

    /**
     * Stop the execution of the current inactivity countdown and it starts a new one.
     */
    restartIdleCountDown: function () {
      clearTimeout(this.inactivityTimeout);
      this.startIdleCountDown();
    },

    /**
     * Launchs the process to check the user activity and the inactivity countdown to change
     * the toolbar to idle.
     * When the toolbar changes to idle, we remove the procces to check the user activity,
     * because the toolbar is going to be updated directly when the user moves the mouse.
     */
    startIdleCountDown: function () {
      this.checkUserActivity();
      this.inactivityTimeout = setTimeout(function () {
        this.setState({ idle: true });
        clearInterval(this.inactivityPollInterval);
      }.bind(this), 6000);
    },

    render: function () {
      var cx = classNames;
      var conversationToolbarCssClasses = cx({
        "conversation-toolbar": true,
        "idle": this.state.idle
      });
      var showButtons = this.props.video.visible || this.props.audio.visible;
      var mediaButtonGroupCssClasses = cx({
        "conversation-toolbar-media-btn-group-box": true,
        "hide": !showButtons
      });
      return React.createElement(
        "ul",
        { className: conversationToolbarCssClasses },
        this.props.showHangup && showButtons ? React.createElement(
          "li",
          { className: "conversation-toolbar-btn-box btn-hangup-entry" },
          React.createElement(HangUpControlButton, { action: this.handleClickHangup,
            title: mozL10n.get("rooms_leave_button_label") })
        ) : null,
        React.createElement(
          "li",
          { className: "conversation-toolbar-btn-box" },
          React.createElement(
            "div",
            { className: mediaButtonGroupCssClasses },
            React.createElement(MediaControlButton, { action: this.handleToggleVideo,
              enabled: this.props.video.enabled,
              scope: "local", type: "video",
              visible: this.props.video.visible }),
            React.createElement(MediaControlButton, { action: this.handleToggleAudio,
              enabled: this.props.audio.enabled,
              scope: "local", type: "audio",
              visible: this.props.audio.visible })
          )
        )
      );
    }
  });

  /**
   * Notification view.
   */
  var NotificationView = React.createClass({
    displayName: "NotificationView",

    mixins: [Backbone.Events],

    propTypes: {
      notification: React.PropTypes.object.isRequired
    },

    render: function () {
      var notification = this.props.notification;
      return React.createElement(
        "div",
        { className: "notificationContainer" },
        React.createElement(
          "div",
          { className: "alert alert-" + notification.get("level") },
          React.createElement(
            "span",
            { className: "message" },
            notification.get("message")
          )
        ),
        React.createElement(
          "div",
          { className: "detailsBar details-" + notification.get("level"),
            hidden: !notification.get("details") },
          React.createElement(
            "button",
            { className: "detailsButton btn-info",
              hidden: !notification.get("detailsButtonLabel") || !notification.get("detailsButtonCallback"),
              onClick: notification.get("detailsButtonCallback") },
            notification.get("detailsButtonLabel")
          ),
          React.createElement(
            "span",
            { className: "details" },
            notification.get("details")
          )
        )
      );
    }
  });

  /**
   * Notification list view.
   */
  var NotificationListView = React.createClass({
    displayName: "NotificationListView",

    mixins: [Backbone.Events, sharedMixins.DocumentVisibilityMixin],

    propTypes: {
      clearOnDocumentHidden: React.PropTypes.bool,
      notifications: React.PropTypes.object.isRequired
    },

    getDefaultProps: function () {
      return { clearOnDocumentHidden: false };
    },

    componentDidMount: function () {
      this.listenTo(this.props.notifications, "reset add remove", function () {
        this.forceUpdate();
      });
    },

    componentWillUnmount: function () {
      this.stopListening(this.props.notifications);
    },

    /**
     * Provided by DocumentVisibilityMixin. Clears notifications stack when the
     * current document is hidden if the clearOnDocumentHidden prop is set to
     * true and the collection isn't empty.
     */
    onDocumentHidden: function () {
      if (this.props.clearOnDocumentHidden && this.props.notifications.length > 0) {
        // Note: The `silent` option prevents the `reset` event to be triggered
        // here, preventing the UI to "jump" a little because of the event
        // callback being processed in another tick (I think).
        this.props.notifications.reset([], { silent: true });
        this.forceUpdate();
      }
    },

    render: function () {
      return React.createElement(
        "div",
        { className: "messages" },
        this.props.notifications.map(function (notification, key) {
          return React.createElement(NotificationView, { key: key, notification: notification });
        })
      );
    }
  });

  var Button = React.createClass({
    displayName: "Button",

    propTypes: {
      additionalClass: React.PropTypes.string,
      caption: React.PropTypes.string.isRequired,
      children: React.PropTypes.element,
      disabled: React.PropTypes.bool,
      htmlId: React.PropTypes.string,
      onClick: React.PropTypes.func.isRequired
    },

    getDefaultProps: function () {
      return {
        disabled: false,
        additionalClass: "",
        htmlId: ""
      };
    },

    render: function () {
      var cx = classNames;
      var classObject = { button: true, disabled: this.props.disabled };
      if (this.props.additionalClass) {
        classObject[this.props.additionalClass] = true;
      }
      return React.createElement(
        "button",
        { className: cx(classObject),
          disabled: this.props.disabled,
          id: this.props.htmlId,
          onClick: this.props.onClick },
        React.createElement(
          "span",
          { className: "button-caption" },
          this.props.caption
        ),
        this.props.children
      );
    }
  });

  var ButtonGroup = React.createClass({
    displayName: "ButtonGroup",

    propTypes: {
      additionalClass: React.PropTypes.string,
      children: React.PropTypes.oneOfType([React.PropTypes.element, React.PropTypes.arrayOf(React.PropTypes.element)])
    },

    getDefaultProps: function () {
      return {
        additionalClass: ""
      };
    },

    render: function () {
      var cx = classNames;
      var classObject = { "button-group": true };
      if (this.props.additionalClass) {
        classObject[this.props.additionalClass] = true;
      }
      return React.createElement(
        "div",
        { className: cx(classObject) },
        this.props.children
      );
    }
  });

  var Checkbox = React.createClass({
    displayName: "Checkbox",

    propTypes: {
      additionalClass: React.PropTypes.string,
      checked: React.PropTypes.bool,
      disabled: React.PropTypes.bool,
      label: React.PropTypes.string,
      onChange: React.PropTypes.func.isRequired,
      // If true, this will cause the label to be cut off at the end of the
      // first line with an ellipsis, and a tooltip supplied.
      useEllipsis: React.PropTypes.bool,
      // If `value` is not supplied, the consumer should rely on the boolean
      // `checked` state changes.
      value: React.PropTypes.string
    },

    getDefaultProps: function () {
      return {
        additionalClass: "",
        checked: false,
        disabled: false,
        label: null,
        useEllipsis: false,
        value: ""
      };
    },

    componentWillReceiveProps: function (nextProps) {
      // Only change the state if the prop has changed, and if it is also
      // different from the state.
      if (this.props.checked !== nextProps.checked && this.state.checked !== nextProps.checked) {
        this.setState({ checked: nextProps.checked });
      }
    },

    getInitialState: function () {
      return {
        checked: this.props.checked,
        value: this.props.checked ? this.props.value : ""
      };
    },

    _handleClick: function (event) {
      event.preventDefault();

      var newState = {
        checked: !this.state.checked,
        value: this.state.checked ? "" : this.props.value
      };
      this.setState(newState);
      this.props.onChange(newState);
    },

    render: function () {
      var cx = classNames;
      var wrapperClasses = {
        "checkbox-wrapper": true,
        disabled: this.props.disabled
      };
      var checkClasses = {
        checkbox: true,
        checked: this.state.checked,
        disabled: this.props.disabled
      };
      var labelClasses = {
        "checkbox-label": true,
        "ellipsis": this.props.useEllipsis
      };

      if (this.props.additionalClass) {
        wrapperClasses[this.props.additionalClass] = true;
      }
      return React.createElement(
        "div",
        { className: cx(wrapperClasses),
          disabled: this.props.disabled,
          onClick: this._handleClick },
        React.createElement("div", { className: cx(checkClasses) }),
        this.props.label ? React.createElement(
          "div",
          { className: cx(labelClasses),
            title: this.props.useEllipsis ? this.props.label : "" },
          this.props.label
        ) : null
      );
    }
  });

  /**
   * Renders an avatar element for display when video is muted.
   */
  var AvatarView = React.createClass({
    displayName: "AvatarView",

    mixins: [React.addons.PureRenderMixin],

    render: function () {
      return React.createElement("div", { className: "avatar" });
    }
  });

  /**
   * Renders a loading spinner for when video content is not yet available.
   */
  var LoadingView = React.createClass({
    displayName: "LoadingView",

    mixins: [React.addons.PureRenderMixin],

    render: function () {
      return React.createElement(
        "div",
        { className: "loading-background" },
        React.createElement("div", { className: "loading-stream" })
      );
    }
  });

  /**
   * Renders a url that's part of context on the display.
   *
   * @property {Boolean} allowClick         Set to true to allow the url to be clicked. If this
   *                                        is specified, then 'dispatcher' is also required.
   * @property {String}  description        The description for the context url.
   * @property {loop.Dispatcher} dispatcher
   * @property {String}  thumbnail          The thumbnail url (expected to be a data url) to
   *                                        display. If not specified, a fallback url will be
   *                                        shown.
   * @property {String}  url                The url to be displayed. If not present or invalid,
   *                                        then this view won't be displayed.
   * @property {Boolean} useDesktopPaths    Whether or not to use the desktop paths for for the
   *                                        fallback url.
   */
  var ContextUrlView = React.createClass({
    displayName: "ContextUrlView",

    mixins: [React.addons.PureRenderMixin],

    propTypes: {
      allowClick: React.PropTypes.bool.isRequired,
      description: React.PropTypes.string.isRequired,
      dispatcher: React.PropTypes.instanceOf(loop.Dispatcher),
      thumbnail: React.PropTypes.string,
      url: React.PropTypes.string,
      useDesktopPaths: React.PropTypes.bool.isRequired
    },

    /**
     * Dispatches an action to record when the link is clicked.
     */
    handleLinkClick: function () {
      if (!this.props.allowClick) {
        return;
      }

      this.props.dispatcher.dispatch(new sharedActions.RecordClick({
        linkInfo: "Shared URL"
      }));
    },

    render: function () {
      var hostname;

      try {
        hostname = new URL(this.props.url).hostname;
      } catch (ex) {
        return null;
      }

      var thumbnail = this.props.thumbnail;

      if (!thumbnail) {
        thumbnail = this.props.useDesktopPaths ? "shared/img/icons-16x16.svg#globe" : "shared/img/icons-16x16.svg#globe";
      }

      var wrapperClasses = classNames({
        "context-wrapper": true,
        "clicks-allowed": this.props.allowClick
      });

      return React.createElement(
        "div",
        { className: "context-content" },
        React.createElement(
          "a",
          { className: wrapperClasses,
            href: this.props.allowClick ? this.props.url : null,
            onClick: this.handleLinkClick,
            rel: "noreferrer",
            target: "_blank" },
          React.createElement("img", { className: "context-preview", src: thumbnail }),
          React.createElement(
            "span",
            { className: "context-info" },
            this.props.description,
            React.createElement(
              "span",
              { className: "context-url" },
              hostname
            )
          )
        )
      );
    }
  });

  /**
   * Renders a media element for display. This also handles displaying an avatar
   * instead of the video, and attaching a video stream to the video element.
   */
  var MediaView = React.createClass({
    displayName: "MediaView",

    // srcMediaElement should be ok for a shallow comparison, so we are safe
    // to use the pure render mixin here.
    mixins: [React.addons.PureRenderMixin],

    propTypes: {
      displayAvatar: React.PropTypes.bool.isRequired,
      isLoading: React.PropTypes.bool.isRequired,
      mediaType: React.PropTypes.string.isRequired,
      posterUrl: React.PropTypes.string,
      // Expecting "local" or "remote".
      srcMediaElement: React.PropTypes.object
    },

    componentDidMount: function () {
      if (!this.props.displayAvatar) {
        this.attachVideo(this.props.srcMediaElement);
      }
    },

    componentDidUpdate: function () {
      if (!this.props.displayAvatar) {
        this.attachVideo(this.props.srcMediaElement);
      }
    },

    /**
     * Attaches a video stream from a donor video element to this component's
     * video element if the component is displaying one.
     *
     * @param {Object} srcMediaElement The src video object to clone the stream
     *                                from.
     *
     * XXX need to have a corresponding detachVideo or change this to syncVideo
     * to protect from leaks (bug 1171978)
     */
    attachVideo: function (srcMediaElement) {
      if (!srcMediaElement) {
        // Not got anything to display.
        return;
      }

      var videoElement = this.getDOMNode();

      if (videoElement.tagName.toLowerCase() !== "video") {
        // Must be displaying the avatar view, so don't try and attach video.
        return;
      }

      // Set the src of our video element
      var attrName = "";
      if ("srcObject" in videoElement) {
        // srcObject is according to the standard.
        attrName = "srcObject";
      } else if ("mozSrcObject" in videoElement) {
        // mozSrcObject is for Firefox
        attrName = "mozSrcObject";
      } else if ("src" in videoElement) {
        // src is for Chrome.
        attrName = "src";
      } else {
        console.error("Error attaching stream to element - no supported" + "attribute found");
        return;
      }

      // If the object hasn't changed it, then don't reattach it.
      if (videoElement[attrName] !== srcMediaElement[attrName]) {
        videoElement[attrName] = srcMediaElement[attrName];
      }
      videoElement.play();
    },

    render: function () {
      if (this.props.isLoading) {
        return React.createElement(LoadingView, null);
      }

      if (this.props.displayAvatar) {
        return React.createElement(AvatarView, null);
      }

      if (!this.props.srcMediaElement && !this.props.posterUrl) {
        return React.createElement("div", { className: "no-video" });
      }

      var optionalPoster = {};
      if (this.props.posterUrl) {
        optionalPoster.poster = this.props.posterUrl;
      }

      // For now, always mute media. For local media, we should be muted anyway,
      // as we don't want to hear ourselves speaking.
      //
      // For remote media, we would ideally have this live video element in
      // control of the audio, but due to the current method of not rendering
      // the element at all when video is muted we have to rely on the hidden
      // dom element in the sdk driver to play the audio.
      // We might want to consider changing this if we add UI controls relating
      // to the remote audio at some stage in the future.
      return React.createElement("video", _extends({}, optionalPoster, {
        className: this.props.mediaType + "-video",
        muted: true }));
    }
  });

  var MediaLayoutView = React.createClass({
    displayName: "MediaLayoutView",

    propTypes: {
      children: React.PropTypes.node,
      dispatcher: React.PropTypes.instanceOf(loop.Dispatcher).isRequired,
      displayScreenShare: React.PropTypes.bool.isRequired,
      isLocalLoading: React.PropTypes.bool.isRequired,
      isRemoteLoading: React.PropTypes.bool.isRequired,
      isScreenShareLoading: React.PropTypes.bool.isRequired,
      // The poster URLs are for UI-showcase testing and development.
      localPosterUrl: React.PropTypes.string,
      localSrcMediaElement: React.PropTypes.object,
      localVideoMuted: React.PropTypes.bool.isRequired,
      // Passing in matchMedia, allows it to be overriden for ui-showcase's
      // benefit. We expect either the override or window.matchMedia.
      matchMedia: React.PropTypes.func.isRequired,
      remotePosterUrl: React.PropTypes.string,
      remoteSrcMediaElement: React.PropTypes.object,
      renderRemoteVideo: React.PropTypes.bool.isRequired,
      screenShareMediaElement: React.PropTypes.object,
      screenSharePosterUrl: React.PropTypes.string,
      showInitialContext: React.PropTypes.bool.isRequired,
      useDesktopPaths: React.PropTypes.bool.isRequired
    },

    isLocalMediaAbsolutelyPositioned: function (matchMedia) {
      if (!matchMedia) {
        matchMedia = this.props.matchMedia;
      }
      return matchMedia && (
      // The screen width is less than 640px and we are not screen sharing.
      matchMedia("screen and (max-width:640px)").matches && !this.props.displayScreenShare ||
      // or the screen width is less than 300px.
      matchMedia("screen and (max-width:300px)").matches);
    },

    getInitialState: function () {
      return {
        localMediaAboslutelyPositioned: this.isLocalMediaAbsolutelyPositioned()
      };
    },

    componentWillReceiveProps: function (nextProps) {
      // This is all for the ui-showcase's benefit.
      if (this.props.matchMedia !== nextProps.matchMedia) {
        this.updateLocalMediaState(null, nextProps.matchMedia);
      }
    },

    componentDidMount: function () {
      window.addEventListener("resize", this.updateLocalMediaState);
    },

    componentWillUnmount: function () {
      window.removeEventListener("resize", this.updateLocalMediaState);
    },

    updateLocalMediaState: function (event, matchMedia) {
      var newState = this.isLocalMediaAbsolutelyPositioned(matchMedia);
      if (this.state.localMediaAboslutelyPositioned !== newState) {
        this.setState({
          localMediaAboslutelyPositioned: newState
        });
      }
    },

    renderLocalVideo: function () {
      return React.createElement(
        "div",
        { className: "local" },
        React.createElement(MediaView, { displayAvatar: this.props.localVideoMuted,
          isLoading: this.props.isLocalLoading,
          mediaType: "local",
          posterUrl: this.props.localPosterUrl,
          srcMediaElement: this.props.localSrcMediaElement })
      );
    },

    render: function () {
      var remoteStreamClasses = classNames({
        "remote": true,
        "focus-stream": !this.props.displayScreenShare
      });

      var screenShareStreamClasses = classNames({
        "screen": true,
        "focus-stream": this.props.displayScreenShare
      });

      var mediaWrapperClasses = classNames({
        "media-wrapper": true,
        "receiving-screen-share": this.props.displayScreenShare,
        "showing-local-streams": this.props.localSrcMediaElement || this.props.localPosterUrl,
        "showing-remote-streams": this.props.remoteSrcMediaElement || this.props.remotePosterUrl || this.props.isRemoteLoading
      });

      return React.createElement(
        "div",
        { className: "media-layout" },
        React.createElement(
          "div",
          { className: mediaWrapperClasses },
          React.createElement(
            "span",
            { className: "self-view-hidden-message" },
            mozL10n.get("self_view_hidden_message")
          ),
          React.createElement(
            "div",
            { className: remoteStreamClasses },
            React.createElement(MediaView, { displayAvatar: !this.props.renderRemoteVideo,
              isLoading: this.props.isRemoteLoading,
              mediaType: "remote",
              posterUrl: this.props.remotePosterUrl,
              srcMediaElement: this.props.remoteSrcMediaElement }),
            this.state.localMediaAboslutelyPositioned ? this.renderLocalVideo() : null,
            this.props.displayScreenShare ? null : this.props.children
          ),
          React.createElement(
            "div",
            { className: screenShareStreamClasses },
            React.createElement(MediaView, { displayAvatar: false,
              isLoading: this.props.isScreenShareLoading,
              mediaType: "screen-share",
              posterUrl: this.props.screenSharePosterUrl,
              srcMediaElement: this.props.screenShareMediaElement }),
            this.props.displayScreenShare ? this.props.children : null
          ),
          React.createElement(loop.shared.views.chat.TextChatView, {
            dispatcher: this.props.dispatcher,
            showInitialContext: this.props.showInitialContext,
            useDesktopPaths: this.props.useDesktopPaths }),
          this.state.localMediaAboslutelyPositioned ? null : this.renderLocalVideo()
        )
      );
    }
  });

  return {
    AvatarView: AvatarView,
    Button: Button,
    ButtonGroup: ButtonGroup,
    Checkbox: Checkbox,
    ContextUrlView: ContextUrlView,
    ConversationToolbar: ConversationToolbar,
    MediaControlButton: MediaControlButton,
    MediaLayoutView: MediaLayoutView,
    MediaView: MediaView,
    LoadingView: LoadingView,
    NotificationListView: NotificationListView
  };
}(_, navigator.mozL10n || document.mozL10n);
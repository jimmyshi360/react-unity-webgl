import * as React from "react";
import IUnityProps from "../interfaces/IUnityProps";
import IUnityState from "../interfaces/IUnityState";
import UnityContent from "../UnityContent";
import UnityLoaderService from "../services/UnityLoaderService";
import "../declarations/UnityLoader";
import "../declarations/UnityInstance";
import "../declarations/ReactUnityWebgl";

export default class Unity extends React.Component<IUnityProps, IUnityState> {
  /**
   * Reference to the wrappers html element.
   * @type {HTMLElement}
   * @private
   */
  private htmlElement?: HTMLElement;

  /**
   * The Unity content passed by the props.
   * @type {UnityContent}
   * @private
   */
  private unityContent: UnityContent;

  /**
   * The Unity Loader service instance.
   * @type {UnityLoaderService}
   * @private
   */
  private unityLoaderService: UnityLoaderService;

  /**
   * The component state.
   * @type {IUnityState}
   * @public
   */
  public state: IUnityState = {};

  /**
   * The stored binding for the on window
   * resize listener.
   */
  private onWindowResizeBinding: () => void;

  /**
   * Initialized the component.
   * @param {IUnityProps} props
   */
  constructor(props: IUnityProps) {
    super(props);
    this.unityLoaderService = new UnityLoaderService();
    this.onWindowResizeBinding = this.onWindowResize.bind(this);
    this.unityContent = this.props.unityContent;
    this.unityContent.setComponentInstance(this);
  }

  /**
   * An event that is triggered by the Unity player. This tracks
   * the loading progression of the player. It will send '1' when
   * the loading is completed.
   * @param {UnityInstance} unityInstance
   * @param {number} progression
   * @private
   */
  Unity.prototype.onProgress = function (unityInstance, progression) {
       this.unityContent.triggerUnityEvent("progress", progression);
       if (progression === 1)
           this.unityContent.triggerUnityEvent("loaded");

       if (typeof this.htmlElement !== "undefined") {
           if (!unityInstance.logo) {
               unityInstance.logo = document.createElement("div");
               unityInstance.logo.className = "logo " + unityInstance.Module.splashScreenStyle;
               unityInstance.container.appendChild(unityInstance.logo);
             }
             if (!unityInstance.progress) {    
               unityInstance.progress = document.createElement("div");
               unityInstance.progress.className = "progress " + unityInstance.Module.splashScreenStyle;
               unityInstance.progress.empty = document.createElement("div");
               unityInstance.progress.empty.className = "empty";
               unityInstance.progress.empty.style.width = "100%";
               unityInstance.progress.appendChild(unityInstance.progress.empty);
               unityInstance.progress.full = document.createElement("div");
               unityInstance.progress.full.className = "full";
               unityInstance.progress.full.style.width = "0%";
               unityInstance.progress.appendChild(unityInstance.progress.full);
               unityInstance.container.appendChild(unityInstance.progress);
             }
             unityInstance.progress.full.style.width = (100 * (1 - progression)) + "%";
             unityInstance.progress.empty.style.width = (100 * progression) + "%";
             if (progression == 1) {
               unityInstance.logo.style.display = unityInstance.progress.style.display = "none";
             } else {
                 if (unityInstance.logo && unityInstance.progress) {
                   unityInstance.logo.style.display = unityInstance.progress.style.display = "flex";
                 }
             }
       }
   };

  /**
   * When the window is resized.
   */
  private onWindowResize(): void {
    if (this.unityContent.unityConfig.adjustOnWindowResize === true) {
      this.unityContent.triggerUnityEvent("resized");
      this.adjustCanvasToContainer();
    }
  }

  /**
   * Since the Unity canvas itself does not respond to the resizing
   * of it's container we have to manually do this. A width and height
   * of 100% does not seem to work, so we have to fetch it's parent's
   * size to adject the canvas.
   * @private
   */
  private adjustCanvasToContainer(): void {
    if (typeof this.htmlElement !== "undefined") {
      const _width = this.htmlElement.offsetWidth;
      const _height = this.htmlElement.offsetHeight;
      const _canvas = this.htmlElement.getElementsByTagName("canvas")[0];
      if (typeof _canvas !== "undefined" && _canvas.height !== _height)
        _canvas.height = _height;
      if (typeof _canvas !== "undefined" && _canvas.width !== _width)
        _canvas.width = _width;
    }
  }

  /**
   * Initialzied the Unity player when the component is mounted.
   * @public
   */
  public componentDidMount(): void {
    window.addEventListener("resize", this.onWindowResizeBinding);
    // prettier-ignore
    this.unityLoaderService.append(this.props.unityContent.unityLoaderJsPath, () => {
      UnityLoader.Error.handler = _message => {
        this.unityContent.triggerUnityEvent("error", _message);
        console.error("React Unity WebGL", _message);
      };
      this.unityContent.setUnityInstance(UnityLoader.instantiate(
        `__ReactUnityWebGL_${ this.props.unityContent.uniqueID}__`,
        this.props.unityContent.buildJsonPath, {
          onProgress: this.onProgress.bind(this),
          Module: this.props.unityContent.unityConfig.modules,
          width: "100%",
          height: "100%"
        }));
      }
    );
  }

  /**
   * Will remove event listeners and clean up systems when the
   * component is about to unmount.
   * @public
   */
  public componentWillUnmount(): void {
    this.unityContent.remove();
    window.removeEventListener("resize", this.onWindowResizeBinding);
  }

  /**
   * Renders the unity wrapper and player.
   * @returns {React.ReactNode} element
   * @public
   */
  public render(): React.ReactNode {
    return React.createElement("div", {
      className: this.props.className || "",
      ref: (ref: any) => (this.htmlElement = ref!),
      id: `__ReactUnityWebGL_${this.props.unityContent.uniqueID}__`,
      style: {
        width: this.props.width || "800px",
        height: this.props.height || "600px"
      }
    });
  }
}

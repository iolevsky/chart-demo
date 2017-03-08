module Plottable {
    export module Components {
        export class Shape extends Component {
            static idCounter: number = 0;
            protected _id: string;
            protected _drawer: Drawer;
            protected _renderArea: d3.Selection<void>;
            protected _config: any;

            constructor(config: any) {
                super();
                this._id = "shape" + Shape.idCounter++;
                this._config = config;
                this._config.id = this._id;
            }

            public checkPointCollision(point: Point): boolean {
                return false;
            }

            public renderImmediately() {
                let drawSteps = [{attrToProjector: this._generateAttrToProjector(), animator: this._createAnimator()}];
                this._drawer.draw([{}], drawSteps);
                return this;
            }

            protected _setup() {
                super._setup();
                this._drawer = this._createDrawer(this._config);
                this._renderArea = this.content().append("g").classed("render-area", true);
                this._drawer.renderArea(this._renderArea);
            }

            protected _createDrawer(config: any): any {
                return new Drawer(new Dataset([config]));
            }

            protected _createAnimator(): any {
                return new Animators.Null();
            }

            protected _generateAttrToProjector(): AttributeToProjector {
                let h: AttributeToProjector = {};
                let config = this._config;
                Object.keys(config).forEach((key) => {
                    if (typeof config[key] === "function") {
                        h[key] = config[key];
                    } else {
                        h[key] = function(d,i) { return config[key]};
                    }
                });
                return h;
            }
        }
    }
}
module Plottable {
    export module Components {
        export class Circle extends Shape {
            constructor(config: any) {
                super(config);
            }

            public computeLayout(origin?: Point, availableWidth?: number, availableHeight?: number) {
                super.computeLayout(origin, availableWidth, availableHeight);
                this._renderArea.attr("transform", "translate(" + this._config.r + "," + this._config.r + ")");

                return this;
            }

            public checkPointCollision(point: Point): boolean {
                let distance = Math.sqrt(Math.pow(this._config.r - point.x, 2) + Math.pow(this._config.r - point.y, 2));
                return distance <= this._config.r;
            }

            protected _createDrawer(config: any) {
                return new Drawers.Circle(new Dataset([config]));
            }

            protected _sizeFromOffer(availableWidth: number, availableHeight: number) {
                return {
                    width: this._config.r * 2,
                    height: this._config.r * 2
                };
            }
        }
    }
}
module Plottable {
    export module Drawers {
        export class ArcAll extends Drawer {

            constructor(dataset: Dataset) {
                super(dataset);
                this._className = "arc fill outline";
                this._svgElementName = "path";
            }
        }
    }
}

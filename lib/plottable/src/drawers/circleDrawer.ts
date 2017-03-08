module Plottable {
    export module Drawers {
        export class Circle extends Drawer {

            constructor(dataset: Dataset) {
                super(dataset);
                this._svgElementName = "circle";
            }

        }
    }
}

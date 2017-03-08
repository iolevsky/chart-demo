module Plottable {
    export module Animators {

        /**
         *
         */
        export class Arc extends Easing {
            private _endAngles: any;
            private _startAngles: any;

            /**
             * Constructs the default animator
             *
             * @constructor
             */
            constructor(startAngles: any, endAngles: any) {
                super();
                this._endAngles = endAngles;
                this._startAngles = startAngles;
            }

            //arcanimate
            public animate(selection: d3.Selection<any>, attrToAppliedProjector: AttributeToAppliedProjector) {
                let numberOfSteps = selection[0].length;
                let adjustedIterativeDelay = this._getAdjustedIterativeDelay(numberOfSteps);

                return selection.transition()
                    .ease(this.easingMode())
                    .duration(this.stepDuration())
                    .delay((d: any, i: number) => this.startDelay() + adjustedIterativeDelay * i)
                    .attr(attrToAppliedProjector)
                    .attrTween("d", (d, index) => this._pathTween(d, index, attrToAppliedProjector["d"]));
            }

            public _pathTween(d: any, index: any, dProjector: any) {
                var i = d3.interpolate(index > 0 ? this._endAngles[index - 1] : 0, this._endAngles[index]);
                return function(t: any) {
                    d.endAngle = i(t);
                    return dProjector(d, index);
                };
            }
        }
    }
}

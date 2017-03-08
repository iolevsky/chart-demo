module Plottable {
    export module Components {
        export class Arc extends Shape {
            private _arcLabel: Accessor<string>;
            private _dataset: Dataset;
            private _innerRadius: number;
            private _outerRadius: number;
            private _startAngle: number;
            private _endAngle: number;
            private _startAngles: any;
            private _endAngles: any;

            constructor(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number, config: any) {
                super(config);

                this._dataset = new Dataset([{}]);
                this._startAngle = startAngle * (Math.PI / 180);
                this._endAngle = endAngle * (Math.PI / 180);

                this.setSize(innerRadius, outerRadius);
            }

            public setSize(innerRadius: number, outerRadius: number) {
                this._innerRadius = innerRadius;
                this._outerRadius = outerRadius;
                this._updateArcLayout();
                return this;
            }

            public addDataset(dataset: Dataset) {
                this._dataset = dataset;
                this._updateArcLayout();
                return this;
            }

            public arcLabel(callback: Accessor<string>) {
                this._arcLabel = callback;
                return this;
            }

            public computeLayout(origin?: Point, availableWidth?: number, availableHeight?: number) {
                super.computeLayout(origin, availableWidth, availableHeight);
                //this._renderArea.attr("transform", "translate(" + this._outerRadius + "," + this._outerRadius + ")");
                return this;
            }

            public checkPointCollision(point: Point): boolean {
                let distance = Math.sqrt(Math.pow(this._outerRadius - point.x, 2) + Math.pow(this._outerRadius - point.y, 2));
                return distance <= this._outerRadius;
            }

            public renderImmediately() {
                let drawSteps = [{attrToProjector: this._generateAttrToProjector(), animator: this._createAnimator()}];
                this._drawer.draw(this._dataset.data(), drawSteps);

                if (this._arcLabel) {
                    this._drawLabels();
                }
                return this;
            }

            protected _createDrawer(config: any): any {
                return new Drawers.ArcAll(this._dataset);
            }

            protected _createAnimator(): any {
                return new Animators.Arc(this._startAngles, this._endAngles);
            }

            protected _sizeFromOffer(availableWidth: number, availableHeight: number) {
                return {
                    width: this._outerRadius * 2,
                    height: this._outerRadius * 2
                };
            }

            private _updateArcLayout() {
                let pie = d3.layout.pie()
                    .sort(null)
                    .value(function(d,i){return 1})
                    .startAngle(this._startAngle)
                    .endAngle(this._endAngle)(this._dataset.data());

                this._startAngles = pie.map((slice:any) => slice.startAngle);
                this._endAngles = pie.map((slice:any) => slice.endAngle);

                this._config["d"] = (datum: any, index: number) => {
                    return d3.svg.arc()
                        .innerRadius(this._innerRadius)
                        .outerRadius(this._outerRadius)
                        .startAngle(this._startAngles[index])(datum, index);
                };

                let shapeId = this._id;
                this._config["id"] = (datum: any, index: number) => {
                    return shapeId + "arc" + index;
                };
            }

            private _drawLabels() {
                let labelArea = this._renderArea.append("g").classed("label-area", true);
                let defs = labelArea.append("defs");

                let data = this._dataset.data();
                let clipArc = (datum: any, index: number) => {
                    return d3.svg.arc()
                        .innerRadius(this._innerRadius)
                        .outerRadius(this._outerRadius)
                        .startAngle(this._startAngles[index])
                        .endAngle(this._endAngles[index])(datum, index);
                };

                data.forEach((datum, datumIndex) => {
                    let value = this._arcLabel(datum, datumIndex, this._dataset);

                    let arcId = this._id + "arc" + String(datumIndex);
                    let clipId = this._id + "textclip" + String(datumIndex);
                    let textPathId = this._id + "textpath" + String(datumIndex);

                    defs.append("path")
                        .attr("id", textPathId)
                        .attr("d", clipArc(datum, datumIndex));

                    labelArea.append("clipPath")
                        .attr("id", clipId)
                        .append("use")
                        .attr("xlink:href", "#" + arcId);

                    let text = labelArea.append("text")
                        .attr("clip-path", "url(#" + clipId + ")")
                        .attr("text-anchor", "middle")
                        //.attr("dx", "50%")
                        .attr("dy", 3)
                        .style("font-size", "3px")
                        .style("fill", "#003160")
                        .append("textPath")
                        .attr("startOffset", "74%")
                        .attr("xlink:href", "#" + textPathId)
                        .text(value)
                });
            }
        }
    }
}
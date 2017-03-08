var Pie = (function () {
    function Pie(group, config, level, colorScale) {
        this.setLabels = function (accessor) {
            this.labelArc = new Plottable.Components.Arc(this.outerRadius / 2, this.outerRadius / 2 + this.config.labelArcWidth, 0, 360, { fill: "#E3EAFB", stroke: "#BAC6E2", "stroke-width": 0.1 })
                .addDataset(this.dataset)
                .arcLabel(accessor);
            this.group.append(this.labelArc);
            return this;
        };
        this.group = group;
        this.config = config;
        // scale maps the data values onto the pie sector radius, with each pie having its own scale
        this.scale = new Plottable.Scales.Linear();
        this.plot = new Plottable.Plots.Pie()
            .sectorValue(1, this.scale) // all wheel wedges are equal in size
            .attr("fill", colorScale.scale(level))
            .xAlignment("center")
            .yAlignment("center");
        this.group.append(this.plot);
    }
    Pie.prototype.setDataset = function (dataset, accessor) {
        this.dataset = dataset;
        this.plot.addDataset(dataset);
        // we are varying outer radius by the data value to visualize the data. this is unlike a typical
        // pie or wheel plot where sector size is used to show relationship between data values
        this.plot.outerRadius(accessor, this.scale);
        // pull out the data values being used for the pie chart into an array
        var dataValues = _.map(dataset.data(), function (n) {
            return accessor(n);
        });
        // assuming we don't deal with negative values, domain can start at zero and up to the maximum data value for the data
        this.scale.domain([0, _.max(dataValues)]);
        return this;
    };
    Pie.prototype.addClass = function (cssClass) {
        this.plot.addClass(cssClass);
    };
    Pie.prototype.setSize = function (innerRadius, outerRadius) {
        // all pies are sized equally to fill all available space. coordinate system is mapped to a square 100x100 units
        // in size, which represents 100% width and 100% height. a value of 10 is equivalent to 10% of SVG viewport.
        // range covers solely the pie at the current level, but as part of the calculation we must also include arcs
        // that are used to draw labels etc.
        this.scale.range([innerRadius, outerRadius / 2]);
        this.outerRadius = outerRadius;
        // set fixed dimensions to override plottable default, which is to use 100% of parent container
        this.plot.fixedDimensions(outerRadius, outerRadius);
        this.plot.innerRadius(innerRadius);
        if (this.labelArc) {
            this.labelArc.setSize(this.outerRadius / 2, this.outerRadius / 2 + this.config.labelArcWidth);
        }
    };
    return Pie;
}());
var clusterWheel = (function () {
    function clusterWheel(config) {
        this.pies = [];
        this.wheelAngle = 0;
        this.addPie = function (name) {
            var pie = new Pie(this.group, this.config, this.pies.length, this.colorScale);
            this.pies.push(pie);
            this.updateLayout();
            // put outline on top of other pie plots
            this.group.remove(this.outline);
            this.group.append(this.outline);
            return pie;
        };
        this.setSectionLabels = function (dataset, accessor) {
            this.labelArc = new Plottable.Components.Arc(50 - this.config.labelArcWidth, 50, 0, 360, { fill: "transparent", stroke: "#BAC6E2", "stroke-width": 0.1 })
                .addDataset(dataset)
                .arcLabel(accessor);
            this.group.append(this.labelArc);
        };
        this.config = config;
        this.group = new Plottable.Components.Group();
        this.group.fixedDimensions(100, 100); // group takes up 100% of parent container, viewbox must be 100x100 user units
        this.colorScale = new Plottable.Scales.Color();
        this.colorScale.range(config.colorRange);
        // opaque background
        this.group.append(new Plottable.Components.Arc(0, 50, 0, 360, { fill: "#F1F1E7" }));
        // center arc (circle) 
        this.group.append(new Plottable.Components.Arc(0, config.centerArcWidth, 0, 360, { fill: "#003160" }));
        // stroke outline for the whole wheel
        this.outline = new Plottable.Plots.Pie()
            .sectorValue(1) // all wheel wedges are equal in size
            .innerRadius(this.config.centerArcWidth)
            .attr("stroke", "#BAC6E2")
            .attr("fill", "transparent")
            .attr("stroke-width", "0.1")
            .addDataset(this.config.dataset)
            .xAlignment("center")
            .yAlignment("center");
        this.initDragInteraction();
        if (this.config.dragToRotate) {
            this.dragInteraction.attachTo(this.group);
        }
    }
    clusterWheel.prototype.initDragInteraction = function () {
        var _this = this;
        this.dragInteraction = new Plottable.Interactions.Drag();
        this.dragInteraction.constrainedToComponent(true);
        this.dragInteraction.onDragStart(function (startPoint) {
            _this.group.content().transition(); // force stop any transition currently in progress
        })
            .onDragEnd(function (startPoint, endPoint) {
            _this.wheelAngle = _this.wheelAngle + (_this.getAngle({ x: 50, y: 50 }, endPoint) - _this.getAngle({ x: 50, y: 50 }, startPoint));
            if (_this.wheelAngle > 360) {
                _this.wheelAngle = _this.wheelAngle - 360;
            }
            else if (_this.wheelAngle < 0) {
                _this.wheelAngle = _this.wheelAngle + 360;
            }
            _this.group.content().attr("transform", "rotate(" + _this.wheelAngle + ")");
        })
            .onDrag(function (startPoint, endPoint) {
            var newAngle = _this.wheelAngle + (_this.getAngle({ x: 50, y: 50 }, endPoint) - _this.getAngle({ x: 50, y: 50 }, startPoint));
            _this.group.content().attr("transform", "rotate(" + newAngle + ")");
        });
    };
    // calculates angle between two sets of coordinates (in our case, origin and mouse position)
    clusterWheel.prototype.getAngle = function (p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x) / (Math.PI / 180);
    };
    clusterWheel.prototype.render = function (target) {
        this.group.renderTo(target);
    };
    ;
    clusterWheel.prototype.updateLayout = function () {
        var _this = this;
        var pieWidth = (100 - (this.config.centerArcWidth + this.config.labelArcWidth + (this.config.labelArcWidth * (this.pies.length + 1)))) / this.pies.length;
        var innerRadius = 0;
        var outerRadius = 0;
        this.pies.forEach(function (pie, pieNumber) {
            if (pieNumber > 0) {
                innerRadius = _this.pies[pieNumber - 1].outerRadius / 2 + _this.config.labelArcWidth;
                outerRadius = innerRadius * 2 + (pieWidth - _this.config.labelArcWidth);
            }
            else {
                innerRadius = _this.config.centerArcWidth;
                outerRadius = innerRadius + (pieWidth - _this.config.labelArcWidth);
            }
            pie.setSize(innerRadius, outerRadius);
        });
    };
    return clusterWheel;
}());

class Pie {
	private scale;
	private plot;
	private dataset;
	private group;
	private labelArc;
	private outerRadius: number;
	private config;
	
	constructor(group, config, level, colorScale) {
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
	
	public setDataset(dataset, accessor) {
		this.dataset = dataset;
		this.plot.addDataset(dataset);
		
		// we are varying outer radius by the data value to visualize the data. this is unlike a typical
        // pie or wheel plot where sector size is used to show relationship between data values
        this.plot.outerRadius(accessor, this.scale);
		
		// pull out the data values being used for the pie chart into an array
		let dataValues = _.map(dataset.data(), function(n) {
			return accessor(n);
		});

		// assuming we don't deal with negative values, domain can start at zero and up to the maximum data value for the data
		this.scale.domain([0, _.max(dataValues)]);

		return this;
	}
	
	
    public setLabels = function(accessor) {
		this.labelArc = new Plottable.Components.Arc(this.outerRadius / 2, this.outerRadius / 2 + this.config.labelArcWidth, 0, 360, {fill: "#E3EAFB", stroke: "#BAC6E2", "stroke-width": 0.1 })
			.addDataset(this.dataset)
			.arcLabel(accessor);
		
		this.group.append(this.labelArc);
		return this;
	};
	
	public addClass(cssClass: string) {
		this.plot.addClass(cssClass);
	}

    public setSize(innerRadius: number, outerRadius: number) {
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
	}
}

class clusterWheel {
	private config;
	private group;
	private pies = [];
	private outline;
	private dragInteraction;
	private wheelAngle = 0;
	private colorScale;
	
	constructor(config) {
		this.config = config;
		this.group = new Plottable.Components.Group();
		this.group.fixedDimensions(100,100); // group takes up 100% of parent container, viewbox must be 100x100 user units
		this.colorScale = new Plottable.Scales.Color();
		this.colorScale.range(config.colorRange);
		
		// opaque background
		this.group.append(new Plottable.Components.Arc(0, 50, 0, 360, {fill: "#F1F1E7"}));
		
		// center arc (circle) 
	    this.group.append(new Plottable.Components.Arc(0, config.centerArcWidth, 0, 360, {fill: "#003160"}));
		
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
	
	private initDragInteraction() {
		this.dragInteraction = new Plottable.Interactions.Drag();
		this.dragInteraction.constrainedToComponent(true);
		this.dragInteraction.onDragStart((startPoint) => {
            this.group.content().transition(); // force stop any transition currently in progress
        })
        .onDragEnd((startPoint, endPoint) => {
            this.wheelAngle = this.wheelAngle + (this.getAngle({x: 50, y: 50}, endPoint) - this.getAngle({x: 50, y: 50}, startPoint));            

            if (this.wheelAngle > 360) {
                this.wheelAngle = this.wheelAngle - 360;
            } else if (this.wheelAngle < 0) {
                this.wheelAngle = this.wheelAngle + 360;
            }
            this.group.content().attr("transform", "rotate(" + this.wheelAngle + ")");
        })
        .onDrag((startPoint, endPoint) => {
            let newAngle = this.wheelAngle + (this.getAngle({x: 50, y: 50}, endPoint) - this.getAngle({x: 50, y: 50}, startPoint));
            this.group.content().attr("transform", "rotate(" + newAngle + ")");
        });
	}
	
	// calculates angle between two sets of coordinates (in our case, origin and mouse position)
	private getAngle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x) / (Math.PI / 180);
    }
	
	public addPie = function(name: string) {
        let pie = new Pie(this.group, this.config, this.pies.length, this.colorScale);
        this.pies.push(pie);
        this.updateLayout();

        // put outline on top of other pie plots
        this.group.remove(this.outline);
        this.group.append(this.outline);
        return pie;
    };
	
	public setSectionLabels = function(dataset, accessor) {
        this.labelArc = new Plottable.Components.Arc(50 - this.config.labelArcWidth, 50, 0, 360, {fill: "transparent", stroke: "#BAC6E2", "stroke-width": 0.1 })
            .addDataset(dataset)
            .arcLabel(accessor);

        this.group.append(this.labelArc);
    };
	
    public render(target) {
        this.group.renderTo(target);
    };
	
	public updateLayout() {
		let pieWidth: number = (100 - (this.config.centerArcWidth + this.config.labelArcWidth + (this.config.labelArcWidth * (this.pies.length + 1)))) / this.pies.length;
		let innerRadius: number = 0;
		let outerRadius: number = 0;
	
		this.pies.forEach((pie, pieNumber) => {
			if (pieNumber > 0) {
				innerRadius = this.pies[pieNumber - 1].outerRadius / 2 + this.config.labelArcWidth;
				outerRadius = innerRadius * 2 + (pieWidth - this.config.labelArcWidth);
			} else {
				innerRadius = this.config.centerArcWidth;
				outerRadius = innerRadius + (pieWidth - this.config.labelArcWidth);
			}
	
			pie.setSize(innerRadius, outerRadius);
		});
	}
	
	
}


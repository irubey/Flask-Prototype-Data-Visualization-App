function pyramidVisualizations(sportPyramidData,tradPyramidData,boulderPyramidData, userTicksData, binnedCodeDict){
  console.log(boulderPyramidData);
  sportPyramid(sportPyramidData, binnedCodeDict);
  sportAttempts(sportPyramidData, binnedCodeDict);
  sportCharacteristics(sportPyramidData, binnedCodeDict);
  sportLength(sportPyramidData, binnedCodeDict);
  sportSeasonality(sportPyramidData, binnedCodeDict);

  function sportPyramid(sportPyramidData, binnedCodeDict) {
    // Set up the dimensions of the chart
    const margin = { top: 20, right: 20, bottom: 30, left: 80 }; // Increased left margin for longer labels
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create the SVG container for the chart
    const svg = d3
      .select("#sport-pyramid")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a scale for the x axis
    var x = d3.scaleLinear()
        .range([0, width]);

    // Create a scale for the y axis
    var y = d3.scaleBand()
        .range([height, 0])
        .padding(0);

      
    // Helper funcitons
    function getCountOfNextBinnedGrade(currentBinnedCode, isFlashOnsight = false) {
      const nextBinnedCode = parseInt(currentBinnedCode) + 1;
      const nextBinnedCodeData = joinedData.find(d => d.binned_code == nextBinnedCode);
      
      if (isFlashOnsight) {
          return nextBinnedCodeData ? nextBinnedCodeData.flashOnsightCount : null;
      }
  
      return nextBinnedCodeData ? nextBinnedCodeData.count : null;
    }
  
    function getTrianglePath(side, count, binned_grade, binned_code, isFlashOnsight = false) {
      const xValue = x(count || 0);
      const yValue = y(binned_grade);
  
      const x1 = side === 'left' 
          ? (width - xValue) / 2 - 1 
          : (width + xValue) / 2 + 1;
      const y1 = yValue + y.bandwidth();
  
      const nextGradeCount = getCountOfNextBinnedGrade(binned_code, isFlashOnsight);
      
      let x2;
      if (nextGradeCount !== null) {
          x2 = side === 'left' 
              ? (width - x(nextGradeCount)) / 2 
              : (width + x(nextGradeCount)) / 2;
      } else {
          x2 = side === 'left' 
              ? x1 + (y1 - yValue) 
              : x1 - (y1 - yValue);
      }
  
      // Explicitly handling the case where binned_code == maxCode
      if(binned_code == maxCode) {
        x2 = side === 'left'
            ? x1 + xValue
            : x1 - xValue;
      }

  
      if (Math.abs(x2 - x1) > (y1 - yValue)) {
          x2 = side === 'left' 
              ? x1 + (y1 - yValue) 
              : x1 - (y1 - yValue);
      }
  
      const y2 = yValue - 1;
      const x3 = x1;
      const y3 = y2;
  
      return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
    }
  
    function getLeftTrianglePath(count, binned_grade, binned_code) {
      return getTrianglePath('left', count, binned_grade, binned_code);
    }
  
    function getRightTrianglePath(count, binned_grade, binned_code) {
        return getTrianglePath('right', count, binned_grade, binned_code);
    }
    
    function getLeftFlashTrianglePath(flashOnsightCount, binned_grade, binned_code) {
        if (flashOnsightCount === 0 || isNaN(flashOnsightCount)) {
            return null;
        }
        if (binned_code == maxCode){
            return null;
        }
    
        return getTrianglePath('left', flashOnsightCount, binned_grade, binned_code, true);
    }
    
    function getRightFlashTrianglePath(flashOnsightCount, binned_grade, binned_code) {
        if (flashOnsightCount === 0 || isNaN(flashOnsightCount)) {
            return null;
        }
        if (binned_code == maxCode){
          return null;
        }
        return getTrianglePath('right', flashOnsightCount, binned_grade, binned_code, true);
    }
      
    
    // Convert the binnedCodeDict to an object for easier lookup
    var binnedCodeObj = {};
    binnedCodeDict.forEach(function(d) {
      binnedCodeObj[d.binned_code] = d.binned_grade;
    });

    // Count the frequency of each binned_code in the sportPyramidData
    var counts = {};
    sportPyramidData.forEach(function(d) {
      counts[d.binned_code] = (counts[d.binned_code] || 0) + 1;
    });

    // Convert the counts to an array of objects
    var data = [];
    for (var key in counts) {
      data.push({binned_code: key, count: counts[key]});
    }

    // Sort the data by binned_code in ascending order
    data.sort(function(a, b) {
      return a.binned_code - b.binned_code;
    });

    // Find the min and max binned_code in the data
    var minCode = data[0].binned_code;
    var maxCode = data[data.length - 1].binned_code;

    // Create an array of all possible binned_codes between min and max
    var allCodes = [];
    for (var i = minCode; i <= maxCode; i++) {
      allCodes.push(i);
    }

    // Create an array of objects with binned_code and binned_grade for each possible code
    var allData = [];
    allCodes.forEach(function(code) {
      allData.push({binned_code: code, binned_grade: binnedCodeObj[code]});
    });

    // Join the data with the allData based on binned_code
    var joinedData = [];
    allData.forEach(function(d) {
      var found = false;
      data.forEach(function(e) {
        if (d.binned_code == e.binned_code) {
          joinedData.push({binned_code: d.binned_code, binned_grade: d.binned_grade, count: e.count});
          found = true;
        }
      });
      if (!found) {
        joinedData.push({binned_code: d.binned_code, binned_grade: d.binned_grade, count: null});
      }
    });


    //Count onsight and flash
    var flashOnsightCounts = {};
    sportPyramidData.forEach(function(d) {
        if (d.lead_style === 'Flash' || d.lead_style === 'Onsight') {
            flashOnsightCounts[d.binned_code] = (flashOnsightCounts[d.binned_code] || 0) + 1;
        }
    });


    // add new data to joined data
    joinedData.forEach(function(d) {
      d.flashOnsightCount = flashOnsightCounts[d.binned_code] || 0;
    });
  

    // Find the maximum count in the joined data
    var maxCount = d3.max(joinedData, function(d) { return d.count; });

    // Set the domain of the x scale to [0, maxCount]
    x.domain([0, maxCount]);

    // Set the domain of the y scale to the binned_grades in the joined data
    y.domain(joinedData.map(function(d) { return d.binned_grade; }));

    // Append a group element for each bar in the joined data
    var bars = svg.selectAll(".bar")
        .data(joinedData)
        .enter().append("g")
        .attr("class", "bar");

    // Append a rect element for each bar and set its attributes
    bars.append("rect")
        .attr("x", function(d) { return (width - x(d.count || 0)) / 2; }) // Use zero if the count is null
        .attr("y", function(d) { return y(d.binned_grade); })
        .attr("width", function(d) { return x(d.count || 0); }) // Use zero if the count is null
        .attr("height", y.bandwidth())
        .attr("fill", "steelblue"); // Set the fill color of the bars


    // add onsight and flash bars
    bars.append("rect")
        .attr("x", function(d) { return (width - x(d.flashOnsightCount)) / 2; })
        .attr("y", function(d) { return y(d.binned_grade); })
        .attr("width", function(d) { return x(d.flashOnsightCount); })
        .attr("height", y.bandwidth()) 
        .attr("fill", "orange");  // Choose a different color for these bars


    // Create triangles that form the pyramid structure
    // Append a path element for the left triangle of each bar and set its attributes
    bars.append("path")
        .attr("d", function(d) { return getLeftTrianglePath(d.count, d.binned_grade, d.binned_code); })
        .attr("fill", "white");

    bars.append("path")
        .attr("d", function(d) { return getRightTrianglePath(d.count, d.binned_grade, d.binned_code); })
        .attr("fill", "white");


    // same but for flash/onsight 
    // Append a path element for the left triangle of each flash/onsight bar and set its attributes
    bars.append("path")
        .attr("d", function(d) { return getLeftFlashTrianglePath(d.flashOnsightCount, d.binned_grade, d.binned_code, d.count); })
        .attr("fill", "steelblue");  // use the same fill color as the bars of binned_code count

    // Append a path element for the right triangle of each flash/onsight bar and set its attributes
    bars.append("path")
        .attr("d", function(d) { return getRightFlashTrianglePath(d.flashOnsightCount, d.binned_grade, d.binned_code, d.count); })
        .attr("fill", "steelblue");  // use the same fill color as the bars of binned_code count

    //Append dashed horizontal lines seperating horizontal bars
    svg.selectAll(".dashed-line")
        .data(joinedData)
        .enter().append("line")
        .attr("class", "dashed-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", function(d) { return y(d.binned_grade) + y.bandwidth(); })
        .attr("y2", function(d) { return y(d.binned_grade) + y.bandwidth(); })
        .attr("stroke", "Grey")  // Color of the dashed line
        .attr("stroke-dasharray", "3,3");  // Dashed pattern (5 pixels dash, 5 pixels gap)

        
    bars.append("text")
        .attr("x", width) 
        .attr("y", function(d) { return y(d.binned_grade) + y.bandwidth() * 0.4; })  // Adjust for centering
        .attr("font-size", "10px")
        .attr("text-anchor", "end")
        .text(function(d) { 
            if(d.flashOnsightCount > 0) {  // Display only if count is greater than zero
                return `First Go: ${d.flashOnsightCount}`; 
            } else {
                return "";
            }
        });
    // Append text labels denoting binned_code total count
    bars.append("text")
        .attr("x", width)  // right edge of the chart
        .attr("y", function(d) { return y(d.binned_grade) + y.bandwidth() * 0.2; }) // adjusted position within the bar
        .attr("text-anchor", "end") // right-align the text
        .attr("font-size", "10px")
        .text(function(d) { return `Clean ascents: ${d.count || 0}`; });

    // Append a group element for the y axis and call the axis function
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));
  }

  function sportAttempts(sportPyramidData, binnedCodeArray) {
    // Set up the dimensions of the chart
    const margin = { top: 20, right: 20, bottom: 30, left: 80 }; // Increased left margin for longer labels
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create the SVG container for the chart
    const svg = d3
      .select("#sport-attempts")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create a scale for the x axis
    var x = d3.scaleLinear()
        .range([0, width]);

    // Create a scale for the y axis
    var y = d3.scaleBand()
        .range([height, 0])
        .padding(0);



    // Helper funcitons
    function getCountOfNextLowerBinnedGrade(currentBinnedCode, averages) {
      const nextLowerBinnedCode = parseInt(currentBinnedCode) - 1;
      const nextLowerBinnedCodeData = averages.find(d => d.key == nextLowerBinnedCode);
      return nextLowerBinnedCodeData ? nextLowerBinnedCodeData.value : null;
    }
    
    function getLeftTrianglePath(count, binned_grade, binned_code, averages) {
      // Get the x and y values of the bar
      var xValue = x(count || 0);
      var yValue = y(binned_grade);
  
      // Base of the triangle (bottom left)
      var x1 = (width - xValue) / 2 - 1;
      var y1 = yValue;
  
      // Get the count of the next lower binned grade
      const nextLowerGradeCount = getCountOfNextLowerBinnedGrade(binned_code, averages);
      var x2;
      if (nextLowerGradeCount !== null) {
          x2 = (width - x(nextLowerGradeCount)) / 2;
      } else {
          x2 = x1 + y.bandwidth();
      }
  
      // Check if the triangle angle exceeds 45 degrees
      if (Math.abs(x2 - x1) > y.bandwidth()) {
          x2 = x1 + (x2 > x1 ? y.bandwidth() : -y.bandwidth());
      }
  
      var y2 = yValue + y.bandwidth(); // Bottom of the triangle
      var x3 = x1;
      var y3 = y2;
  
      // Return the path attribute for the triangle
      return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
    }
  
    function getRightTrianglePath(count, binned_grade, binned_code, averages) {
      // Get the x and y values of the bar
      var xValue = x(count || 0);
      var yValue = y(binned_grade);
  
      // Base of the triangle (bottom right)
      var x1 = (width + xValue) / 2 + 1;
      var y1 = yValue;
  
      // Get the count of the next lower binned grade
      const nextLowerGradeCount = getCountOfNextLowerBinnedGrade(binned_code, averages);
      var x2;
      if (nextLowerGradeCount !== null) {
          x2 = (width + x(nextLowerGradeCount)) / 2;
      } else {
          x2 = x1 - y.bandwidth();
      }
  
      // Check if the triangle angle exceeds 45 degrees
      if (Math.abs(x2 - x1) > y.bandwidth()) {
          x2 = x1 + (x2 > x1 ? y.bandwidth() : -y.bandwidth());
      }
  
      var y2 = yValue + y.bandwidth(); // Bottom of the triangle
      var x3 = x1;
      var y3 = y2;
  
      // Return the path attribute for the triangle
      return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
    }
  
  
  
  
  
    // Convert the binnedCodeArray into a dictionary for easy lookup
    var binnedCodeDict = {};
    binnedCodeArray.forEach(function(item) {
        binnedCodeDict[item.binned_code] = item.binned_grade;
    });

    // Determine the min and max binned_code values in sportPyramidData
    var minCode = d3.min(sportPyramidData, d => d.binned_code);
    var maxCode = d3.max(sportPyramidData, d => d.binned_code);

    // Create a full list of integer binned_code values within this range
    var fullRange = [];
    for (let i = minCode; i <= maxCode; i++) {
        fullRange.push(i);
    }

    // Group and compute the mean attempts
    var groupedData = {};
    sportPyramidData.forEach(d => {
        if (!groupedData[d.binned_code]) {
            groupedData[d.binned_code] = { total: 0, count: 0 };
        }
        groupedData[d.binned_code].total += d.num_attempts;
        groupedData[d.binned_code].count += 1;
    });

    var averages = fullRange.map(code => {
        return {
            key: code,
            value: groupedData[code] ? groupedData[code].total / groupedData[code].count : 0
        };
    });

    x.domain([0, d3.max(averages, function(d) { return d.value; })]);
    y.domain(averages.map(function(d) { return binnedCodeDict[d.key] || d.key; })).padding(0);



    // Append a group element for each bar in the joined data
    var bars = svg.selectAll(".bar")
        .data(averages)
        .enter().append("g")
        .attr("class", "bar");

    // Append a rect element for each bar and set its attributes
    bars.append("rect")
        .attr("x", function(d) { return (width - x(d.value || 0)) / 2; }) // Use zero if the count is null
        .attr("y", function(d) { return y(binnedCodeDict[d.key] || d.key); })
        .attr("width", function(d) { return x(d.value || 0); }) // Use zero if the count is null
        .attr("height", y.bandwidth())
        .attr("fill", "steelblue"); // Set the fill color of the bars





    
    // Create triangles that form the pyramid structure
    bars.append("path")
        .attr("d", function(d) { return getLeftTrianglePath(d.value, binnedCodeDict[d.key], d.key, averages); })
        .attr("fill", "white");

    bars.append("path")
        .attr("d", function(d) { return getRightTrianglePath(d.value, binnedCodeDict[d.key], d.key, averages); })
        .attr("fill", "white");

    
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    

    // Append text labels denoting binned_code total count
    bars.append("text")
        .attr("x", width)  // right edge of the chart
        .attr("y", function(d) { return y(binnedCodeDict[d.key] || d.key) + y.bandwidth() * 0.8; }) // adjusted position within the bar
        .attr("text-anchor", "end") // right-align the text
        .attr("font-size", "10px")
        .text(function(d) { return `Avg Attempts per Send: ${d.value.toFixed(2) || 0}`; });

    svg.selectAll(".dashed-line")
        .data(averages)
        .enter().append("line")
        .attr("class", "dashed-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", function(d) { 
          const binnedGrade = binnedCodeDict[d.key]; // Lookup the binned_grade using the key
          return y(binnedGrade) + y.bandwidth(); 
        })
        .attr("y2", function(d) { 
          const binnedGrade = binnedCodeDict[d.key]; // Lookup the binned_grade using the key
          return y(binnedGrade) + y.bandwidth(); 
        })
        .attr("stroke", "Grey")  // Color of the dashed line
        .attr("stroke-dasharray", "3,3");  // Dashed pattern (5 pixels dash, 5 pixels gap)
      
  }

  function sportCharacteristics(sportPyramidData, binnedCodeDict) {
    // Set up the dimensions of the chart
    const margin = { top: 20, right: 20, bottom: 30, left: 80 }; // Increased left margin for longer labels
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create the SVG container for the chart
    const svg = d3
      .select("#sport-characteristics")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract unique binned_code values from sportPyramidData
    let uniqueBinnedCodes = [...new Set(sportPyramidData.map(item => item.binned_code))];

    // Filter binnedCodeDict based on the uniqueBinnedCodes
    let filteredBinnedCodeDict = binnedCodeDict.filter(entry => uniqueBinnedCodes.includes(entry.binned_code));
    
    const color = d3.scaleOrdinal().domain(filteredBinnedCodeDict).range(d3.schemeSet2);
    const x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).align(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]),
        z = color;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const keys = filteredBinnedCodeDict.map(d => d.binned_code);

    sportPyramidData.forEach(d => {
      if (!d.route_characteristic && d.route_characteristic !== 0) {
          d.route_characteristic = "Unknown";
      }
    });
  
    // Aggregate data using d3.group
    const groupedData = d3.group(sportPyramidData, d => d.route_characteristic);
    let dataset = Array.from(groupedData, ([key, values]) => {
        let counts = {};
        for (let v of values) {
            if (counts[v.binned_code]) {
                counts[v.binned_code]++;
            } else {
                counts[v.binned_code] = 1;
            }
        }
        return {
            characteristic: key,
            ...counts
        };
    });

    x.domain(dataset.map(d => d.characteristic));
    y.domain([0, d3.max(dataset, d => keys.reduce((acc, key) => acc + (d[key] || 0), 0))]).nice();
    z.domain([0, keys.length]);

    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(dataset))
        .enter().append("g")
        .attr("fill", d => z(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.characteristic))
        .attr("y", d => y(d[1]))
        .attr("height", d => isNaN(y(d[0]) - y(d[1])) ? 0 : y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Count");

    const legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => {
            const entry = filteredBinnedCodeDict.find(e => e.binned_code === d);
            return entry ? entry.binned_grade : '';
        });
  }

  function sportLength(sportPyramidData, binnedCodeDict){
    // Set up the dimensions of the chart
    const margin = { top: 20, right: 20, bottom: 30, left: 80 }; // Increased left margin for longer labels
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create the SVG container for the chart
    const svg = d3
      .select("#sport-length")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract unique binned_code values from sportPyramidData
    let uniqueBinnedCodes = [...new Set(sportPyramidData.map(item => item.binned_code))];

    // Filter binnedCodeDict based on the uniqueBinnedCodes
    let filteredBinnedCodeDict = binnedCodeDict.filter(entry => uniqueBinnedCodes.includes(entry.binned_code));
    
    const color = d3.scaleOrdinal().domain(filteredBinnedCodeDict).range(d3.schemeSet2);
    const x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).align(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]),
        z = color;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const keys = filteredBinnedCodeDict.map(d => d.binned_code);

    sportPyramidData.forEach(d => {
      if (!d.length_category && d.length_category !== 0) {
          d.length_category = "Unknown";
      }
    });

    // Aggregate data using d3.group
    const groupedData = d3.group(sportPyramidData, d => d.length_category);
    let dataset = Array.from(groupedData, ([key, values]) => {
        let counts = {};
        for (let v of values) {
            if (counts[v.binned_code]) {
                counts[v.binned_code]++;
            } else {
                counts[v.binned_code] = 1;
            }
        }
        return {
            length_category: key,
            ...counts
        };
    });

    const customOrder = ['short', 'medium', 'long', 'multipitch', 'Unknown'];

    // Set the domain of your x scale to follow the custom order
    x.domain(customOrder.filter(order => dataset.map(d => d.length_category).includes(order)));
    y.domain([0, d3.max(dataset, d => keys.reduce((acc, key) => acc + (d[key] || 0), 0))]).nice();
    z.domain([0, keys.length]);
    
    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(dataset))
        .enter().append("g")
        .attr("fill", d => z(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.length_category))
        .attr("y", d => y(d[1]))
        .attr("height", d => isNaN(y(d[0]) - y(d[1])) ? 0 : y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Count");

    const legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => {
            const entry = filteredBinnedCodeDict.find(e => e.binned_code === d);
            return entry ? entry.binned_grade : '';
        });
  }
  
  function sportSeasonality(sportPyramidData, binnedCodeDict){
    // Set up the dimensions of the chart
    const margin = { top: 20, right: 20, bottom: 30, left: 80 }; // Increased left margin for longer labels
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create the SVG container for the chart
    const svg = d3
      .select("#sport-seasonality")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract unique binned_code values from sportPyramidData
    let uniqueBinnedCodes = [...new Set(sportPyramidData.map(item => item.binned_code))];

    // Filter binnedCodeDict based on the uniqueBinnedCodes
    let filteredBinnedCodeDict = binnedCodeDict.filter(entry => uniqueBinnedCodes.includes(entry.binned_code));
    
    const color = d3.scaleOrdinal().domain(filteredBinnedCodeDict).range(d3.schemeSet2);
    const x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).align(0.1),
        y = d3.scaleLinear().rangeRound([height, 0]),
        z = color;

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const keys = filteredBinnedCodeDict.map(d => d.binned_code);

    sportPyramidData.forEach(d => {
      if (!d.season_category && d.season_category !== 0) {
          d.season_category = "Unknown";
      }
    });

    // Aggregate data using d3.group
    const groupedData = d3.group(sportPyramidData, d => d.season_category);
    let dataset = Array.from(groupedData, ([key, values]) => {
        let counts = {};
        for (let v of values) {
            if (counts[v.binned_code]) {
                counts[v.binned_code]++;
            } else {
                counts[v.binned_code] = 1;
            }
        }
        return {
            season_category: key,
            ...counts
        };
    });

    const customOrder = ['Spring', 'Summer', 'Fall', 'Winter', 'Unknown'];

    // Set the domain of your x scale to follow the custom order
    x.domain(customOrder.filter(order => dataset.map(d => d.season_category).includes(order)));
    y.domain([0, d3.max(dataset, d => keys.reduce((acc, key) => acc + (d[key] || 0), 0))]).nice();
    z.domain([0, keys.length]);
    
    g.append("g")
        .selectAll("g")
        .data(d3.stack().keys(keys)(dataset))
        .enter().append("g")
        .attr("fill", d => z(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => x(d.data.season_category))
        .attr("y", d => y(d[1]))
        .attr("height", d => isNaN(y(d[0]) - y(d[1])) ? 0 : y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth());

    g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .append("text")
        .attr("x", 2)
        .attr("y", y(y.ticks().pop()) + 0.5)
        .attr("dy", "0.32em")
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "start")
        .text("Count");

    const legend = g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "end")
        .selectAll("g")
        .data(keys.slice().reverse())
        .enter().append("g")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 19)
        .attr("width", 19)
        .attr("height", 19)
        .attr("fill", z);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9.5)
        .attr("dy", "0.32em")
        .text(d => {
            const entry = filteredBinnedCodeDict.find(e => e.binned_code === d);
            return entry ? entry.binned_grade : '';
        });
  }
}
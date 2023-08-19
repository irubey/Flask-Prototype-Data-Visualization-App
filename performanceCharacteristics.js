function characterViz(sportPyramidData,tradPyramidData,boulderPyramidData, userTicksData, binnedCodeDict){
    //Setup
    function getGradeForCode(binnedCode) {
        const entry = binnedCodeDict.find(item => item.binned_code === binnedCode);
        return entry ? entry.binned_grade : binnedCode;
    }
    
    function setupChart(targetId) {
        const margin = { top: 20, right: 20, bottom: 30, left: 80 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;
    
        const svg = d3.select(targetId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);
            // Removed the transform attribute here.
    
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        const color = d3.scaleOrdinal().range(d3.schemeSet2);
        const x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).align(0.1);
        const y = d3.scaleLinear().rangeRound([height, 0]);
        const z = color;
    
        return { svg, g, x, y, z, width, height, margin };
    }
    

    function drawBarsAndAxes({ svg, g, x, y, z, width, height, margin, dataset, keys, attribute }) {
        // Set y domain based on the max count across all groups and attributes
        y.domain([0, d3.max(dataset, d => keys.reduce((acc, key) => acc + (d[key] || 0), 0))]).nice();


        // Set z (color scale) domain based on the unique keys
        z.domain(keys);
    
        // Draw the bars
        g.append("g")
            .selectAll("g")
            .data(d3.stack().keys(keys)(dataset))
            .enter().append("g")
            .attr("fill", d => z(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter().append("rect")
            .attr("x", d => x(d.data[attribute]))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());
    
        // Draw x-axis
        g.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
    
        // Draw y-axis
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
    
        // Draw legend (optional)
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
            .text(d => getGradeForCode(d));
        
    }
     
    // Common function to create a bar chart
    function createBarChart(targetId, attribute, customOrder, sportPyramidData, binnedCodeDict) {
        const { svg, g, x, y, z, width, height, margin } = setupChart(targetId);

        let uniqueBinnedCodes = [...new Set(sportPyramidData.map(item => item.binned_code))];
        let filteredBinnedCodeDict = binnedCodeDict.filter(entry => uniqueBinnedCodes.includes(entry.binned_code));

        const keys = filteredBinnedCodeDict.map(d => d.binned_code);

        sportPyramidData.forEach(d => {
            if (!d[attribute] && d[attribute] !== 0) {
                d[attribute] = "Unknown";
            }
        });

        // Aggregate data using d3.group
        const groupedData = d3.group(sportPyramidData, d => d[attribute]);
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
                [attribute]: key,
                ...counts
            };
        });

        // If customOrder is provided, use it. Otherwise, default to dataset's attributes
        x.domain(customOrder ? customOrder.filter(order => dataset.map(d => d[attribute]).includes(order)) : dataset.map(d => d[attribute]));

        drawBarsAndAxes({ svg, g, x, y, z, width, height, margin, dataset, keys, attribute });
    }

    // Now our actual functions become much simpler:

    function sportCharacteristics(sportPyramidData, binnedCodeDict) {
        createBarChart("#sport-characteristics", "route_characteristic", null, sportPyramidData, binnedCodeDict);
    }

    function sportLength(sportPyramidData, binnedCodeDict){
        const customOrder = ['short', 'medium', 'long', 'multipitch', 'Unknown'];
        createBarChart("#sport-length", "length_category", customOrder, sportPyramidData, binnedCodeDict);
    }

    function sportStyle(sportPyramidData, binnedCodeDict){
        createBarChart("#sport-style", "route_style", null, sportPyramidData, binnedCodeDict)
    }
        
    function tradCharacteristics(tradPyramidData, binnedCodeDict) {
        createBarChart("#trad-characteristics", "route_characteristic", null, tradPyramidData, binnedCodeDict);
    }

    function tradLength(tradPyramidData, binnedCodeDict){
        const customOrder = ['short', 'medium', 'long', 'multipitch', 'Unknown'];
        createBarChart("#trad-length", "length_category", customOrder, tradPyramidData, binnedCodeDict);
    }

    function tradStyle(tradPyramidData, binnedCodeDict){
        createBarChart("#trad-style", "route_style", null, tradPyramidData, binnedCodeDict)
    }

    function boulderCharacteristics(boulderPyramidData, binnedCodeDict) {
        createBarChart("#boulder-characteristics", "route_characteristic", null, boulderPyramidData, binnedCodeDict);
    }

    function boulderLength(boulderPyramidData, binnedCodeDict){
        const customOrder = ['short', 'medium', 'long', 'multipitch', 'Unknown'];
        createBarChart("#boulder-length", "length_category", customOrder, boulderPyramidData, binnedCodeDict);
    }

    function boulderStyle(boulderPyramidData, binnedCodeDict){
        createBarChart("#boulder-style", "route_style", null, boulderPyramidData, binnedCodeDict)
    }


    // function sportCharacteristics(sportPyramidData, binnedCodeDict) {
    //     // Set up the dimensions of the chart
    //     const margin = { top: 20, right: 20, bottom: 30, left: 80 }; // Increased left margin for longer labels
    //     const width = 500 - margin.left - margin.right;
    //     const height = 300 - margin.top - margin.bottom;

    //     // Create the SVG container for the chart
    //     const svg = d3
    //     .select("#sport-characteristics")
    //     .append("svg")
    //     .attr("width", width + margin.left + margin.right)
    //     .attr("height", height + margin.top + margin.bottom)
    //     .attr("transform", `translate(${margin.left},${margin.top})`);

    //     // Extract unique binned_code values from sportPyramidData
    //     let uniqueBinnedCodes = [...new Set(sportPyramidData.map(item => item.binned_code))];

    //     // Filter binnedCodeDict based on the uniqueBinnedCodes
    //     let filteredBinnedCodeDict = binnedCodeDict.filter(entry => uniqueBinnedCodes.includes(entry.binned_code));
        
    //     const color = d3.scaleOrdinal().domain(filteredBinnedCodeDict).range(d3.schemeSet2);
    //     const x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).align(0.1),
    //         y = d3.scaleLinear().rangeRound([height, 0]),
    //         z = color;

    //     const g = svg.append("g")
    //         .attr("transform", `translate(${margin.left},${margin.top})`);

    //     const keys = filteredBinnedCodeDict.map(d => d.binned_code);

    //     sportPyramidData.forEach(d => {
    //     if (!d.route_characteristic && d.route_characteristic !== 0) {
    //         d.route_characteristic = "Unknown";
    //     }
    //     });
    
    //     // Aggregate data using d3.group
    //     const groupedData = d3.group(sportPyramidData, d => d.route_characteristic);
    //     let dataset = Array.from(groupedData, ([key, values]) => {
    //         let counts = {};
    //         for (let v of values) {
    //             if (counts[v.binned_code]) {
    //                 counts[v.binned_code]++;
    //             } else {
    //                 counts[v.binned_code] = 1;
    //             }
    //         }
    //         return {
    //             characteristic: key,
    //             ...counts
    //         };
    //     });

    //     x.domain(dataset.map(d => d.characteristic));
    //     y.domain([0, d3.max(dataset, d => keys.reduce((acc, key) => acc + (d[key] || 0), 0))]).nice();
    //     z.domain([0, keys.length]);

    //     g.append("g")
    //         .selectAll("g")
    //         .data(d3.stack().keys(keys)(dataset))
    //         .enter().append("g")
    //         .attr("fill", d => z(d.key))
    //         .selectAll("rect")
    //         .data(d => d)
    //         .enter().append("rect")
    //         .attr("x", d => x(d.data.characteristic))
    //         .attr("y", d => y(d[1]))
    //         .attr("height", d => isNaN(y(d[0]) - y(d[1])) ? 0 : y(d[0]) - y(d[1]))
    //         .attr("width", x.bandwidth());

    //     g.append("g")
    //         .attr("class", "axis")
    //         .attr("transform", `translate(0,${height})`)
    //         .call(d3.axisBottom(x));

    //     g.append("g")
    //         .attr("class", "axis")
    //         .call(d3.axisLeft(y).ticks(null, "s"))
    //         .append("text")
    //         .attr("x", 2)
    //         .attr("y", y(y.ticks().pop()) + 0.5)
    //         .attr("dy", "0.32em")
    //         .attr("fill", "#000")
    //         .attr("font-weight", "bold")
    //         .attr("text-anchor", "start")
    //         .text("Count");

    //     const legend = g.append("g")
    //         .attr("font-family", "sans-serif")
    //         .attr("font-size", 10)
    //         .attr("text-anchor", "end")
    //         .selectAll("g")
    //         .data(keys.slice().reverse())
    //         .enter().append("g")
    //         .attr("transform", (d, i) => `translate(0,${i * 20})`);

    //     legend.append("rect")
    //         .attr("x", width - 19)
    //         .attr("width", 19)
    //         .attr("height", 19)
    //         .attr("fill", z);

    //     legend.append("text")
    //         .attr("x", width - 24)
    //         .attr("y", 9.5)
    //         .attr("dy", "0.32em")
    //         .text(d => {
    //             const entry = filteredBinnedCodeDict.find(e => e.binned_code === d);
    //             return entry ? entry.binned_grade : '';
    //         });
    // }

    // function sportLength(sportPyramidData, binnedCodeDict){
    //     // Set up the dimensions of the chart
    //     const margin = { top: 20, right: 20, bottom: 30, left: 80 }; // Increased left margin for longer labels
    //     const width = 500 - margin.left - margin.right;
    //     const height = 300 - margin.top - margin.bottom;

    //     // Create the SVG container for the chart
    //     const svg = d3
    //     .select("#sport-length")
    //     .append("svg")
    //     .attr("width", width + margin.left + margin.right)
    //     .attr("height", height + margin.top + margin.bottom)
    //     .attr("transform", `translate(${margin.left},${margin.top})`);

    //     // Extract unique binned_code values from sportPyramidData
    //     let uniqueBinnedCodes = [...new Set(sportPyramidData.map(item => item.binned_code))];

    //     // Filter binnedCodeDict based on the uniqueBinnedCodes
    //     let filteredBinnedCodeDict = binnedCodeDict.filter(entry => uniqueBinnedCodes.includes(entry.binned_code));
        
    //     const color = d3.scaleOrdinal().domain(filteredBinnedCodeDict).range(d3.schemeSet2);
    //     const x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).align(0.1),
    //         y = d3.scaleLinear().rangeRound([height, 0]),
    //         z = color;

    //     const g = svg.append("g")
    //         .attr("transform", `translate(${margin.left},${margin.top})`);

    //     const keys = filteredBinnedCodeDict.map(d => d.binned_code);

    //     sportPyramidData.forEach(d => {
    //     if (!d.length_category && d.length_category !== 0) {
    //         d.length_category = "Unknown";
    //     }
    //     });

    //     // Aggregate data using d3.group
    //     const groupedData = d3.group(sportPyramidData, d => d.length_category);
    //     let dataset = Array.from(groupedData, ([key, values]) => {
    //         let counts = {};
    //         for (let v of values) {
    //             if (counts[v.binned_code]) {
    //                 counts[v.binned_code]++;
    //             } else {
    //                 counts[v.binned_code] = 1;
    //             }
    //         }
    //         return {
    //             length_category: key,
    //             ...counts
    //         };
    //     });

    //     const customOrder = ['short', 'medium', 'long', 'multipitch', 'Unknown'];

    //     // Set the domain of your x scale to follow the custom order
    //     x.domain(customOrder.filter(order => dataset.map(d => d.length_category).includes(order)));
    //     y.domain([0, d3.max(dataset, d => keys.reduce((acc, key) => acc + (d[key] || 0), 0))]).nice();
    //     z.domain([0, keys.length]);
        
    //     g.append("g")
    //         .selectAll("g")
    //         .data(d3.stack().keys(keys)(dataset))
    //         .enter().append("g")
    //         .attr("fill", d => z(d.key))
    //         .selectAll("rect")
    //         .data(d => d)
    //         .enter().append("rect")
    //         .attr("x", d => x(d.data.length_category))
    //         .attr("y", d => y(d[1]))
    //         .attr("height", d => isNaN(y(d[0]) - y(d[1])) ? 0 : y(d[0]) - y(d[1]))
    //         .attr("width", x.bandwidth());

    //     g.append("g")
    //         .attr("class", "axis")
    //         .attr("transform", `translate(0,${height})`)
    //         .call(d3.axisBottom(x));

    //     g.append("g")
    //         .attr("class", "axis")
    //         .call(d3.axisLeft(y).ticks(null, "s"))
    //         .append("text")
    //         .attr("x", 2)
    //         .attr("y", y(y.ticks().pop()) + 0.5)
    //         .attr("dy", "0.32em")
    //         .attr("fill", "#000")
    //         .attr("font-weight", "bold")
    //         .attr("text-anchor", "start")
    //         .text("Count");

    //     const legend = g.append("g")
    //         .attr("font-family", "sans-serif")
    //         .attr("font-size", 10)
    //         .attr("text-anchor", "end")
    //         .selectAll("g")
    //         .data(keys.slice().reverse())
    //         .enter().append("g")
    //         .attr("transform", (d, i) => `translate(0,${i * 20})`);

    //     legend.append("rect")
    //         .attr("x", width - 19)
    //         .attr("width", 19)
    //         .attr("height", 19)
    //         .attr("fill", z);

    //     legend.append("text")
    //         .attr("x", width - 24)
    //         .attr("y", 9.5)
    //         .attr("dy", "0.32em")
    //         .text(d => {
    //             const entry = filteredBinnedCodeDict.find(e => e.binned_code === d);
    //             return entry ? entry.binned_grade : '';
    //         });
    // }






    // Call all functions
    if (sportPyramidData.length > 0) {
        sportCharacteristics(sportPyramidData, binnedCodeDict);
        sportLength(sportPyramidData, binnedCodeDict);
        sportStyle(sportPyramidData,binnedCodeDict);
    }
    
    if (tradPyramidData.length > 0) {
        tradCharacteristics(tradPyramidData, binnedCodeDict);
        tradLength(tradPyramidData, binnedCodeDict);
        tradStyle(tradPyramidData, binnedCodeDict);
    }
    
    if (boulderPyramidData.length > 0) {
        boulderCharacteristics(boulderPyramidData, binnedCodeDict);
        boulderLength(boulderPyramidData, binnedCodeDict);
        boulderStyle(boulderPyramidData, binnedCodeDict);
    }
}
  
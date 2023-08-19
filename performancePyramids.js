function pyramidViz(sportPyramidData,tradPyramidData,boulderPyramidData, userTicksData, binnedCodeDict){

    // Helper Functions Global
    function createSVGChartContainer(selector, margin, width, height) {
        return d3.select(selector)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }
    
    function createLinearScale(range) {
        return d3.scaleLinear().range(range);
    }
    
    function createBandScale(range, padding) {
        return d3.scaleBand().range(range).padding(padding);
    }

    function convertDictToObj(dict) {
        var obj = {};
        dict.forEach(function(d) {
            obj[d.binned_code] = d.binned_grade;
        });
        return obj;
    }
    
    
    //Helper Functions -- Grade Pyramids
    function getTrianglePath(side, count, binned_grade, binned_code, isFlashOnsight, width, x, y, joinedDataArray, maxBinnedCode) {
        if (count === 0 || count === null) {
            return null;
        }
    
        if (binned_code === maxBinnedCode && isFlashOnsight) {
            return null;
        }
    
        const xValue = x(count);
        const yValue = y(binned_grade);
        
        const x1 = side === 'left' 
            ? (width - xValue) / 2 - 1 
            : (width + xValue) / 2 + 1;
                
        const y1 = yValue + y.bandwidth();
        
        const nextBinnedCode = parseInt(binned_code) + 1;
        const nextBinnedCodeData = joinedDataArray.find(d => d.binned_code == nextBinnedCode);
        
        let nextGradeCount;
        if (isFlashOnsight) {
            nextGradeCount = nextBinnedCodeData ? nextBinnedCodeData.flashOnsightCount : null;
        } else {
            nextGradeCount = nextBinnedCodeData ? nextBinnedCodeData.count : null;
        }
    
        if (nextGradeCount > count) {
            return null;
        }
        
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
    
        if (binned_code == maxBinnedCode) {
            x2 = width / 2;
        } else {
            // 45-degree angle check for non-maxBinnedCode triangles
            if (Math.abs(x2 - x1) > (y1 - yValue)) {
                x2 = side === 'left' 
                    ? x1 + (y1 - yValue) 
                    : x1 - (y1 - yValue);
            }
        }
        
        const y2 = isFlashOnsight ? yValue : yValue - 1;
        const x3 = x1;
        const y3 = y2;
        
        return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z`;
    }    
    
    function computeDataFrequencies(data) {
        var counts = {};
        data.forEach(function(d) {
            counts[d.binned_code] = (counts[d.binned_code] || 0) + 1;
        });
        return counts;
    }
    
    function createPyramidVisualization(inputData, binnedCodeDict, containerSelector) {

        const margin = { top: 20, right: 20, bottom: 30, left: 80 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;
    
        const svg = createSVGChartContainer(containerSelector, margin, width, height);
        const x = createLinearScale([0, width]);
        const y = createBandScale([height, 0],0);
        
        // Convert the binnedCodeDict to an object for easier lookup
        var binnedCodeObj = convertDictToObj(binnedCodeDict);
    
        // Count the frequency of each binned_code in the inputData
        var counts = computeDataFrequencies(inputData);
    
        // Convert the counts to an array of objects
        var data = [];
        for (var key in counts) {
        data.push({binned_code: parseInt(key), count: counts[key]});
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
        inputData.forEach(function(d) {
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
        // For flash/onsight counts:
        bars.append("path")
            .attr("d", function(d) { 
                return getTrianglePath('left', d.flashOnsightCount, d.binned_grade, d.binned_code, true, width, x, y, joinedData, maxCode);
            })
            .attr("fill", "steelblue");

        bars.append("path")
            .attr("d", function(d) { 
                return getTrianglePath('right', d.flashOnsightCount, d.binned_grade, d.binned_code, true, width, x, y, joinedData, maxCode);
            })
            .attr("fill", "steelblue");

        // For the main count:
        bars.append("path")
            .attr("d", function(d) { 
                return getTrianglePath('left', d.count, d.binned_grade, d.binned_code, false, width, x, y, joinedData, maxCode);
            })
            .attr("fill", "white");

        bars.append("path")
            .attr("d", function(d) { 
                return getTrianglePath('right', d.count, d.binned_grade, d.binned_code, false, width, x, y, joinedData, maxCode);
            })
            .attr("fill", "white");


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
    
    function sportPyramid(sportPyramidData, binnedCodeDict) {
        createPyramidVisualization(sportPyramidData, binnedCodeDict, "#sport-pyramid");
    }

    function tradPyramid(tradPyramidData, binnedCodeDict){
        createPyramidVisualization(tradPyramidData, binnedCodeDict, "#trad-pyramid");
    }

    function boulderPyramid(boulderPyramidData,binnedCodeDict){
        createPyramidVisualization(boulderPyramidData, binnedCodeDict, "#boulder-pyramid");
    }

    // Helper Functions -- Attempts Funnel
    function convertArrayToDict(array) {
        const dict = {};
        array.forEach(entry => {
            dict[entry.binned_code] = entry.binned_grade;
        });
        return dict;
    }

    function attemptsTrianglePath(side, average, binned_grade, binned_code, width, x, y, dataArray, minBinnedCode) {
        if (average === 0 || average === null) {
            return null;
        }
    
        const xValue = x(average);
        let yValue = y(binned_grade) + 1;  // Downward shift
        const yBase = yValue + y.bandwidth();
    
        const intBinnedCode = parseInt(binned_code, 10);
        const previousBinnedCode = intBinnedCode - 1;
        const intMinBinnedCode = parseInt(minBinnedCode, 10);
        const previousBinnedCodeData = dataArray.find(d => d.binned_code == previousBinnedCode);
        const previousGradeAverage = previousBinnedCodeData ? previousBinnedCodeData.average : 0;
        const xPrevValue = x(previousGradeAverage);
    
        // Condition: If the average of the next lowest binned_code is higher than the current average, return null
        if (previousGradeAverage > average) {
            return null;
        }
    
        let xStart, xEnd, xTurn, path;
    
        if (side === 'left') {
            xStart = (width - xValue) / 2 - 1;  // Outward shift
            xEnd = (width - xPrevValue) / 2 - 1;  // Outward shift
            xTurn = Math.min(xStart + y.bandwidth(), xEnd);
        } else {
            xStart = (width + xValue) / 2 + 1;  // Outward shift
            xEnd = (width + xPrevValue) / 2 + 1;  // Outward shift
            xTurn = Math.max(xStart - y.bandwidth(), xEnd);
        }
    
        if (intBinnedCode === intMinBinnedCode) {
            if (side === 'left') {
                const midPoint = xStart + (xValue / 2) - 1;  // Outward shift
                path = `
                    M ${xStart} ${yValue}
                    L ${xStart} ${yBase}
                    L ${midPoint} ${yBase}
                    Z
                `;
            } else { // Handle the 'right' side
                const midPoint = xStart - (xValue / 2) + 1;  // Outward shift
                path = `
                    M ${xStart} ${yValue}
                    L ${xStart} ${yBase}
                    L ${midPoint} ${yBase}
                    Z
                `;
            }
        } else {
            path = `
                M ${xStart} ${yValue}
                L ${xStart} ${yBase}
                L ${xTurn} ${yBase}
                Z
            `;
        }
    
        return path.trim();
    } 

    function computeDataAverages(data) {
        var groupedData = {};
        data.forEach(d => {
            if (!groupedData[d.binned_code]) {
                groupedData[d.binned_code] = { total: 0, count: 0 };
            }
            groupedData[d.binned_code].total += d.num_attempts;
            groupedData[d.binned_code].count += 1;
        });
    
        var minCode = Math.min(...data.map(d => d.binned_code));
        var maxCode = Math.max(...data.map(d => d.binned_code));
        var fullRange = Array.from({length: maxCode - minCode + 1}, (_, i) => i + minCode);
        
        var averages = fullRange.map(code => {
            return {
                key: code,
                value: groupedData[code] ? groupedData[code].total / groupedData[code].count : 0
            };
        });
        return averages;
    }

    function createAttemptsVisualization(inputData, binnedCodeDict, containerSelector) {
        const margin = { top: 20, right: 20, bottom: 30, left: 80 };
        const width = 500 - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;
    
        const svg = createSVGChartContainer(containerSelector, margin, width, height);
        const x = createLinearScale([0, width]);
        const y = createBandScale([height, 0],0);

        // Convert the binnedCodeDict to an object for easier lookup
        const binnedCodeLookup = convertArrayToDict(binnedCodeDict);
        var binnedCodeObj = convertDictToObj(binnedCodeDict);
        

        var averages = computeDataAverages(inputData);
        
        
        

    
        // Create an array of all possible binned_codes between min and max
        var allCodes = [];
        for (var i = minCode; i <= maxCode; i++) {
        allCodes.push(i);
        }

        // Create an array of objects with binned_code and binned_grade for each possible code
        var allData = averages.map(function(avg) {
            return {
                binned_code: avg.key, 
                binned_grade: binnedCodeObj[avg.key], 
                average: avg.value
            };
        });
        
        allData.sort((a, b) => a.binned_code - b.binned_code);

        var minCode, maxCode;
        if (allData.length > 0) {
            minCode = allData[0].binned_code;
            maxCode = allData[allData.length - 1].binned_code;
        }

        //Set up the Domains
        x.domain([0, d3.max(allData, function(d) { return d.average; })]);
        y.domain(allData.map(function(d) { 
            return binnedCodeLookup[d.binned_code] || d.binned_code; 
        })).padding(0);
        
        
    
        // Append a group element for each bar in the joined data
        var bars = svg.selectAll(".bar")
            .data(allData)
            .enter().append("g")
            .attr("class", "bar");
    
        // Append a rect element for each bar and set its attributes
        bars.append("rect")
            .attr("x", function(d) { return (width - x(d.average || 0)) / 2; })
            .attr("y", function(d) { return y(binnedCodeLookup[d.binned_code] || d.binned_code); })
            .attr("width", function(d) { return x(d.average || 0); })
            .attr("height", y.bandwidth())
            .attr("fill", "steelblue"); 
        
        
    
        // Create triangles that form the pyramid structure
        bars.append("path")
            .attr("d", function(d) { return attemptsTrianglePath('left', d.average, d.binned_grade, d.binned_code, width, x, y, allData, minCode); })
            .attr("fill", "white");
    
        bars.append("path")
            .attr("d", function(d) { return attemptsTrianglePath('right', d.average, d.binned_grade, d.binned_code, width, x, y, allData, minCode); })
            .attr("fill", "white");
    
        
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(y));
    
        
    
        // Append text labels denoting binned_code total count
        bars.append("text")
            .attr("x", width)
            .attr("y", function(d) { return y(binnedCodeLookup[d.binned_code] || d.binned_code) + y.bandwidth() * 0.8; })
            .attr("text-anchor", "end")
            .attr("font-size", "10px")
            .text(function(d) { return `Avg Attempts per Send: ${d.average.toFixed(2) || 0}`; });

        svg.selectAll(".dashed-line")
            .data(allData)
            .enter().append("line")
            .attr("class", "dashed-line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", function(d) { 
                const binnedGrade = binnedCodeLookup[d.binned_code];
                return y(binnedGrade) + y.bandwidth(); 
            })
            .attr("y2", function(d) { 
                const binnedGrade = binnedCodeLookup[d.binned_code];
                return y(binnedGrade) + y.bandwidth(); 
            })
            .attr("stroke", "Grey")  // Color of the dashed line
            .attr("stroke-dasharray", "3,3");  // Dashed pattern (5 pixels dash, 5 pixels gap)
    }

    function sportAttempts(sportPyramidData, binnedCodeDict){
        createAttemptsVisualization(sportPyramidData, binnedCodeDict, "#sport-attempts")
    }

    function tradAttempts(tradPyramidData, binnedCodeDict){
        createAttemptsVisualization(tradPyramidData, binnedCodeDict, "#trad-attempts")
    }

    // function boulderAttempts(boulderPyramidData, binnedCodeDict){
    //     createAttemptsVisualization(boulderPyramidData, binnedCodeDict, "#boulder-attempts")
    // }

    // Call all functions
    if (sportPyramidData.length > 0) {
        sportPyramid(sportPyramidData, binnedCodeDict);
        sportAttempts(sportPyramidData, binnedCodeDict);
    }
    
    if (tradPyramidData.length > 0) {
        tradPyramid(tradPyramidData, binnedCodeDict);
        tradAttempts(tradPyramidData, binnedCodeDict);
    }
    
    if (boulderPyramidData.length > 0) {
        boulderPyramid(boulderPyramidData, binnedCodeDict);
        //boulderAttempts(boulderPyramidData, binnedCodeDict);
    }
    
}

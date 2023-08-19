
function baseVolumeViz(sportPyramidData,tradPyramidData,boulderPyramidData, userTicksData, binnedCodeDict) {
  // Define a custom date parsing function
  const parseDate = d3.timeParse('%Y-%m-%d');
  console.log(userTicksData);

  // Helper Functions


  // Call the visualization functions
  averageVerticalPerSeason(userTicksData);
  avgRestDays(userTicksData);

  
  totalVertOverTime(userTicksData);
  rpMaxOverTime(userTicksData);


  

  function averageVerticalPerSeason(userTicksData) {
    // Check if userTicksData contains valid non-null date values
    const hasValidDates = userTicksData.every((entry) => entry.tick_date && entry.tick_date.trim() !== '');
  
    if (!hasValidDates) {
      console.error('userTicksData contains invalid data or null date values');
      return;
    }
  
    // Prepare the data for visualization
    const data = userTicksData
      .filter(
        (d) =>
          d.length_category !== 'multipitch' &&
          d.discipline === 'sport' && // Filter to only include 'sport' discipline
          !isNaN(d.pitches)
      )
      .map((d) => {
        return {
          date: parseDate(d.tick_date),
          seasonCategory: d.season_category,
          routeName: d.route_name,
          length: d.length === 0 ? null : d.length, // Set 0 to null
          pitches: d.pitches,
        };
      });

    // Calculate the average length (excluding NaN and 0 values) for each unique 'tick_date' value
    const averageLengthMap = new Map();
    data.forEach((d) => {
      if (d.length !== null && !isNaN(d.length)) {
        const dateString = d.date.toISOString().slice(0, 10);
        if (!averageLengthMap.has(dateString)) {
          averageLengthMap.set(dateString, { sum: d.length, count: 1 });
        } else {
          const entry = averageLengthMap.get(dateString);
          entry.sum += d.length;
          entry.count++;
        }
      }
    });

    averageLengthMap.forEach((value, key) => {
      averageLengthMap.set(key, value.sum / value.count);
    });

    // Replace the NaN and 0 values in the 'length' property with the average length for that 'tick_date'
    data.forEach((d) => {
      if (isNaN(d.length)) {
        const dateString = d.date.toISOString().slice(0, 10);
        d.length = averageLengthMap.get(dateString);
      }
      d.vertical = d.length * d.pitches; // Calculate the vertical after replacing NaN and 0 values
    });

    // Calculate the total vertical per unique 'tick_date'
    const groupedData = Array.from(
      d3.rollup(
        data,
        (group) => {
          const totalVertical = d3.sum(group, (d) => d.vertical || 0);
          return {
            date: group[0].date,
            seasonCategory: group[0].seasonCategory,
            totalVertical: totalVertical,
          };
        },
        (d) => d.date.toISOString().slice(0, 10) // Group by the unique 'tick_date'
      ),
      ([_, entry]) => entry
    );
  
    // Calculate the average vertical per season category
    const averageData = Array.from(
      d3.rollup(
        groupedData,
        (group) => {
          const averageVertical = d3.mean(group, (d) => d.totalVertical);
          return {
            seasonCategory: group[0].seasonCategory,
            averageVertical: averageVertical || 0,
          };
        },
        (d) => d.seasonCategory
      ),
      ([_, entry]) => entry
    );
  
    // Set up the dimensions and margins for the chart
    const margin = { top: 20, right: 20, bottom: 130, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    // Create an SVG container
    const svg = d3
      .select('#vert-season')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Set up the scales for x and y axes
    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleLinear().range([height, 0]);
  
    // Set the domains for x and y scales
    x.domain(averageData.map((d) => d.seasonCategory));
    y.domain([0, d3.max(averageData, (d) => d.averageVertical)]);
  
    // Append the bars
    svg
      .selectAll('.bar')
      .data(averageData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.seasonCategory))
      .attr('y', (d) => y(d.averageVertical))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.averageVertical))
      .style('fill', 'steelblue');
  
    // Append x-axis
    svg
      .append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-65)');
  
    // Append y-axis
    svg.append('g').call(d3.axisLeft(y));
  
    // Style the chart
    svg.selectAll('.bar').style('fill', 'steelblue');
  }
  

  
  function totalVertOverTime(userTicksData) {
    // Check if userTicksData contains valid non-null date values
    const hasValidDates = userTicksData.every((entry) => entry.tick_date && entry.tick_date.trim() !== '');
  
    if (!hasValidDates) {
      console.error('userTicksData contains invalid data or null date values');
      return;
    }
  
    // Prepare the data for visualization
    const data = userTicksData
      .map((d) => {
        return {
          date: parseDate(d.tick_date), // Parse the date using the custom parsing function
          vertical: d.length_category === 'multipitch' ? d.length : d.length * d.pitches,
        };
      })
      .filter((d) => d.date && !isNaN(d.date) && d.vertical && !isNaN(d.vertical));
  
    // Calculate the running total of vertical feet over time
    let runningTotal = 0;
    const cumulativeData = data.map((d) => {
      runningTotal += d.vertical;
      return {
        date: d.date,
        totalVertical: runningTotal,
      };
    });
  
    // Set up the dimensions and margins for the chart
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    // Create an SVG container for the line chart
    const svg = d3
      .select('#vert-time')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Set up the scales for the x and y axes
    const xScale = d3.scaleTime().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);
  
    // Set the domains for x and y scales
    xScale.domain(d3.extent(cumulativeData, (d) => d.date));
    yScale.domain([0, d3.max(cumulativeData, (d) => d.totalVertical)]);
  
    // Define the line function
    const line = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.totalVertical));
  
    // Append the line chart
    svg
      .append('path')
      .datum(cumulativeData)
      .attr('class', 'line')
      .attr('d', line)
      .style('fill', 'none')
      .style('stroke', 'steelblue')
      .style('stroke-width', '2px');
  
    // Append x-axis
    svg.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(xScale));
  
    // Append y-axis
    svg.append('g').call(d3.axisLeft(yScale));
  
    // Style the chart
    svg
      .selectAll('.line')
      .style('fill', 'none')
      .style('stroke', 'steelblue')
      .style('stroke-width', '2px');
  }
}
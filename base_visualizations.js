
function baseVisualizations(sportPyramidData, tradPyramidData, boulderPyramidData, userTicksData) {
  // Define a custom date parsing function
  const parseDate = d3.timeParse('%Y-%m-%d');
  
  // Call the visualization functions
  averageVerticalPerSeason(userTicksData);
  daysOutside(userTicksData);
  totalVertOverTime(userTicksData);
  locationBarChartRace(userTicksData);
  difficultyCategoriesOverTime(userTicksData);
  lengthCategoriesOverTime(userTicksData);

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
  
  function daysOutside(userTicksData) {
    // Prepare the data for visualization
    const uniqueDates = new Set();
    const data = userTicksData
      .map((d) => ({
        date: new Date(d.tick_date),
        seasonCategory: d.season_category,
        discipline: d.discipline,
      }))
      .filter((d) => {
        if (!isNaN(d.date) && d.seasonCategory && d.seasonCategory.trim() !== '' && d.discipline && d.discipline.trim() !== '') {
          const dateString = d.date.toISOString().slice(0, 10);
          if (!uniqueDates.has(dateString)) {
            uniqueDates.add(dateString);
            return true;
          }
        }
        return false;
      });
  
    // Group the data by season category and discipline
    const groupedData = data.reduce((groups, item) => {
      const key = item.seasonCategory;
      if (!groups[key]) {
        groups[key] = {};
      }
      groups[key][item.discipline] = (groups[key][item.discipline] || 0) + 1;
      return groups;
    }, {});
  
    // Convert the grouped data into an array of objects
    const histogramData = Object.entries(groupedData).map(([seasonCategory, disciplines]) => ({
      seasonCategory,
      ...disciplines,
    }));
  
    // Get unique disciplines to stack on the bar chart
    const disciplines = Object.keys(userTicksData.reduce((unique, item) => {
      if (item.discipline) unique[item.discipline] = true;
      return unique;
    }, {}));
  
    // Add missing disciplines with 0 count to each data point
    histogramData.forEach((d) => {
      disciplines.forEach((discipline) => {
        if (!d[discipline]) d[discipline] = 0;
      });
    });
  
    // Calculate the total number of each discipline across all data points
    const disciplineTotals = disciplines.map((discipline) =>
      histogramData.reduce((total, dataPoint) => total + (dataPoint[discipline] || 0), 0)
    );
  
    // Sort disciplines based on their totals in descending order
    const sortedDisciplines = disciplines.slice().sort((a, b) => disciplineTotals[disciplines.indexOf(b)] - disciplineTotals[disciplines.indexOf(a)]);
  
    // Create the stacked bar chart visualization
    const margin = { top: 20, right: 30, bottom: 150, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    const x = d3
      .scaleBand()
      .domain(histogramData.map((d) => d.seasonCategory))
      .range([0, width])
      .padding(0.2);
  
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(histogramData, (d) => d3.sum(sortedDisciplines.map((discipline) => d[discipline] || 0)))])
      .nice()
      .range([height, 0]);
  
    const stack = d3.stack().keys(sortedDisciplines).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
    const stackedData = stack(histogramData);
  
    const color = d3.scaleOrdinal().domain(sortedDisciplines).range(d3.schemeSet2);
  
    const svg = d3
      .select("#difficulty-time")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
    svg
      .selectAll(".seasonCategory")
      .data(stackedData)
      .enter()
      .append("g")
      .attr("class", "seasonCategory")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.data.seasonCategory))
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth());
  
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-65)");
  
    svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

  
    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 20)
      .style("text-anchor", "middle")
      .text("Days Outside")
      .attr("transform", "rotate(-90)");
  
    // Optional styling for better visualization
    svg.selectAll(".tick text").attr("font-size", "12px");
  
    // Optional legend
    const legend = svg
      .selectAll(".legend")
      .data(sortedDisciplines)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(0, ${i * 20 + 50})`);
  
    legend
      .append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color);
  
    legend
      .append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text((d) => d);
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
  
  function locationBarChartRace(userTicksData) {
    // Group the data by location
    const groupedData = Array.from(
      d3.group(userTicksData, (d) => d.location),
      ([location, entries]) => ({
        location,
        entries: entries.sort((a, b) => new Date(a.tick_date) - new Date(b.tick_date)),
        total: d3.sum(entries, (d) => d.pitches), // Calculate the total for each location
      })
    );
  
    // Sort the groupedData based on the total pitches in descending order
    groupedData.sort((a, b) => b.total - a.total);
  
    // Take only the top 10 locations
    const top10Data = groupedData.slice(0, 10);
  
    // Set up chart dimensions and margins
    const margin = { top: 20, right: 20, bottom: 30, left: 150 }; // Increased left margin for y-axis labels
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    // Create the SVG container
    const svg = d3
      .select('#location-time')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Set up scales
    const xScale = d3.scaleLinear().range([0, width]);
    const yScale = d3
      .scaleBand()
      .range([height, 0])
      .padding(0.1)
      .domain(top10Data.map((d) => d.location)); // Use ordinal values for top 10 locations
  
    // Append x-axis
    svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${height})`);
  
    // Append y-axis
    svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(yScale)); // Call y-axis directly with the scale
  
    let currentStep = 0;
  
    function updateChart(data) {
      // Update scales with new data
      xScale.domain([0, d3.max(data, (d) => d.total)]); // Use 'data' to get the max value dynamically
      yScale.domain(data.map((d) => d.location)); // Update yScale domain based on the data
    
      // Update x-axis
      svg.select('.x-axis').call(d3.axisBottom(xScale));
    
      // Update y-axis
      svg.select('.y-axis').call(d3.axisLeft(yScale));
    
      // Select all bars
      const bars = svg.selectAll('.bar').data(data, (d) => d.location);
    
      // Exit old bars
      bars.exit().remove();
    
      // Enter new bars
      bars
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .style('fill', 'steelblue')
        .attr('x', 0)
        .attr('y', (d) => yScale(d.location))
        .attr('height', yScale.bandwidth())
        .merge(bars)
        .transition()
        .duration(200)
        .attr('y', (d) => yScale(d.location))
        .attr('width', (d) => xScale(d.total));
    
      // Sort bars based on the updated data
      bars.order();
    }
    
  
    // Create animation
    const timeInterval = 100; 
  
    function animateBarChart() {
      const numSteps = top10Data[0].entries.length; // Number of steps based on the number of entries for the first location
    
      if (currentStep === numSteps) {
        return;
      }
    
      const currentStepDate = top10Data[0].entries[currentStep].tick_date;
    
      const currentData = top10Data.map((d) => {
        let currentIndex = -1;
        for (let i = 0; i < d.entries.length; i++) {
          if (d.entries[i].tick_date <= currentStepDate) {
            currentIndex = i;
          } else {
            break;
          }
        }
    
        const total = currentIndex !== -1 ? d3.sum(d.entries.slice(0, currentIndex + 1), (entry) => entry.pitches) : 0;
    
        return {
          location: d.location,
          entries: d.entries.slice(0, currentIndex + 1),
          total: total,
        };
      });
    
      // Sort currentData based on the total values in descending order
      currentData.sort((a, b) => b.total - a.total);
    
      // Update yScale domain based on the sorted data
      yScale.domain(currentData.map((d) => d.location));
    
      // Update the y-axis with the new scale
      svg.select('.y-axis').call(d3.axisLeft(yScale));
    
      // Update the chart with the current data
      updateChart(currentData);
    
      // Increment currentStep and schedule the next step of the animation after the specified time interval
      currentStep++;
      setTimeout(animateBarChart, timeInterval);
    }
     
    
    
    
  
    animateBarChart();
  }









  // helper functions for categories over time 

  
  function difficultyCategoriesOverTime(userTicksData) {

    function getColor(category) {
      switch (category) {
        case 'Base Volume':
          return 'blue';
        case 'Tier 2':
          return 'green';
        case 'Tier 3':
          return 'orange';
        case 'Project':
          return 'red';
        case 'Tier 4':
          return 'purple';
        default:
          return 'black';
      }
    }
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
        d.discipline !== 'boulder' &&
        d.discipline !== 'trad'
    )
    .map((d) => {
      return {
        date: parseDate(d.tick_date),
        category: d.difficulty_category,
        pitches: d.pitches || 0,
      };
    });

    // Group the data by date and difficulty category
    const groupedData = Array.from(
    d3.rollup(
      data,
      (group) => {
        const summedPitches = d3.sum(group, (d) => d.pitches);
        return {
          date: group[0].date,
          category: group[0].category,
          pitches: summedPitches,
        };
      },
      (d) => d3.timeFormat('%Y-%m-%d')(d.date) // Format the date as 'year-month-day' for grouping
    ),
    ([_, entry]) => entry
    );
    
    // Sort the data by date
    groupedData.sort((a, b) => a.date - b.date);
    
    // Calculate the running total for each category
    const runningTotals = {};
    groupedData.forEach((entry) => {
    const { category, pitches } = entry;
    if (!runningTotals[category]) {
      runningTotals[category] = 0;
    }
    runningTotals[category] += pitches;
    entry.runningTotal = runningTotals[category];
    });

    // Get unique difficulty categories
    const categories = [...new Set(groupedData.map((d) => d.category))];

  
    // Set up the dimensions and margins for the chart
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    // Create an SVG container
    const svg = d3
      .select('#types-difficulty')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Set up the scales for x and y axes
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
  
    // Set the domains for x and y scales
    x.domain(d3.extent(groupedData, (d) => d.date));
    y.domain([0, d3.max(groupedData, (d) => d.runningTotal)]);
  
    // Define line generator
    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.runningTotal));
  
    // Generate line paths for each category
    categories.forEach((category) => {
      const categoryData = groupedData.filter((d) => d.category === category);
  
      // Append the line path
      svg
        .append('path')
        .datum(categoryData)
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', getColor(category))
        .style('fill', 'none');
    });
  
    // Append x-axis
    svg.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(x));
  
    // Append y-axis
    svg.append('g').call(d3.axisLeft(y));
  
    // Style the chart
    svg.selectAll('.line').style('stroke-width', '2px');
  
    // Sort the categories in descending order
    const sortedCategories = categories.sort((a, b) => {
      const order = ['Project', 'Tier 2', 'Tier 3', 'Tier 4', 'Base Volume'];
      return order.indexOf(b) - order.indexOf(a);
    });

    // Add a legend
    const legend = svg
      .selectAll('.legend')
      .data(sortedCategories)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (_, i) => `translate(0, ${i * 20})`);

   

    legend
      .append('rect')
      .attr('x', width - 18)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', getColor);
  
    legend
      .append('text')
      .attr('x', width - 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text((d) => d);
  }

  function lengthCategoriesOverTime(userTicksData) {

    function getColor(category) {
      switch (category) {
        case 'short':
          return 'blue';
        case 'medium':
          return 'green';
        case 'long':
          return 'orange';
        case 'multipitch':
          return 'red';
        default:
          return null; // Return null for unknown categories
      }
    }
  
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
          d.difficulty_category !== 'multipitch' &&
          d.discipline !== 'boulder' &&
          d.discipline !== 'trad' &&
          d.length_category !== null && // Exclude entries with unknown length categories
          d.length_category !== '' // Exclude entries with empty length categories
      )
      .map((d) => {
        return {
          date: parseDate(d.tick_date),
          category: d.length_category,
          pitches: d.pitches || 0,
        };
      });
  
    // Group the data by date and length category
    const groupedData = Array.from(
      d3.rollup(
        data,
        (group) => {
          const summedPitches = d3.sum(group, (d) => d.pitches);
          return {
            date: group[0].date,
            category: group[0].category,
            pitches: summedPitches,
          };
        },
        (d) => d3.timeFormat('%Y-%m-%d')(d.date) // Format the date as 'year-month-day' for grouping
      ),
      ([_, entry]) => entry
    );
  
    // Sort the data by date
    groupedData.sort((a, b) => a.date - b.date);
  
    // Calculate the running total for each category
    const runningTotals = {};
    groupedData.forEach((entry) => {
      const { category, pitches } = entry;
      if (!runningTotals[category]) {
        runningTotals[category] = 0;
      }
      runningTotals[category] += pitches;
      entry.runningTotal = runningTotals[category];
    });
  
    // Get unique length categories
    const categories = [...new Set(groupedData.map((d) => d.category))];
  
    // Remove null categories from the list
    const filteredCategories = categories.filter((category) => category !== null);
  
    // Set up the dimensions and margins for the chart
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
  
    // Create an SVG container
    const svg = d3
      .select('#types-length')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Set up the scales for x and y axes
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);
  
    // Set the domains for x and y scales
    x.domain(d3.extent(groupedData, (d) => d.date));
    y.domain([0, d3.max(groupedData, (d) => d.runningTotal)]);
  
    // Define line generator
    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.runningTotal));
  
    // Generate line paths for each category
    filteredCategories.forEach((category) => {
      const categoryData = groupedData.filter((d) => d.category === category);
  
      // Append the line path
      svg
        .append('path')
        .datum(categoryData)
        .attr('class', 'line')
        .attr('d', line)
        .style('stroke', getColor(category))
        .style('fill', 'none');
    });
  
    // Append x-axis
    svg.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(x));
  
    // Append y-axis
    svg.append('g').call(d3.axisLeft(y));
  
    // Style the chart
    svg.selectAll('.line').style('stroke-width', '2px');
  
    // Sort the categories in descending order
    const sortedCategories = filteredCategories.sort((a, b) => {
      const order = ['multipitch', 'long', 'medium', 'short'];
      return order.indexOf(b) - order.indexOf(a);
    });
  
    // Add a legend
    const legend = svg
      .selectAll('.legend')
      .data(sortedCategories)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (_, i) => `translate(0, ${i * 20})`);
  
    legend
      .append('rect')
      .attr('x', width - 18)
      .attr('width', 18)
      .attr('height', 18)
      .style('fill', getColor);
  
    legend
      .append('text')
      .attr('x', width - 24)
      .attr('y', 9)
      .attr('dy', '.35em')
      .style('text-anchor', 'end')
      .text((d) => d);
  }
 }
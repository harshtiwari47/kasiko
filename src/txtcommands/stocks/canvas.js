import { createCanvas } from '@napi-rs/canvas';
import { Chart, registerables } from 'chart.js';

// Register all necessary components
Chart.register(...registerables);

/**
 * Generate a stock price chart with values shown at each data point
 * @param {Object} stockData - Stock data containing price and other details
 * @returns {Buffer} - Image buffer of the stock chart
 */
export async function generateStockChart(stockData) {
  const { last10Prices, currentPrice } = stockData;

  // Canvas dimensions
  const width = 800;
  const height = 400;

  // Create the canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Configure the chart using Chart.js
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last10Prices.map((_, i) => `Point ${i + 1}`), // Label each point with a sequence
      datasets: [
        {
          label: 'Stock Prices',
          data: last10Prices,
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.2)',
          borderWidth: 2,
          pointBackgroundColor: '#ff0000',
          pointRadius: 5, // Bigger points for better visibility
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: 'Stock Price Chart',
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time Points',
          },
          type: 'category', // X-axis for time points
        },
        y: {
          title: {
            display: true,
            text: 'Price ($)',
          },
          ticks: {
            callback: (value) => `$${value.toFixed(2)}`, // Formatting the y-axis labels to show currency
          },
        },
      },
      // Disable the legend to remove the blue square
      plugins: {
        legend: {
          display: false, // Disable the legend if not needed
        },
      },
    },
  });

  // Manually add text to each point
  chart.data.datasets[0].data.forEach((value, index) => {
    const x = chart.scales.x.getPixelForValue(index);
    const y = chart.scales.y.getPixelForValue(value);
    ctx.fillStyle = '#000000'; // Text color
    ctx.font = '12px Arial';
    ctx.fillText(`$${value.toFixed(2)}`, x + 5, y - 10); // Draw price slightly above the point
  });

  // Render the chart and return the image buffer
  chart.update();
  return canvas.toBuffer('image/png');
}
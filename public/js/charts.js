/**
 * Great Goods — Store Sales Graphs (Chart.js wrapper)
 */

class StoreChartManager {
  constructor() {
    this.charts = {};
  }

  destroyAll() {
    Object.keys(this.charts).forEach(storeId => {
      if (this.charts[storeId]) {
        this.charts[storeId].destroy();
      }
    });
    this.charts = {};
  }

  initStoreChart(canvasId, store, products) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    if (this.charts[store.id]) {
      this.charts[store.id].destroy();
    }

    const labels = store.salesHistory ? store.salesHistory.labels : ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM'];

    const datasets = products.map(product => {
      const history = (store.salesHistory && store.salesHistory[product.id]) 
        ? store.salesHistory[product.id] 
        : [5, 8, 10, 7, 6];

      return {
        label: product.shortName || product.name,
        data: [...history],
        backgroundColor: product.color,
        borderColor: product.color,
        borderWidth: 1.5,
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      };
    });

    const ctx = canvas.getContext('2d');
    this.charts[store.id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 350
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#94a3b8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 10,
                weight: '600'
              },
              padding: 6
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 8,
            titleFont: { size: 11, weight: '700' },
            bodyFont: { size: 11 }
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 9,
                weight: '600'
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 9
              },
              stepSize: 5
            }
          }
        }
      }
    });
  }

  updateStoreChart(storeId, salesHistory) {
    const chart = this.charts[storeId];
    if (!chart || !salesHistory) return;

    if (salesHistory['prod-1']) chart.data.datasets[0].data = [...salesHistory['prod-1']];
    if (salesHistory['prod-2']) chart.data.datasets[1].data = [...salesHistory['prod-2']];
    if (salesHistory['prod-3']) chart.data.datasets[2].data = [...salesHistory['prod-3']];

    chart.update();
  }

  incrementSale(storeId, productId) {
    const chart = this.charts[storeId];
    if (!chart) return;

    const dataset = chart.data.datasets.find(ds => ds.label.toLowerCase().includes(productId === 'prod-1' ? 'sourdough' : (productId === 'prod-2' ? 'yogurt' : 'juice')));
    if (dataset && dataset.data.length > 0) {
      const lastIdx = dataset.data.length - 1;
      dataset.data[lastIdx] += 1;
      chart.update();
    }
  }
}

window.chartManager = new StoreChartManager();
